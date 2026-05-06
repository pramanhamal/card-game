import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { io, Socket } from "socket.io-client";

import { useGameState } from "./src/hooks/useGameState";
import { Table } from "./src/components/Table";
import { Scoreboard } from "./src/components/Scoreboard";
import { BetPopup } from "./src/components/BetPopup";
import Dashboard from "./src/components/Dashboard";
import { GameOverPopup } from "./src/components/GameOverPopup";
import { NameInputPopup } from "./src/components/NameInputPopup";
import { Lobby } from "./src/components/Lobby";
import type { Card, PlayerId, GameState } from "./src/types/spades";
import { legalMoves } from "./src/utils/gameLogic";
import { SERVER_URL } from "./src/config";

interface Player {
  id: string;
  name: string;
  seat?: string;
}

interface Room {
  id: string;
  players: Player[];
  started?: boolean;
}

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [rooms, setRooms] = useState<Record<string, Room>>({});
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [yourSeat, setYourSeat] = useState<PlayerId | null>(null);
  const [showGameStartPopup, setShowGameStartPopup] = useState(false);
  const [betPopupOpen, setBetPopupOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [seatingNames, setSeatingNames] = useState<Record<PlayerId, string>>({
    north: "North",
    east: "East",
    south: "South",
    west: "West",
  });

  // Refs for use inside socket handlers (avoid stale closures)
  const stateRef = useRef<GameState | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const currentRoomRef = useRef<Room | null>(null);
  const yourSeatRef = useRef<PlayerId | null>(null);
  const betPopupOpenRef = useRef(false);
  // Guard to block stale room_update events during room transitions
  const leavingRoomRef = useRef(false);

  const {
    state,
    isHandOver,
    isGameOver,
    gameHistory,
    totalScores,
    startGame,
    placeBid,
    playCard,
    evaluateAndAdvanceTrick,
    resetGame,
    dealNextHand,
    applyServerState,
    applyServerStateNewHand,
    endGame,
    clearGame,
  } = useGameState();

  // Keep refs in sync with state
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { socketRef.current = socket; }, [socket]);
  useEffect(() => { currentRoomRef.current = currentRoom; }, [currentRoom]);
  useEffect(() => { yourSeatRef.current = yourSeat; }, [yourSeat]);
  useEffect(() => { betPopupOpenRef.current = betPopupOpen; }, [betPopupOpen]);

  useEffect(() => {
    const sock = io(SERVER_URL, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
    setSocket(sock);

    sock.on("rooms_update", (updated: Record<string, any>) => {
      const normalized: Record<string, Room> = {};
      Object.entries(updated).forEach(([id, r]: [string, any]) => {
        normalized[id] = {
          id,
          players: r.players.map((p: any) => ({
            id: p.id,
            name: p.name,
            seat: p.seat,
          })),
          started: r.hasStarted,
        };
      });
      setRooms(normalized);
    });

    sock.on("room_update", ({ roomId, players }: any) => {
      if (leavingRoomRef.current) return;
      const mappedPlayers = Array.isArray(players)
        ? players.map((p: any) => ({ id: p.id, name: p.name, seat: p.seat }))
        : [];
      setCurrentRoom((prev) => {
        if (prev && prev.id !== roomId) return prev;
        return { id: roomId, players: mappedPlayers };
      });
    });

    sock.on("assigned_seat", ({ seat }: { seat: PlayerId }) => {
      leavingRoomRef.current = false;
      setYourSeat(seat);
    });

    sock.on(
      "start_game",
      (payload: {
        room: any;
        initialGameState: GameState;
        seating: Record<string, { name: string; isAI: boolean }>;
      }) => {
        if (!payload.room || !payload.room.players) return;

        setCurrentRoom({
          id: payload.room.id || "unknown",
          players: payload.room.players || [],
        });

        // For round 2+, reset hand state for new round
        if (payload.initialGameState.round > 1) {
          setBetPopupOpen(false);
          applyServerStateNewHand(payload.initialGameState);
        } else {
          applyServerState(payload.initialGameState);
        }

        const seating = payload.seating || {};
        setSeatingNames({
          north: seating.north?.name || "North",
          east: seating.east?.name || "East",
          south: seating.south?.name || "South",
          west: seating.west?.name || "West",
        });

        setBetPopupOpen(false);
        setShowGameStartPopup(true);
        const expectedRound = payload.initialGameState.round;
        setTimeout(() => {
          setShowGameStartPopup(false);
          const cur = stateRef.current;
          const seat = yourSeatRef.current;
          if (!cur || cur.round !== expectedRound) return;
          const biddingActive =
            seat &&
            cur.turn === seat &&
            Object.values(cur.bids).some((b) => (b as number) < 0);
          if (biddingActive && !betPopupOpenRef.current) {
            setBetPopupOpen(true);
          }
        }, 1500);
      }
    );

    sock.on("bidding_complete", ({ gameState }: { gameState: GameState }) => {
      applyServerState(gameState);
      setBetPopupOpen(false);
    });

    sock.on("game_state_update", (newState: GameState) => {
      applyServerState(newState);
      const seat = yourSeatRef.current;
      const isBiddingRound = Object.values(newState.bids).some(
        (b) => (b as number) < 0
      );
      if (seat && newState.turn === seat && isBiddingRound && !betPopupOpenRef.current) {
        setBetPopupOpen(true);
      }
    });

    sock.on("pong", () => {});

    // Keepalive heartbeat
    const pingInterval = setInterval(() => {
      sock.emit("ping");
    }, 10000);

    return () => {
      clearInterval(pingInterval);
      sock.disconnect();
    };
  }, [applyServerState]);

  // Auto-deal next hand after current hand completes
  useEffect(() => {
    const willGameEnd = gameHistory.length >= 2;

    if (isHandOver && state && !isGameOver && !willGameEnd) {
      const timer = setTimeout(() => {
        if (currentRoomRef.current) {
          socketRef.current?.emit("deal_next_hand", {
            roomId: currentRoomRef.current.id,
          });
        } else {
          dealNextHand();
          setTimeout(() => setBetPopupOpen(true), 1600);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isHandOver, state, isGameOver, dealNextHand, gameHistory.length]);

  // End game after 2 rounds
  useEffect(() => {
    if (gameHistory.length >= 2 && !isGameOver) {
      endGame();
    }
  }, [gameHistory.length, isGameOver, endGame]);

  // Auto-play card after 1 second if player doesn't act
  const totalTricksPlayed = state
    ? Object.values(state.tricksWon).reduce((a: number, b: number) => a + b, 0)
    : 0;
  const allBidsPlaced = state
    ? Object.values(state.bids).every((b) => (b as number) >= 0)
    : false;

  useEffect(() => {
    if (!state || !yourSeat || state.turn !== yourSeat) return;
    if (!allBidsPlaced) return;

    const timer = setTimeout(() => {
      const currentState = stateRef.current;
      if (!currentState || currentState.turn !== yourSeat) return;

      const legal = legalMoves(currentState, yourSeat);
      if (legal.length === 0) return;

      const cardValues: Record<string, number> = {
        A: 14, K: 13, Q: 12, J: 11,
        "10": 10, "9": 9, "8": 8, "7": 7,
        "6": 6, "5": 5, "4": 4, "3": 3, "2": 2,
      };
      const sorted = [...legal].sort(
        (a, b) => (cardValues[String(a.rank)] || 0) - (cardValues[String(b.rank)] || 0)
      );

      const sock = socketRef.current;
      const room = currentRoomRef.current;
      if (!sock || !room) return;
      sock.emit("play_card", { roomId: room.id, card: sorted[0] });
    }, 1000);

    return () => clearTimeout(timer);
  }, [state?.turn, yourSeat, totalTricksPlayed, allBidsPlaced]);

  const handleNameSubmit = (name: string) => {
    setPlayerName(name);
    socket?.emit("set_player_name", name);
  };

  const handleCreateRoom = () => {
    socket?.emit("create_room");
  };

  const handleJoinRoom = (roomId: string) => {
    socket?.emit("join_room", roomId);
  };

  const handlePlaceBid = (bid: number) => {
    if (!currentRoom || !yourSeat) return;
    placeBid(yourSeat, bid);
    socket?.emit("place_bid", { roomId: currentRoom.id, bid });
    setBetPopupOpen(false);
  };

  const handlePlayCard = (player: PlayerId, card: Card) => {
    if (!currentRoom || !socket) return;
    socket.emit("play_card", { roomId: currentRoom.id, card });
  };

  const handlePlayAgain = () => {
    leavingRoomRef.current = true;
    socket?.emit("leave_room");
    clearGame();
    setCurrentRoom(null);
    setYourSeat(null);
    socket?.emit("join_multiplayer_queue");
  };

  // --- RENDER LOGIC ---
  if (!playerName) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <NameInputPopup onNameSubmit={handleNameSubmit} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  if (showGameStartPopup) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <LinearGradient
            colors={["#1e7a42", "#0d4222", "#050f08"]}
            style={styles.root}
          >
            <View style={styles.gameStartContainer}>
              <Text style={styles.gameStartSpade}>♠</Text>
              <Text style={styles.gameStartTitle}>All players are in!</Text>
              <Text style={styles.gameStartSubtitle}>Starting the game…</Text>
            </View>
          </LinearGradient>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  if (!yourSeat && currentRoom) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <View style={styles.waitingContainer}>
            <View style={styles.waitingBox}>
              <ActivityIndicator color="white" style={{ marginBottom: 8 }} />
              <Text style={styles.waitingText}>Waiting for seat assignment...</Text>
            </View>
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  if (state && currentRoom && yourSeat) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <View style={styles.root}>
            <Table
              state={state}
              playCard={handlePlayCard}
              you={yourSeat}
              onEvaluateTrick={evaluateAndAdvanceTrick}
              nameMap={{
                north: seatingNames.north,
                east: seatingNames.east,
                south: seatingNames.south,
                west: seatingNames.west,
              }}
            />

            {betPopupOpen && (
              <BetPopup
                onSelect={handlePlaceBid}
                hand={state?.hands?.[yourSeat] || []}
              />
            )}

            {dashboardOpen && (
              <Dashboard
                history={gameHistory}
                onClose={() => setDashboardOpen(false)}
                playerNames={seatingNames}
                yourSeat={yourSeat}
              />
            )}

            {isGameOver && (
              <GameOverPopup
                totalScores={totalScores}
                seatingNames={seatingNames}
                gameHistory={gameHistory}
                onPlayAgain={handlePlayAgain}
              />
            )}
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  if (currentRoom) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <View style={styles.waitingRoomContainer}>
            <View style={styles.waitingRoomBox}>
              <Text style={styles.waitingRoomTitle}>
                {currentRoom.players[0]?.name
                  ? `${currentRoom.players[0].name}'s Game`
                  : "Waiting Room"}
              </Text>
              <Text style={styles.waitingRoomSubtitle}>
                Waiting for players... ({currentRoom.players.length}/4)
              </Text>
              {currentRoom.players.map((p) => (
                <Text key={p.id} style={styles.waitingRoomPlayer}>
                  {p.name} {p.seat ? `(${p.seat})` : ""} has joined.
                </Text>
              ))}
            </View>
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <Lobby
          rooms={rooms}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  gameStartContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    margin: 40,
    borderRadius: 20,
    padding: 40,
  },
  gameStartSpade: {
    fontSize: 48,
    marginBottom: 16,
    color: "white",
  },
  gameStartTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  gameStartSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
  },
  waitingContainer: {
    flex: 1,
    backgroundColor: "#0d4222",
    alignItems: "center",
    justifyContent: "center",
  },
  waitingBox: {
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  waitingText: {
    color: "white",
    fontSize: 16,
  },
  waitingRoomContainer: {
    flex: 1,
    backgroundColor: "#0d4222",
    alignItems: "center",
    justifyContent: "center",
  },
  waitingRoomBox: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 40,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 300,
  },
  waitingRoomTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  waitingRoomSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    marginBottom: 16,
  },
  waitingRoomPlayer: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginTop: 4,
  },
});
