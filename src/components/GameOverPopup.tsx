// src/components/GameOverPopup.tsx
import React from "react";

interface GameOverPopupProps {
  totalScores: Record<string, number>;
  onPlayAgain: () => void;
}

export const GameOverPopup: React.FC<GameOverPopupProps> = ({
  totalScores,
  onPlayAgain,
}) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Game Over</h2>
        <div className="mb-4">
          {Object.entries(totalScores).map(([player, score]) => (
            <div key={player}>
              <strong>{player}:</strong> {score}
            </div>
          ))}
        </div>
        <button
          onClick={onPlayAgain}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};
