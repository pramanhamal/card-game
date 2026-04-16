import React, { useState, useEffect } from "react";
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
    applyServerState,
  } = useGameState();

  useEffect(() => {
    const sock = io(SERVER_URL, {
      path: "/socket.io",
      transports: ["websocket"],
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
      setCurrentRoom({
        id: roomId,
        players: players.map((p: any) => ({
          id: p.id,
          name: p.name,
          seat: p.seat,
        })),
      });
    });

    sock.on("assigned_seat", ({ seat }: { seat: PlayerId }) => {
      setYourSeat(seat);
    });

    sock.on(
      "start_game",
      (payload: {
        room: any;
        initialGameState: GameState;
        seating: Record<string, { name: string; isAI: boolean }>;
      }) => {
        setCurrentRoom(payload.room);
        applyServerState(payload.initialGameState);

        const seating = payload.seating || {};
        setSeatingNames({
          north: seating.north?.name || "North",
          east: seating.east?.name || "East",
          south: seating.south?.name || "South",
          west: seating.west?.name || "West",
        });

        setShowGameStartPopup(true);
        setTimeout(() => {
          setShowGameStartPopup(false);
          setBetPopupOpen(true);
        }, 1500);
      }
    );

    sock.on("game_state_update", (newState: GameState) => {
      applyServerState(newState);
    });

    return () => {
      sock.disconnect();
    };
  }, [applyServerState]);

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
    socket?.emit("place_bid", {
      roomId: currentRoom.id,
      bid,
    });
    setBetPopupOpen(false);
  };

  const handlePlayCard = (player: PlayerId, card: Card) => {
    if (!currentRoom || !yourSeat) return;
    socket?.emit("play_card", {
      roomId: currentRoom.id,
      card,
    });
  };

  const handleNewGame = () => {
    resetGame();
    setBetPopupOpen(true);
  };

  const handlePlayAgain = () => {
    resetGame();
    setBetPopupOpen(true);
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

  if (state && currentRoom && yourSeat && !isGameOver) {
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

            {betPopupOpen && <BetPopup onSelect={handlePlaceBid} />}

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
