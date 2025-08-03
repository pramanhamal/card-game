import React from "react";
import type { PlayerId } from "../types/spades";

interface Props {
  totalScores: Record<PlayerId, number>;
  onPlayAgain: () => void;
}

export const GameOverPopup: React.FC<Props> = ({
  totalScores,
  onPlayAgain,
}) => {
  const highest = Math.max(...Object.values(totalScores));
  const winners = (Object.keys(totalScores) as PlayerId[]).filter(
    (p) => totalScores[p] === highest
  );
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded p-6 shadow w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-2">Game Over</h2>
        <p className="mb-4">
          Winner: {winners.map((w) => w.toUpperCase()).join(", ")}
        </p>
        <div className="mb-4">
          {Object.entries(totalScores).map(([p, s]) => (
            <div key={p}>
              {p.toUpperCase()}: {s}
            </div>
          ))}
        </div>
        <button
          onClick={onPlayAgain}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};
