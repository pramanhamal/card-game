// src/App.tsx
import React, { useState, useEffect } from "react";
import { Table } from "./components/Table";
import { Scoreboard } from "./components/Scoreboard";
import { BetPopup } from "./components/BetPopup";
import { Dashboard } from "./components/Dashboard";
import { GameOverPopup } from "./components/GameOverPopup";
import { useMultiplayerGameState } from "./hooks/useMultiplayerGameState";
import socket, { setPlayerName } from "./services/socket";

// Define/align with whatever PlayerId type your Table expects.
// If your codebase already exports PlayerId, replace this with an import.
type PlayerId = "north" | "east" | "south" | "west";
type Seat = "North" | "East" | "South" | "West";

const seatToPlayerId = (s: Seat): PlayerId => {
  switch (s) {
    case "North":
      return "north";
    case "East":
      return "east";
    case "South":
      return "south";
    case "West":
      return "west";
  }
};

const App: React.FC = () => {
  const [playerName, setPlayerNameLocal] = useState("Player");
  const [betPopupOpen, setBetPopupOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState("");
  const [joinedRoom, setJoinedRoom] = useState<string | null>(null);

  const {
    seat,
    seating,
    hand,
    currentTurnSeat,
    tricksWon,
    bids,
    gameStarted,
    createRoom,
    joinRoom,
    placeBid,
    playCard,
  } = useMultiplayerGameState(joinedRoom, playerName);

  // When game starts, show bet popup
  useEffect(() => {
    if (gameStarted) {
      setBetPopupOpen(true);
    }
  }, [gameStarted]);

  // Sync player name to server
  useEffect(() => {
    setPlayerName(playerName);
  }, [playerName]);

  const handleBetSelect = (n: number) => {
    placeBid(n);
    setBetPopupOpen(false);
  };

  const handleNewGame = () => {
    if (joinedRoom) {
      // Optionally implement a reset on server; fallback is to recreate a room:
      createRoom();
      setJoinedRoom(null);
    }
  };

  // Map seat to the PlayerId type expected by Table
  const you: PlayerId = seat ? seatToPlayerId(seat) : "south";

  // Build the state object to satisfy your existing Table/Scoreboard API
  const syntheticState: any = {
    bids: {
      south: bids.South ?? 0,
      north: bids.North ?? 0,
      east: bids.East ?? 0,
      west: bids.West ?? 0,
    },
    tricksWon: {
      south: tricksWon.South,
      north: tricksWon.North,
      east: tricksWon.East,
      west: tricksWon.West,
    },
    hand, // assuming Table picks your hand based on `you`
    currentTurn: currentTurnSeat ? currentTurnSeat.toLowerCase() : undefined,
    seating, // if your UI shows opponent names
    // add other fields your Table expects if necessary
  };

  return (
    <div className="fixed inset-0 bg-teal-800 overflow-hidden">
      {!joinedRoom && (
        <div className="absolute top-4 left-4 z-30 p-4 bg-white rounded shadow">
          <div>
            <label>
              Name:{" "}
              <input
                value={playerName}
                onChange={(e) => setPlayerNameLocal(e.target.value)}
                className="border px-2"
              />
            </label>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => {
                createRoom();
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded"
            >
              Create Room
            </button>
            <input
              placeholder="Room ID"
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value)}
              className="border px-2"
            />
            <button
              onClick={() => {
                joinRoom(roomIdInput);
                setJoinedRoom(roomIdInput);
              }}
              className="px-3 py-1 bg-green-500 text-white rounded"
            >
              Join Room
            </button>
          </div>
        </div>
      )}

      <Table
        state={syntheticState}
        playCard={(card: any) => {
          playCard(card);
        }}
        you={you}
        onEvaluateTrick={() => {
          /* server handles trick resolution */
        }}
      />

      {betPopupOpen && <BetPopup onSelect={handleBetSelect} />}
      {dashboardOpen && <Dashboard history={[]} onClose={() => setDashboardOpen(false)} />}
      {/* Game over logic can be driven by comparing bids vs tricksWon / scores */}
      {/*
        <GameOverPopup totalScores={...} onPlayAgain={...} />
      */}

      <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
        <button
          onClick={() => setDashboardOpen(true)}
          className="p-2 bg-gray-700 text-white rounded-full hover:bg-gray-600"
          aria-label="Show Game History"
        >
          📜
        </button>
        <button
          onClick={handleNewGame}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          New Game
        </button>
      </div>

      {gameStarted && (
        <>
          <div className="absolute top-4 left-4 z-20 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
            <span className="font-semibold">Your Bid:</span>{" "}
            {syntheticState.bids.south}
          </div>
          <div className="absolute bottom-4 right-4 z-20">
            <Scoreboard bids={syntheticState.bids} tricksWon={syntheticState.tricksWon} />
          </div>
        </>
      )}
    </div>
  );
};

export default App;
