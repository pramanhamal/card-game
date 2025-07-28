import React from 'react';
import { Hand } from './Hand';
import { PlayerId } from '../types/spades';
import { GameState } from '../types/spades';

interface GameBoardProps {
  state: GameState;
  playCard: (player: PlayerId, card: import('../types/spades').Card) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ state, playCard }) => (
  <div className="board grid grid-cols-2 gap-4">
    {(['north','east','south','west'] as PlayerId[]).map(p => (
      <div key={p} className="player-area">
        <h2 className="capitalize">{p}</h2>
        <Hand
          player={p}
          cards={state.hands[p]}
          onPlay={playCard}
          currentPlayer={state.turn}
        />
      </div>
    ))}
    <div className="trick mt-4">
      <h3>Current Trick:</h3>
      <div className="flex space-x-2">
        {Object.entries(state.trick).map(([p, c]) => (
          <div key={p} className="w-16 h-24 flex items-center justify-center border">
            {c ? `${c.rank} of ${c.suit}` : '—'}
          </div>
        ))}
      </div>
    </div>
  </div>
);