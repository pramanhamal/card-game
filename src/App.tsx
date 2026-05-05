import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useGameState } from "./hooks/useGameState";
import { Table } from "./components/Table";
import { Scoreboard } from "./components/Scoreboard";
import { BetPopup } from "./components/BetPopup";
import Dashboard from "./components/Dashboard";
import { GameOverPopup } from "./components/GameOverPopup";
import { NameInputPopup } from "./components/NameInputPopup";
import { Lobby } from "./components/Lobby";
import { GameModeScreen } from "./components/GameModeScreen";
import { PrivateTableModal } from "./components/PrivateTableModal";
import { WaitingRoom } from "./components/WaitingRoom";
import { MultiplayerLobby } from "./components/MultiplayerLobby";
import type { Card, PlayerId, GameState } from "./types/spades";
import { GameMode } from "./types/spades";
import { legalMoves } from "./utils/gameLogic";
import { SERVER_URL } from "./config";

interface Player {
  id: string;
  name: string;
  seat: string | null;
}

interface Room {
  id: string;
  players: Player[];
  started?: boolean;
  mode?: string;
}

const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [showGameModeScreen, setShowGameModeScreen] = useState(false);
  const [showPrivateTableModal, setShowPrivateTableModal] = useState(false);
  const [rooms, setRooms] = useState<Record<string, Room>>({});
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentRoomMode, setCurrentRoomMode] = useState<GameMode | null>(null);
  const [isHost, setIsHost] = useState(false);
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
    dealNextHand,
    applyServerState,
    applyServerStateNewHand,
    endGame,
    clearGame,
  } = useGameState();

  // Refs so auto-play timer always reads the latest values without stale closures
  const stateRef = useRef(state);
  const socketRef = useRef<Socket | null>(null);
  const currentRoomRef = useRef<Room | null>(null);
  // Guard to block stale room_update events during room transitions
  const leavingRoomRef = useRef(false);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { socketRef.current = socket; }, [socket]);
  useEffect(() => { currentRoomRef.current = currentRoom; }, [currentRoom]);

  useEffect(() => {
    const sock = io(SERVER_URL, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
    setSocket(sock);

    sock.on("rooms_update", (updated: any) => {
      const normalized: Record<string, Room> = {};
      Object.entries(updated).forEach(([id, r]: any) => {
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
      if (leavingRoomRef.current) {
        console.log(`[ROOM_UPDATE] Ignored — mid-transition`);
        return;
      }
      console.log("\n=== ROOM_UPDATE RECEIVED ===");
      console.log("Room ID:", roomId, "Players count:", players?.length);

      const mappedPlayers = Array.isArray(players)
        ? players.map((p: any) => ({ id: p.id, name: p.name, seat: p.seat }))
        : [];

      setCurrentRoom((prev) => {
        if (prev && prev.id !== roomId) return prev;
        return { id: roomId, players: mappedPlayers };
      });
    });

    sock.on("assigned_seat", ({ seat, roomId }: { seat: PlayerId; roomId: string }) => {
      console.log("=== ASSIGNED_SEAT RECEIVED ===", { seat, roomId });
      leavingRoomRef.current = false;
      setYourSeat(seat);
      setIsHost(seat === "north");
    });

    sock.on(
      "start_game",
      (payload: {
        room: any;
        initialGameState: GameState;
        seating: Record<string, { name: string; isAI: boolean }>;
      }) => {
        console.log("=== START_GAME EVENT RECEIVED ===", payload);
        console.log("Current socket ID:", sock.id);

        // Use payload data directly to avoid stale closure issues
        if (!payload.room || !payload.room.players) {
          console.error("Invalid start_game payload - missing room or players");
          return;
        }

        // Find OUR seat by matching our socket ID with the players list
        let ourSeat: PlayerId | null = null;
        for (const player of payload.room.players) {
          console.log("Checking player:", player.id, "against socket:", sock.id);
          // Match by socket ID - each player has a unique socket ID
          if (player.id === sock.id && player.seat) {
            ourSeat = player.seat as PlayerId;
            console.log("✓ Found OUR seat in payload:", ourSeat, "for socket:", sock.id);
            break;
          }
        }

        if (!ourSeat) {
          console.error("Could not find our seat in start_game payload", {
            socketId: sock.id,
            players: payload.room.players.map((p: any) => ({ id: p.id, seat: p.seat }))
          });
          return;
        }

        console.log("Setting game state with seat:", ourSeat);

        // Set all state at once
        setCurrentRoom({
          id: payload.room.id || "unknown",
          players: payload.room.players || [],
        });
        setYourSeat(ourSeat);

        // If this is a new hand (check payload round, not old state), reset isHandOver
        // Otherwise, it's the initial game start
        if (payload.initialGameState.round > 1) {
          if (payload.initialGameState.round >= 2) {
            console.log(`[Round ${payload.initialGameState.round}] ✓✓✓ NEW HAND DETECTED - closing previous popup and resetting isHandOver`);
          }
          // Close the previous betting popup before showing new hand
          setBetPopupOpen(false);
          applyServerStateNewHand(payload.initialGameState);
        } else {
          console.log("Initial game start (Round 1)");
          applyServerState(payload.initialGameState);
        }

        const seating = payload.seating || {};
        setSeatingNames({
          north: seating.north?.name || "North",
          east: seating.east?.name || "East",
          south: seating.south?.name || "South",
          west: seating.west?.name || "West",
        });

        if (payload.initialGameState.round >= 2) {
          console.log(`[Round ${payload.initialGameState.round}] start_game handler: Showing game start popup`);
        }
        setShowGameStartPopup(true);
        setTimeout(() => {
          if (payload.initialGameState.round >= 2) {
            console.log(`[Round ${payload.initialGameState.round}] start_game handler: 1.5s timeout fired, closing popup and showing betting popup`);
          }
          setShowGameStartPopup(false);
          setBetPopupOpen(true);
        }, 1500);
      }
    );

    sock.on("bidding_complete", ({ gameState }: { gameState: GameState }) => {
      console.log("[BIDDING_COMPLETE] All players have bid");
      applyServerState(gameState);
      setBetPopupOpen(false);
    });

    sock.on("game_state_update", (newState: GameState) => {
      try {
        const tricksCount = newState.tricksWon ? Object.values(newState.tricksWon).reduce((sum: number, tricks: number) => sum + tricks, 0) : 0;
        console.log(`[GAME_STATE_UPDATE] Tricks played: ${tricksCount}/13, Current turn: ${newState.turn}, Trick: ${JSON.stringify(newState.trick)}`);
      } catch (err) {
        console.log("[GAME_STATE_UPDATE] Error logging state:", err);
      }
      applyServerState(newState);
    });

    // Pong handler for heartbeat
    sock.on("pong", () => {
      console.log("[PING] Received pong from server");
    });

    // Send ping to server every 10 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      console.log("[PING] Sending ping to server");
      sock.emit("ping");
    }, 10000);

    return () => {
      clearInterval(pingInterval);
      sock.disconnect();
    };
  }, [applyServerState]);

  // Auto-deal next hand after current hand completes
  useEffect(() => {
    // Check if game will be over after this round (only auto-deal if game continues)
    const willGameEnd = gameHistory.length >= 2;

    if (isHandOver && state && !isGameOver && !willGameEnd) {
      if (state.round >= 2) {
        console.log(`[Round ${state.round}] Auto-deal effect triggered! isHandOver=${isHandOver}, waiting 2 seconds...`);
      }
      // Wait 2 seconds before dealing next hand so players can see results
      const timer = setTimeout(() => {
        if (state.round >= 2) {
          console.log(`[Round ${state.round}] Auto-deal 2-second timer fired, emitting deal_next_hand`);
        }
        // Notify server to deal next hand (for multiplayer)
        if (currentRoom) {
          socket?.emit("deal_next_hand", { roomId: currentRoom.id });
          // For multiplayer, the start_game event handler will show the betting popup
          // Don't show it here to avoid conflict with the popup shown in start_game handler
        } else {
          // For singleplayer, deal locally and show betting popup
          dealNextHand();
          // Show betting popup for the new hand
          setTimeout(() => {
            setBetPopupOpen(true);
          }, 1600); // Wait for game starting popup + delay
        }
      }, 2000);
      return () => clearTimeout(timer);
    } else if (willGameEnd && isHandOver) {
      console.log(`🎮 Game will end after this round - NOT setting up auto-deal`);
    }
  }, [isHandOver, state, isGameOver, dealNextHand, socket, currentRoom, gameHistory.length]);

  // End game after 2 rounds
  useEffect(() => {
    console.log(`🎯 [Game Over Check] gameHistory.length: ${gameHistory.length}, isGameOver: ${isGameOver}`);
    console.log(`   Game history rounds:`, gameHistory.map((g, i) => `[${i}] gameId=${g.gameId}`));
    if (gameHistory.length >= 2 && !isGameOver) {
      console.log("✅✅✅ GAME OVER! 2 rounds completed. Final scores:", totalScores);
      endGame();
    } else if (gameHistory.length >= 2) {
      console.log("⚠️  Game history has 2+ items but isGameOver already true, skipping endGame");
    }
  }, [gameHistory.length, isGameOver, endGame, totalScores]);

  // Auto-play card after 1 second if player doesn't select
  // Depend on totalTricksPlayed so the effect re-runs even when the same player wins consecutive tricks
  const totalTricksPlayed = state ? Object.values(state.tricksWon).reduce((a: number, b: number) => a + b, 0) : 0;
  const allBidsPlaced = state ? Object.values(state.bids).every((b) => (b as number) >= 0) : false;
  useEffect(() => {
    if (!state || !yourSeat || state.turn !== yourSeat) return;
    // Don't auto-play during the bidding phase — wait until everyone has bid
    if (!allBidsPlaced) return;

    console.log(`⏱️ [AUTO-PLAY] Timer set for ${yourSeat}, state.turn: ${state.turn}`);

    const timer = setTimeout(() => {
      console.log(`⏱️ [AUTO-PLAY] Timer fired for ${yourSeat}`);

      // Use stateRef to access CURRENT game state (not the stale state from when effect ran)
      const currentState = stateRef.current;
      console.log(`⏱️ [AUTO-PLAY] Current state turn: ${currentState?.turn}, yourSeat: ${yourSeat}`);

      if (!currentState || currentState.turn !== yourSeat) {
        console.log(`⏱️ [AUTO-PLAY] ❌ Cancelled: turn changed (${currentState?.turn} !== ${yourSeat}) or state invalid`);
        return;
      }

      const legalMovesForPlayer = legalMoves(currentState, yourSeat);
      console.log(`⏱️ [AUTO-PLAY] Legal moves available: ${legalMovesForPlayer.length}`);

      if (legalMovesForPlayer.length === 0) {
        console.log(`⏱️ [AUTO-PLAY] ❌ Cancelled: no legal moves`);
        return;
      }

      console.log(`⏱️ [AUTO-PLAY] ✅ Playing card for ${yourSeat}`);
      // Auto-play the lowest card (simple strategy)
      const cardValues: Record<string, number> = { A: 14, K: 13, Q: 12, J: 11, "10": 10, "9": 9, "8": 8, "7": 7, "6": 6, "5": 5, "4": 4, "3": 3, "2": 2 };
      const sortedCards = [...legalMovesForPlayer].sort((a, b) => (cardValues[a.rank as string] || 0) - (cardValues[b.rank as string] || 0));
      const cardToPlay = sortedCards[0];
      console.log(`⏱️ [AUTO-PLAY] Card to play: ${cardToPlay.rank}${cardToPlay.suit}`);
      const sock = socketRef.current;
      const room = currentRoomRef.current;
      if (!sock || !room) {
        console.log(`⏱️ [AUTO-PLAY] ❌ Cancelled: no socket or room`);
        return;
      }
      sock.emit("play_card", { roomId: room.id, card: cardToPlay });
    }, 1000);

    return () => {
      console.log(`⏱️ [AUTO-PLAY] Timer cleared for ${yourSeat}`);
      clearTimeout(timer);
    };
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
    socket?.emit("place_bid", {
      roomId: currentRoom.id,
      bid,
    });
    setBetPopupOpen(false);
  };

  const handlePlayCard = (player: PlayerId, card: Card) => {
    console.log(`🎴 [PLAY_CARD] Attempting to play ${card.rank}${card.suit} for ${player}`);
    if (!currentRoom) {
      console.log(`🎴 [PLAY_CARD] ❌ No room: currentRoom = ${currentRoom}`);
      return;
    }
    if (!socket) {
      console.log(`🎴 [PLAY_CARD] ❌ No socket connection`);
      return;
    }
    console.log(`🎴 [PLAY_CARD] ✅ Emitting play_card to room ${currentRoom.id}`);
    socket.emit("play_card", {
      roomId: currentRoom.id,
      card,
    });
  };

  const handleNewGame = () => {
    resetGame();
    setBetPopupOpen(true);
  };

  const handlePlayAgain = () => {
    console.log("🔄 Play Again - leaving current room and joining multiplayer queue");
    leavingRoomRef.current = true;
    socket?.emit("leave_room");
    clearGame();
    setCurrentRoom(null);
    setYourSeat(null);
    setGameMode(GameMode.MULTIPLAYER);
    setCurrentRoomMode(GameMode.MULTIPLAYER);
    socket?.emit("join_multiplayer_queue");
  };

  const handleJoinMultiplayer = () => {
    console.log("🔄 Joining multiplayer - resetting game");
    resetGame();
    setGameMode(null);
    setShowGameModeScreen(true);
  };

  const handleSelectGameMode = (mode: GameMode) => {
    console.log("handleSelectGameMode called with mode:", mode);
    setGameMode(mode);
    setCurrentRoomMode(mode);
    switch (mode) {
      case "singleplayer":
        console.log("Emitting create_singleplayer_game");
        socket?.emit("create_singleplayer_game");
        break;
      case "private_table":
        setShowPrivateTableModal(true);
        break;
      case "hotspot":
        console.log("Emitting join_hotspot");
        socket?.emit("join_hotspot");
        break;
      case "multiplayer":
        // Join the multiplayer queue (auto-matches with other players)
        console.log("Emitting join_multiplayer_queue, socket:", socket);
        socket?.emit("join_multiplayer_queue");
        break;
    }
  };

  const handleCreatePrivateTable = (pin: string) => {
    socket?.emit("create_private_table", { pin });
    setShowPrivateTableModal(false);
  };

  const handleJoinPrivateTable = (pin: string) => {
    // This is tricky - we need the roomId. For now, we'll emit and the server will handle it
    // In a real app, user would select from a list of private rooms
    socket?.emit("join_private_table", { roomId: "", pin });
    setShowPrivateTableModal(false);
  };

  const handleStartGame = () => {
    if (!currentRoom) return;
    socket?.emit("start_game_host", { roomId: currentRoom.id });
  };

  const handleLeaveRoom = () => {
    console.log("🚪 Leaving room - notifying server");
    socket?.emit("leave_room");
    setCurrentRoom(null);
    setCurrentRoomMode(null);
    setYourSeat(null);
    setGameMode(null);
    setShowGameModeScreen(true);
  };

  // **AVATAR URLS** — replace with your real paths
  const avatars: Record<PlayerId, string> = {
    north: "/images/harry.jpg",
    east: "/images/raja.jpg",
    south: "/images/you.jpg",
    west: "/images/ruby.jpg",
  };

  // --- RENDER LOGIC ---
  if (!playerName) {
    return <NameInputPopup onNameSubmit={handleNameSubmit} />;
  }

  if (!gameMode && !showGameModeScreen) {
    return <GameModeScreen onSelectMode={handleSelectGameMode} />;
  }

  if (showPrivateTableModal) {
    return (
      <PrivateTableModal
        onCreateTable={handleCreatePrivateTable}
        onJoinTable={handleJoinPrivateTable}
        onClose={() => setShowPrivateTableModal(false)}
      />
    );
  }

  console.log("=== RENDER CHECK ===", {
    hasState: !!state,
    hasCurrentRoom: !!currentRoom,
    hasYourSeat: !!yourSeat,
    yourSeat,
    isGameOver,
    showGameStartPopup,
    currentRoom: currentRoom?.id,
    gameMode,
    currentRoomMode,
  });

  // ** GAME TABLE: Show when game has started (highest priority) **
  // Also show when game is over so the GameOverPopup can display
  if (state && currentRoom && yourSeat) {
    console.log("✓✓✓ Rendering TABLE - all conditions met! yourSeat:", yourSeat);
    return (
      <div className="fixed inset-0 overflow-hidden">
        <Table
          state={state}
          playCard={handlePlayCard}
          you={yourSeat}
          onEvaluateTrick={evaluateAndAdvanceTrick}
          yourName={playerName}
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
            avatars={avatars}
            yourSeat={yourSeat}
          />
        )}

        {isGameOver && (
          <GameOverPopup
            totalScores={totalScores!}
            seatingNames={seatingNames}
            gameHistory={gameHistory}
            onPlayAgain={handlePlayAgain}
          />
        )}

        <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
          <button
            onClick={() => setDashboardOpen(true)}
            className="p-2 bg-gray-700 text-white rounded-full hover:bg-gray-600"
          >
            History
          </button>
          <button
            onClick={handleNewGame}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            New Game
          </button>
        </div>
      </div>
    );
  }

  // ** WAITING ROOM: for non-multiplayer modes while waiting for game to start **
  if (currentRoom && yourSeat && currentRoomMode !== "multiplayer") {
    // Show WaitingRoom for non-multiplayer modes while waiting for game to start
    if (!state) {
      return (
        <WaitingRoom
          roomId={currentRoom.id}
          players={currentRoom.players}
          currentPlayerSeat={yourSeat}
          isHost={isHost}
          mode={currentRoomMode || "multiplayer"}
          onStartGame={handleStartGame}
          onLeave={handleLeaveRoom}
        />
      );
    }
  }

  // ** MULTIPLAYER LOBBY: Show while in multiplayer room and game hasn't started **
  if (currentRoom && currentRoomMode === "multiplayer" && !state) {
    // Show lobby with visual table while players are joining
    // Show "Starting game..." popup when 4 players have joined
    return (
      <>
        {showGameStartPopup && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{
              background:
                "radial-gradient(ellipse at 50% 45%, #1e7a42 0%, #0d4222 60%, #050f08 100%)",
            }}
          >
            <div
              className="text-center px-10 py-8 rounded-2xl"
              style={{
                background: "rgba(0,0,0,0.55)",
                border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div className="text-5xl mb-4 animate-bounce">♠</div>
              <div className="text-2xl font-bold text-white">All players are in!</div>
              <div className="text-sm text-gray-400 mt-2">Starting the game…</div>
            </div>
          </div>
        )}
        <MultiplayerLobby
          rooms={rooms}
          currentRoom={currentRoom}
          yourSeat={yourSeat}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onLeaveRoom={handleLeaveRoom}
        />
      </>
    );
  }

  if (showGameStartPopup) {
    // Show popup for non-multiplayer modes
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, #1e7a42 0%, #0d4222 60%, #050f08 100%)",
        }}
      >
        <div
          className="text-center px-10 py-8 rounded-2xl"
          style={{
            background: "rgba(0,0,0,0.55)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div className="text-5xl mb-4 animate-bounce">♠</div>
          <div className="text-2xl font-bold text-white">All players are in!</div>
          <div className="text-sm text-gray-400 mt-2">Starting the game…</div>
        </div>
      </div>
    );
  }

  if (gameMode === "multiplayer") {
    // Initial lobby view - show available rooms
    return (
      <MultiplayerLobby
        rooms={rooms}
        currentRoom={null}
        yourSeat={null}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  return (
    <GameModeScreen onSelectMode={handleSelectGameMode} />
  );
};

export default App;
