// src/components/Dashboard.tsx
import React from "react";
import { GameResult, PlayerId } from "../types/spades";

interface DashboardProps {
  history: GameResult[];
  onClose: () => void;
}

const seatDisplayName: Record<PlayerId, string> = {
  north: "North",
  east: "East",
  south: "You",
  west: "West",
};

export const Dashboard: React.FC<DashboardProps> = ({ history, onClose }) => {
  const latest = history[history.length - 1];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-start justify-center p-6 overflow-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Game History</h2>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
          >
            Close
          </button>
        </div>

        {history.length === 0 && (
          <div className="text-gray-700">No hands played yet.</div>
        )}

        {history.map((hand) => (
          <div
            key={hand.handNumber}
            className="border rounded p-3 bg-gray-50"
          >
            <div className="flex justify-between mb-2">
              <div className="font-semibold">
                Hand #{hand.handNumber} — Winner:{" "}
                {hand.winner ? seatDisplayName[hand.winner] : "N/A"}
              </div>
              <div className="text-sm text-gray-600">
                Total Scores:{" "}
                {Object.entries(hand.totalScores)
                  .map(
                    ([seat, score]) =>
                      `${seatDisplayName[seat as PlayerId]}: ${score}`
                  )
                  .join(" | ")}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-medium">Bids:</div>
                <ul className="list-disc pl-5 text-sm">
                  {Object.entries(hand.bids).map(([seat, bid]) => (
                    <li key={seat}>
                      {seatDisplayName[seat as PlayerId]}:{" "}
                      {bid !== null ? bid : "-"}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="font-medium">Tricks Won:</div>
                <ul className="list-disc pl-5 text-sm">
                  {Object.entries(hand.tricksWon).map(([seat, t]) => (
                    <li key={seat}>
                      {seatDisplayName[seat as PlayerId]}: {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-2 text-sm">
              <div className="font-medium">Scores this hand:</div>
              <div>
                {Object.entries(hand.scores)
                  .map(
                    ([seat, sc]) =>
                      `${seatDisplayName[seat as PlayerId]}: ${sc}`
                  )
                  .join(" | ")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
