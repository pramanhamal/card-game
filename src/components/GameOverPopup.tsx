// src/components/GameOverPopup.tsx
import React from 'react';
import { PlayerId } from '../types/spades';

interface GameOverPopupProps {
  totalScores: Record<PlayerId, number>;
  onPlayAgain: () => void;
}

const getRank = (place: number) => {
  if (place === 1) return { text: '1st', color: 'text-yellow-400', icon: '🏆' };
  if (place === 2) return { text: '2nd', color: 'text-gray-400', icon: '🥈' };
  if (place === 3) return { text: '3rd', color: 'text-yellow-600', icon: '🥉' };
  return { text: '4th', color: 'text-red-500', icon: '' };
};

const players: PlayerId[] = ['north', 'east', 'south', 'west'];

export const GameOverPopup: React.FC<GameOverPopupProps> = ({ totalScores, onPlayAgain }) => {
  const sortedPlayers = (Object.keys(totalScores) as PlayerId[]).sort((a, b) => totalScores[b] - totalScores[a]);
  const yourRank = sortedPlayers.indexOf('south') + 1;
  const rankInfo = getRank(yourRank);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-8 w-full max-w-md text-center shadow-2xl transform transition-all scale-100">
        <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
        <p className="text-lg text-gray-600 mb-6">You finished in</p>
        <div className={`text-8xl font-bold ${rankInfo.color} mb-4`}>
          {rankInfo.text}
          <span className="ml-4 text-6xl">{rankInfo.icon}</span>
        </div>
        
        {/* Final Scores Table */}
        <div className="mt-6 border-t pt-4">
          <h3 className="text-xl font-bold mb-2">Final Scores</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {players.map(p => <th key={p} className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider capitalize">{p}</th>)}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                {players.map(p => {
                  const total = totalScores[p];
                  const displayTotal = total % 1 === 0 ? total : total.toFixed(1);
                  return <td key={p} className="px-4 py-2 font-mono text-lg">{displayTotal}</td>
                })}
              </tr>
            </tbody>
          </table>
        </div>

        <button
          onClick={onPlayAgain}
          className="mt-8 px-6 py-3 bg-blue-500 text-white rounded-full text-lg font-semibold hover:bg-blue-600 transition"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};