// src/App.tsx
import React, { useState, useEffect } from "react";
import { Table } from "./components/Table";
import { Scoreboard } from "./components/Scoreboard";
import { BetPopup } from "./components/BetPopup";
import { Dashboard } from "./components/Dashboard";
import { GameOverPopup } from "./components/GameOverPopup";
import { useMultiplayerGameState } from "./hooks/useMultiplayerGameState";
import socket, { setPlayerName } from "./services/socket";

const App: React.FC = () => {
  const [playerName, setPlayerNameLocal] = useState("Player");
  const [betPopupOpen, setBetPopupOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState("");
  const [joinedRoom, setJoinedRoom] = useState<string | null>(null);

  const {
    playerId,
    seating,
    hand,
    currentTurnSeat,
    tricksWon,
    bids,
    gameStarted,
    currentTrick,
    createRoom,
    joinRoom,
    placeBid,
    playCard,
  } = useMultiplayerGameState(joinedRoom, playerName);

  // Sync player name
  useEffect(() => {
    setPlayerName(playerName);
  }, [playerName]);

  // Show bet popup when game starts
  useEffect(() => {
    if (gameStarted) {
      setBetPopupOpen(true);
    }
  }, [gameStarted]);

  const handleBetSelect = (n: number) => {
    placeBid(n);
    setBetPopupOpen(false);
  };

  const you = playerId || "south"; // PlayerId type

  const syntheticState: any = {
    bids: {
      south: bids?.south ?? 0,
      north: bids?.north ?? 0,
      east: bids?.east ?? 0,
      west: bids?.west ?? 0,
    },
    tricksWon: {
      south: tricksWon?.south ?? 0,
      north: tricksWon?.north ?? 0,
      east: tricksWon?.east ?? 0,
      west: tricksWon?.west ?? 0,
    },
    trick: currentTrick,
    turn: currentTurnSeat,
    hands: {
      north: [], // you could pass remaining card counts or leave empty if Table infers from tricksWon
      east: [],
      south: hand,
      west: [],
    },
    round: 0, // adapt if your game uses round
    // include any other fields your Table needs
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
        playCard={(card: any) => playCard(card)}
        you={you}
        onEvaluateTrick={() => {
          /* no-op: server handles it */
        }}
      />

      {betPopupOpen && <BetPopup onSelect={handleBetSelect} />}
      {dashboardOpen && <Dashboard history={[]} onClose={() => setDashboardOpen(false)} />}
      {/* Add GameOverPopup if you have game-over detection */}

      <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
        <button
          onClick={() => setDashboardOpen(true)}
          className="p-2 bg-gray-700 text-white rounded-full hover:bg-gray-600"
          aria-label="Show Game History"
        >
          📜
        </button>
        <button
          onClick={() => {
            // new game logic
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          New Game
        </button>
      </div>

      {gameStarted && (
        <>
          <div className="absolute top-4 left-4 z-20 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
            <span className="font-semibold">Your Bid:</span> {syntheticState.bids.south}
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
