// src/App.tsx
import React, { useState, useEffect } from "react";
import { Table } from "./components/Table";
import { Scoreboard } from "./components/Scoreboard";
import { BetPopup } from "./components/BetPopup";
import { Dashboard } from "./components/Dashboard";
import { GameOverPopup } from "./components/GameOverPopup";
import { useMultiplayerGameState } from "./hooks/useMultiplayerGameState";
import {
  remapHands,
  remapTrick,
  remapAggregates,
  remapTurn,
  remapNames,
} from "./utils/seatMapping";
import { PlayerId, Card } from "./types/spades";

const App: React.FC = () => {
  const [playerName, setPlayerNameLocal] = useState("Player");
  const [betPopupOpen, setBetPopupOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState("");

  // **Fix**: pass null (or a separate external room id) instead of joinedRoom which is being returned
  const {
    rooms,
    joinedRoom,
    setJoinedRoom,
    playerId, // canonical seat assigned by server, lowercase ("north"|"east"|"south"|"west")
    seating,
    hand,
    currentTurnSeat,
    currentTrick,
    tricksWon,
    bids,
    gameStarted,
    createRoom,
    joinRoom,
    placeBid,
    playCard, // (card: Card) => void
  } = useMultiplayerGameState(null, playerName);

  // Viewer seat fallback to south
  const viewerSeat: PlayerId = playerId || "south";

  // Show bet popup when a game starts
  useEffect(() => {
    if (gameStarted) {
      setBetPopupOpen(true);
    }
  }, [gameStarted]);

  // Build canonical hands: only viewer has a populated hand
  const canonicalHands: Record<PlayerId, Card[]> = {
    north: [],
    east: [],
    south: [],
    west: [],
  };
  canonicalHands[viewerSeat] = hand;

  // Canonical names (from seating)
  const canonicalNames: Record<PlayerId, string> = {
    north: seating.north.name,
    east: seating.east.name,
    south: seating.south.name,
    west: seating.west.name,
  };

  // Local (rotated) views so viewerSeat becomes "south"
  const localHands = remapHands(canonicalHands, viewerSeat);
  const localTrick = remapTrick(
    currentTrick || { north: null, east: null, south: null, west: null },
    viewerSeat
  );
  const localBids = remapAggregates(bids as any, viewerSeat);
  const localTricksWon = remapAggregates(tricksWon as any, viewerSeat);
  const localTurn = remapTurn(currentTurnSeat, viewerSeat);
  const localNames = remapNames(canonicalNames, viewerSeat);

  // Synthetic state passed into Table/Scoreboard
  const syntheticState: any = {
    bids: localBids,
    tricksWon: localTricksWon,
    trick: localTrick,
    turn: localTurn,
    hands: localHands,
    round: 0,
  };

  const handleBetSelect = (n: number) => {
    placeBid(n);
    setBetPopupOpen(false);
  };

  // Adapter to satisfy Table's expected signature: (player, card)
  const handleTablePlayCard = (player: PlayerId, card: Card) => {
    if (player !== "south") return; // only local viewer plays
    playCard(card);
  };

  return (
    <div className="fixed inset-0 bg-teal-800 overflow-hidden">
      {/* Lobby / room panel */}
      <div className="absolute top-4 left-4 z-50 p-4 bg-white rounded shadow max-w-md w-full md:w-auto">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="text-xs block">
                Name:
                <input
                  aria-label="Player name"
                  value={playerName}
                  onChange={(e) => setPlayerNameLocal(e.target.value)}
                  className="ml-1 border px-2 py-1 rounded text-sm"
                />
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => createRoom()}
                className="px-3 py-1 bg-blue-500 text-white rounded text-xs"
              >
                Create Room
              </button>
              <input
                aria-label="Room ID"
                placeholder="Room ID"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                className="border px-2 py-1 rounded text-xs"
              />
              <button
                onClick={() => {
                  joinRoom(roomIdInput);
                  setJoinedRoom(roomIdInput); // optional immediate UI update
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
                  className="flex justify-between items-center p-2 border rounded bg-gray-50 text-xs"
                >
                  <div className="flex flex-col">
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

      {/* Game table */}
      <Table
        state={syntheticState}
        playCard={handleTablePlayCard}
        you="south"
        onEvaluateTrick={() => {}}
        nameMap={{
          north: localNames.north,
          east: localNames.east,
          south: localNames.south,
          west: localNames.west,
        }}
      />

      {/* Overlays */}
      {betPopupOpen && <BetPopup onSelect={handleBetSelect} />}
      {dashboardOpen && <Dashboard history={[]} onClose={() => setDashboardOpen(false)} />}
      {/* GameOverPopup could be conditionally rendered here */}
      {/* <GameOverPopup totalScores={{}} onPlayAgain={() => {}} /> */}

      {/* Controls */}
      <div className="absolute top-4 right-4 z-30 flex items-center space-x-2">
        <button
          onClick={() => setDashboardOpen(true)}
          className="p-2 bg-gray-700 text-white rounded-full hover:bg-gray-600"
          aria-label="Show Game History"
        >
          📜
        </button>
      </div>

      {/* Scoreboard & bid */}
      {gameStarted && (
        <>
          <div className="absolute top-16 left-4 z-20 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-sm">
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
