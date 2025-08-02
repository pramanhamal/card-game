// src/App.tsx
import React, { useState, useEffect } from "react";
import { Table } from "./components/Table";
import { Scoreboard } from "./components/Scoreboard";
import { BetPopup } from "./components/BetPopup";
import { Dashboard } from "./components/Dashboard";
import { GameOverPopup } from "./components/GameOverPopup";
import { useMultiplayerGameState, PlayerId } from "./hooks/useMultiplayerGameState";
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

  // Sync the name to server
  useEffect(() => {
    setPlayerName(playerName);
  }, [playerName]);

  // Show bet popup at start of hand/game
  useEffect(() => {
    if (gameStarted) {
      setBetPopupOpen(true);
    }
  }, [gameStarted]);

  const handleBetSelect = (n: number) => {
    placeBid(n);
    setBetPopupOpen(false);
  };

  // Determine "you" for Table (fallback to south)
  const you: PlayerId = playerId || "south";

  // Build synthetic state for Table/Scoreboard with safe defaults
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
      north: [], // you could pass real hands if known / inferred
      east: [],
      south: hand,
      west: [],
    },
    round: 0,
  };

  return (
    <div className="fixed inset-0 bg-teal-800 overflow-hidden">
      {/* Room creation/join panel */}
      <div className="absolute top-4 left-4 z-40 p-4 bg-white rounded shadow max-w-md w-full md:w-auto">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs font-medium">
                Name:
                <input
                  value={playerName}
                  onChange={(e) => setPlayerNameLocal(e.target.value)}
                  className="ml-1 border px-2 py-1 w-full rounded"
                  aria-label="Player name"
                />
              </label>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  createRoom();
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded text-xs"
              >
                Create Room
              </button>
              <input
                placeholder="Room ID"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                className="border px-2 py-1 rounded text-xs"
                aria-label="Room ID input"
              />
              <button
                onClick={() => {
                  joinRoom(roomIdInput);
                  setJoinedRoom(roomIdInput);
                }}
                className="px-3 py-1 bg-green-500 text-white rounded text-xs"
              >
                Join
              </button>
            </div>
          </div>

          {joinedRoom && (
            <div className="text-sm">
              In room: <strong>{joinedRoom}</strong> ({rooms?.[joinedRoom]?.players?.length ?? 0}/4)
            </div>
          )}

          <div className="mt-1">
            <div className="font-semibold text-[11px] mb-1">Available Rooms</div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {Object.entries(rooms || {}).map(([id, room]) => (
                <div
                  key={id}
                  className="flex justify-between items-center p-2 border rounded bg-gray-50"
                >
                  <div className="flex flex-col text-xs">
                    <div>
                      <span className="font-medium">ID:</span> {id}
                    </div>
                    <div>
                      <span className="font-medium">Players:</span>{" "}
                      {room.players?.length ?? 0}/4
                    </div>
                  </div>
                  <div className="flex gap-1">
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
                </div>
              ))}
              {Object.keys(rooms || {}).length === 0 && (
                <div className="text-[12px] text-gray-600">No rooms yet</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main game UI */}
      <Table
        state={syntheticState}
        playCard={(card: any) => playCard(card)}
        you={you}
        onEvaluateTrick={() => {
          /* server handles trick resolution */
        }}
      />

      {/* Overlays */}
      {betPopupOpen && <BetPopup onSelect={handleBetSelect} />}
      {dashboardOpen && <Dashboard history={[]} onClose={() => setDashboardOpen(false)} />}
      {/*
        Game over detection isn’t included here; plug in your logic and show:
        <GameOverPopup totalScores={...} onPlayAgain={...} />
      */}

      {/* Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
        <button
          onClick={() => setDashboardOpen(true)}
          className="p-2 bg-gray-700 text-white rounded-full hover:bg-gray-600"
          aria-label="Show Game History"
        >
          📜
        </button>
      </div>

      {/* Scoreboard & bid summary */}
      {gameStarted && (
        <>
          <div className="absolute top-4 left-4 z-20 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-sm">
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
