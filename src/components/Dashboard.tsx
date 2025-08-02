// src/components/Dashboard.tsx
import React from "react";
import type { GameResult, PlayerId } from "../types/spades";

interface DashboardProps {
  history: GameResult[];
  onClose: () => void;
}

const PLAYER_ORDER: PlayerId[] = ["north", "east", "south", "west"];
const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1);

export const Dashboard: React.FC<DashboardProps> = ({ history, onClose }) => {
  if (!history || history.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg w-full max-w-md shadow-lg overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h2 className="text-xl font-bold">Game History</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-gray-600 hover:text-gray-900"
            >
              ✕
            </button>
          </div>
          <div className="p-6 text-center text-gray-700">
            No completed hands yet.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center overflow-auto p-6 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-2xl font-bold">Game History</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-600 hover:text-gray-900"
          >
            Close
          </button>
        </div>
        <div className="p-6 space-y-5">
          {history.map((h, idx) => {
            // Determine winner(s) by highest totalScore
            const maxTotal = Math.max(
              ...PLAYER_ORDER.map((p) => h.totalScores[p] ?? 0)
            );
            const winners = PLAYER_ORDER.filter(
              (p) => h.totalScores[p] === maxTotal
            );

            return (
              <div
                key={idx}
                className="border rounded-lg p-4 bg-gray-50 shadow-sm"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-2">
                  <div className="text-lg font-semibold">
                    Hand #{h.gameId ?? idx + 1}
                  </div>
                  <div className="text-sm text-gray-700">
                    Winner: {winners.map((w) => capitalize(w)).join(", ")}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-white rounded p-3 border">
                    <div className="font-medium mb-1">Bids</div>
                    <div className="flex justify-center gap-3">
                      {PLAYER_ORDER.map((p) => (
                        <div key={`bid-${p}`} className="text-xs">
                          <div className="uppercase">{p}</div>
                          <div className="font-semibold">
                            {h.bids[p] != null ? h.bids[p] : "-"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded p-3 border">
                    <div className="font-medium mb-1">Tricks Won</div>
                    <div className="flex justify-center gap-3">
                      {PLAYER_ORDER.map((p) => (
                        <div key={`tricks-${p}`} className="text-xs">
                          <div className="uppercase">{p}</div>
                          <div className="font-semibold">
                            {h.tricksWon[p] != null ? h.tricksWon[p] : 0}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded p-3 border">
                    <div className="font-medium mb-1">Scores</div>
                    <div className="flex justify-center gap-3">
                      {PLAYER_ORDER.map((p) => (
                        <div key={`score-${p}`} className="text-xs">
                          <div className="uppercase">{p}</div>
                          <div className="font-semibold">
                            {h.scores[p] != null ? h.scores[p] : 0}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded p-3 border">
                    <div className="font-medium mb-1">Total Scores</div>
                    <div className="flex justify-center gap-3">
                      {PLAYER_ORDER.map((p) => (
                        <div key={`total-${p}`} className="text-xs">
                          <div className="uppercase">{p}</div>
                          <div className="font-semibold">
                            {h.totalScores[p] != null ? h.totalScores[p] : 0}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
