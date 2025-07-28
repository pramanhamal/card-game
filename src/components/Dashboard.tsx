// src/components/Dashboard.tsx
import React from 'react';
import { GameResult, PlayerId } from '../types/spades';

interface DashboardProps {
  history: GameResult[];
  onClose: () => void;
}

const players: PlayerId[] = ['north', 'east', 'south', 'west'];

export const Dashboard: React.FC<DashboardProps> = ({ history, onClose }) => {
  const latestTotals = history.length > 0 ? history[0].totalScores : { north: 0, east: 0, south: 0, west: 0 };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl text-center relative shadow-2xl">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
        <h2 className="text-2xl font-bold mb-4">Game History</h2>
        {history.length === 0 ? <p>No games completed yet.</p> : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Game</th>
                  {players.map(p => <th key={p} className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider capitalize">{p}</th>)}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map(game => (
                  <tr key={game.gameId}>
                    <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900">{game.gameId}</td>
                    {players.map(p => {
                      const score = game.scores[p];
                      const displayScore = score % 1 === 0 ? score : score.toFixed(1);
                      const textColor = score < 0 ? 'text-red-500' : 'text-green-600';
                      return (
                        <td key={p} className={`px-4 py-2 whitespace-nowrap font-mono ${textColor}`}>
                          {displayScore}
                          <span className="text-xs text-gray-400 ml-1">({game.tricksWon[p]}/{game.bids[p]})</span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-bold">
                <tr>
                  <td className="px-4 py-2 text-left text-xs uppercase tracking-wider">Total</td>
                  {players.map(p => {
                    const total = latestTotals[p];
                    const displayTotal = total % 1 === 0 ? total : total.toFixed(1);
                    return <td key={p} className="px-4 py-2 font-mono">{displayTotal}</td>
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};