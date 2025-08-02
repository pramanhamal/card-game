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

  const {
    rooms,
    joinedRoom,
    setJoinedRoom,
    playerId,
    hand,
    bids,
    tricksWon,
    currentTurnSeat,
    currentTrick,
    gameStarted,
    createRoom,
    joinRoom,
    placeBid,
    playCard,
  } = useMultiplayerGameState(null, playerName);

  useEffect(() => {
    setPlayerName(playerName);
  }, [playerName]);

  useEffect(() => {
    if (gameStarted) {
      setBetPopupOpen(true);
    }
  }, [gameStarted]);

  const handleBetSelect = (n: number) => {
    placeBid(n);
    setBetPopupOpen(false);
  };

  const you = playerId || "south";

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
      north: [], // placeholder
      east: [],
      south: hand,
      west: [],
    },
    round: 0,
  };

  return (
    <div className="fixed inset-0 bg-teal-800 overflow-hidden">
      {/* Room creation/join panel */}
      <div className="absolute top-4 left-4 z-40 p-4 bg-white rounded shadow max-w-sm">
        <div className="mb-2">
          <label className="block">
            Name:{" "}
            <input
              value={playerName}
              onChange={(e) => setPlayerNameLocal(e.target.value)}
              className="border px-2"
            />
          </label>
        </div>
        <div className="flex gap-2 mb-2">
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
            className="border px-2 flex-grow"
          />
          <button
            onClick={() => {
              joinRoom(roomIdInput);
              setJoinedRoom(roomIdInput);
            }}
            className="px-3 py-1 bg-green-500 text-white rounded"
          >
            Join
          </button>
        </div>
        {joinedRoom && (
          <div className="mb-1 text-sm">
            In room: <strong>{joinedRoom}</strong>
          </div>
        )}
        <div>
          <div className="font-semibold text-xs mb-1">Available Rooms</div>
          <div className="max-h-40 overflow-y-auto">
            {Object.entries(rooms).map(([id, room]) => (
              <div
                key={id}
                className="flex justify-between items-center mb-1 p-1 border rounded"
              >
                <div>
                  <div className="text-[11px]">ID: {id}</div>
                  <div className="text-[10px]">
                    Players: {room.players?.length || 0}/4
                  </div>
                </div>
                <button
                  onClick={() => {
                    joinRoom(id);
                    setJoinedRoom(id);
                  }}
                  className="px-2 py-1 bg-indigo-600 text-white rounded text-xs"
                >
                  Join
                </button>
              </div>
            ))}
            {Object.keys(rooms).length === 0 && (
              <div className="text-[12px] text-gray-600">No rooms yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Main game UI */}
      <Table
        state={syntheticState}
        playCard={(card: any) => playCard(card)}
        you={you}
        onEvaluateTrick={() => {}}
      />

      {betPopupOpen && <BetPopup onSelect={handleBetSelect} />}
      {dashboardOpen && <Dashboard history={[]} onClose={() => setDashboardOpen(false)} />}
      {/* Add your GameOverPopup if appropriate */}

      <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
        <button
          onClick={() => setDashboardOpen(true)}
          className="p-2 bg-gray-700 text-white rounded-full hover:bg-gray-600"
          aria-label="Show Game History"
        >
          📜
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
