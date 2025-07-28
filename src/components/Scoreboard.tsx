// src/components/Scoreboard.tsx
import React from 'react';
import { PlayerId } from '../types/spades';

interface ScoreboardProps {
  /** Each player’s bid for this hand */
  bids: Record<PlayerId, number>;
  /** How many tricks each player has won so far */
  tricksWon: Record<PlayerId, number>;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({ bids, tricksWon }) => {
  return (
    <div className="mt-4 p-4 border rounded bg-white">
      <h3 className="text-lg font-bold mb-2">Bids &amp; Tricks Won</h3>
      <ul className="space-y-1">
        {(['north','east','south','west'] as PlayerId[]).map(player => {
          const bid = bids[player];
          const won = tricksWon[player];
          // Display "won/bid" for everyone (e.g. "2/3" or "0/0")
          const label = `${won}/${bid}`;
          return (
            <li key={player} className="capitalize flex justify-between">
              <span>{player}</span>
              <span className="font-mono">{label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
