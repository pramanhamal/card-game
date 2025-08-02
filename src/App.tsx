// src/App.tsx
import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

import { useGameState } from "./hooks/useGameState";
import { Table } from "./components/Table";
import { Scoreboard } from "./components/Scoreboard";
import { BetPopup } from "./components/BetPopup";
import { Dashboard } from "./components/Dashboard";
import { GameOverPopup } from "./components/GameOverPopup";
import { NameInputPopup } from "./components/NameInputPopup";
import { Lobby } from "./components/Lobby";
import type { Card, PlayerId, GameState } from "./types/spades";

// fixed server URL
const SERVER_URL = "https://call-break-server.onrender.com";

interface Player {
  id: string;
  name: string;
}
interface Room {
  id: string;
  players: Player[];
  started?: boolean;
}

const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [rooms, setRooms] = useState<Record<string, Room>>({});
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [showGameStartPopup, setShowGameStartPopup] = useState(false);
  const [betPopupOpen, setBetPopupOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);

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

  // connect once
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
        normalized[id] = { id, players: r.players, started: r.hasStarted };
      });
      setRooms(normalized);
    });

    sock.on("room_created", ({ roomId, room }: any) => {
      setCurrentRoom({ id: roomId, players: room.players });
    });

    sock.on("joined_room", ({ roomId, room }: any) => {
      setCurrentRoom({ id: roomId, players: room.players });
    });

    sock.on("room_update", ({ roomId, players }: any) => {
      setCurrentRoom({ id: roomId, players });
    });

    sock.on("player_joined", ({ name }: any) => {
      // optional toast/banner
      console.log(`${name} joined`);
    });

    sock.on("start_game", (payload: { room: any; initialGameState: GameState }) => {
      setCurrentRoom(payload.room);
      applyServerState(payload.initialGameState);
      setShowGameStartPopup(true);
      setTimeout(() => {
        setShowGameStartPopup(false);
        setBetPopupOpen(true); // open bidding popup
      }, 1500);
    });

    sock.on("game_state_update", (newState: GameState) => {
      applyServerState(newState);
    });

    return () => {
      sock.disconnect();
    };
  }, [applyServerState]);

  // emitters
  const handleNameSubmit = (name: string) => {
    setPlayerName(name);
    socket?.emit("set_player_name", name);
  };

  const handleCreateRoom = () => {
    socket?.emit("create_room");
  };

  const handleJoinRoom = (roomId: string) => {
    socket?.emit("join_room", roomId);
    setCurrentRoom((prev) => (prev ? { id: roomId, players: prev.players } : null));
  };

  const handlePlaceBid = (bid: number) => {
    if (!currentRoom) return;
    placeBid("south", bid);
    socket?.emit("place_bid", {
      roomId: currentRoom.id,
      playerId: "south",
      bid,
    });
    setBetPopupOpen(false);
  };

  const handlePlayCard = (player: PlayerId, card: Card) => {
    if (!currentRoom) return;
    socket?.emit("play_card", {
      roomId: currentRoom.id,
      playerId: player,
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

  // UI flow
  if (!playerName) {
    return <NameInputPopup onNameSubmit={handleNameSubmit} />;
  }

  if (showGameStartPopup) {
    return (
      <div className="fixed inset-0 bg-teal-800 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl text-2xl font-bold animate-pulse">
          All players are in! Starting the game...
        </div>
      </div>
    );
  }

  if (state && currentRoom && !isGameOver) {
    return (
      <div className="fixed inset-0 bg-teal-800 overflow-hidden">
        <Table
          state={state}
          playCard={handlePlayCard}
          you="south"
          onEvaluateTrick={evaluateAndAdvanceTrick}
        />

        {betPopupOpen && <BetPopup onSelect={handlePlaceBid} />}

        {dashboardOpen && (
          <Dashboard history={gameHistory} onClose={() => setDashboardOpen(false)} />
        )}
        {isGameOver && (
          <GameOverPopup totalScores={totalScores} onPlayAgain={handlePlayAgain} />
        )}

        <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
          <button
            onClick={() => setDashboardOpen(true)}
            className="p-2 bg-gray-700 text-white rounded-full hover:bg-gray-600"
            aria-label="Show Game History"
          >
            {/* icon */}
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
              <span className="font-semibold">Your Bid:</span> {state.bids.south}
            </div>
            <div className="absolute bottom-4 right-4 z-20">
              <Scoreboard
                bids={state.bids}
                tricksWon={state.tricksWon}
              />
            </div>
          </>
        )}
      </div>
    );
  }

  if (currentRoom) {
    return (
      <div className="fixed inset-0 bg-teal-800 flex items-center justify-center text-white text-2xl">
        <div className="bg-black bg-opacity-50 p-10 rounded-lg text-center shadow-lg">
          <h2 className="text-3xl font-bold mb-4">
            Room: {currentRoom.players[0]?.name}'s Game
          </h2>
          <p className="mb-6">
            Waiting for players... ({currentRoom.players.length}/4)
          </p>
          <div className="space-y-2">
            {currentRoom.players.map((p) => (
              <p key={p.id}>{p.name} has joined.</p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Lobby
      rooms={rooms}
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
    />
  );
};

export default App;
