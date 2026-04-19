import React, { useState, useEffect } from "react";
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
import type { Card, PlayerId, GameState, GameMode } from "./types/spades";
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
  } = useGameState();

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
      console.log("=== ROOM_UPDATE RECEIVED ===", {
        roomId,
        players,
        playersLength: players?.length,
      });
      const mappedPlayers = Array.isArray(players)
        ? players.map((p: any) => ({
            id: p.id,
            name: p.name,
            seat: p.seat,
          }))
        : [];
      console.log("Setting currentRoom with:", { roomId, players: mappedPlayers });
      setCurrentRoom({
        id: roomId,
        players: mappedPlayers,
      });
    });

    sock.on("assigned_seat", ({ seat, roomId }: { seat: PlayerId; roomId: string }) => {
      console.log("=== ASSIGNED_SEAT RECEIVED ===", { seat, roomId });
      setYourSeat(seat);
      // Determine if user is host (first player in the room)
      // This is a simple check - in a real app, server should tell us
      setIsHost(seat === "north");
      console.log("Set yourSeat to:", seat);
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

        // If this is a new hand (state already exists), reset isHandOver
        // Otherwise, it's the initial game start
        if (state && state.round > 0) {
          console.log("New hand dealt - resetting isHandOver");
          applyServerStateNewHand(payload.initialGameState);
        } else {
          console.log("Initial game start");
          applyServerState(payload.initialGameState);
        }

        const seating = payload.seating || {};
        setSeatingNames({
          north: seating.north?.name || "North",
          east: seating.east?.name || "East",
          south: seating.south?.name || "South",
          west: seating.west?.name || "West",
        });

        console.log("Showing game start popup");
        setShowGameStartPopup(true);
        setTimeout(() => {
          console.log("Closing game start popup, showing bet popup");
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

  // Auto-deal next hand after current hand completes
  useEffect(() => {
    if (isHandOver && state && !isGameOver) {
      // Wait 2 seconds before dealing next hand so players can see results
      const timer = setTimeout(() => {
        console.log("Auto-dealing next hand...");
        // Notify server to deal next hand (for multiplayer)
        if (currentRoom) {
          socket?.emit("deal_next_hand", { roomId: currentRoom.id });
        } else {
          // For singleplayer, deal locally
          dealNextHand();
        }
        // Show betting popup for the new hand
        setTimeout(() => {
          setBetPopupOpen(true);
        }, 100);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isHandOver, state, isGameOver, dealNextHand, socket, currentRoom]);

  // Auto-play card after 1 second if player doesn't select
  useEffect(() => {
    if (!state || !yourSeat || state.turn !== yourSeat) return;

    // Get legal moves for current player
    const legalMovesForPlayer = legalMoves(state, yourSeat);
    if (legalMovesForPlayer.length === 0) return;

    const timer = setTimeout(() => {
      console.log("Auto-playing card for:", yourSeat);
      // Auto-play the lowest card (simple strategy)
      const cardValues: Record<string, number> = { A: 14, K: 13, Q: 12, J: 11, "10": 10, "9": 9, "8": 8, "7": 7, "6": 6, "5": 5, "4": 4, "3": 3, "2": 2 };
      const sortedCards = [...legalMovesForPlayer].sort((a, b) => (cardValues[a.rank as string] || 0) - (cardValues[b.rank as string] || 0));
      const cardToPlay = sortedCards[0];
      handlePlayCard(yourSeat, cardToPlay);
    }, 1000);

    return () => clearTimeout(timer);
  }, [state, yourSeat, currentRoom]);

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
  if (state && currentRoom && yourSeat && !isGameOver) {
    console.log("✓✓✓ Rendering TABLE - all conditions met! yourSeat:", yourSeat);
    return (
      <div className="fixed inset-0 bg-teal-800 overflow-hidden">
        {/* Your seat indicator */}
        <div className="absolute top-2 left-2 text-white px-2 py-1 bg-gray-800 rounded">
          You are: {yourSeat.toUpperCase()}
        </div>

        {/* Seating names */}
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-3 py-2 rounded flex gap-2 text-sm">
          {(["north", "east", "south", "west"] as PlayerId[]).map((p) => (
            <div key={p}>
              {p.toUpperCase()}: {seatingNames[p]}
              {yourSeat === p ? " (You)" : ""}
            </div>
          ))}
        </div>

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
            avatars={avatars}
            yourSeat={yourSeat}
          />
        )}

        {isGameOver && (
          <GameOverPopup
            totalScores={totalScores!}
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

        {!betPopupOpen && !isGameOver && (
          <>
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
              <span className="font-semibold">Your Bid:</span>{" "}
              {state.bids[yourSeat]}
            </div>
            <div className="absolute bottom-4 right-4 z-20">
              <Scoreboard
                bids={state.bids}
                tricksWon={state.tricksWon}
                nameMap={seatingNames}
                yourSeat={yourSeat}
              />
            </div>
          </>
        )}
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
