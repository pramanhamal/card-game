import React from "react";
import type { GameResult, PlayerId } from "../types/spades";

interface Props {
  history: GameResult[];
  onClose: () => void;
  playerNames: Record<PlayerId, string>;
  yourSeat?: PlayerId;
}

export const Dashboard: React.FC<Props> = ({
  history,
  onClose,
  playerNames,
  yourSeat,
}) => {
  const displayName = (p: PlayerId) => {
    const base = playerNames[p] || p.toUpperCase();
    return p === yourSeat ? `${base} (You)` : base;
  };

  return (
    <div className="fixed inset-0 flex items-start justify-center bg-black/60 p-6 overflow-auto">
      <div className="bg-white rounded p-6 shadow w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Game History</h2>
          <button onClick={onClose} className="text-sm text-blue-600">
            Close
          </button>
        </div>
        {history.length === 0 && <div>No history yet.</div>}
        {history.map((h) => (
          <div
            key={h.gameId}
            className="border rounded p-3 mb-3 bg-gray-50"
          >
            <div className="font-semibold">Round {h.gameId}</div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <div className="font-medium">Bids:</div>
                {(Object.entries(h.bids) as [PlayerId, number][]).map(
                  ([p, b]) => (
                    <div key={p}>
                      {displayName(p)}: {b}
                    </div>
                  )
                )}
              </div>
              <div>
                <div className="font-medium">Tricks Won:</div>
                {(Object.entries(h.tricksWon) as [PlayerId, number][]).map(
                  ([p, t]) => (
                    <div key={p}>
                      {displayName(p)}: {t}
                    </div>
                  )
                )}
              </div>
            </div>
            <div className="mt-2">
              <div className="font-medium">Scores:</div>
              {(Object.entries(h.scores) as [PlayerId, number][]).map(
                ([p, s]) => (
                  <div key={p}>
                    {displayName(p)}: {s}
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
