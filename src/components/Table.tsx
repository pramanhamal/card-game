// src/components/Table.tsx
import React, { useState, useEffect, useRef } from 'react';
import { GameState, PlayerId, Card as CardType } from '../types/spades';
import { legalMoves, determineTrickWinner } from '../utils/gameLogic';

export interface TableProps {
  state: GameState;
  playCard: (player: PlayerId, card: CardType) => void;
  you: PlayerId;
  onEvaluateTrick: () => void;
  nameMap?: Record<PlayerId, string>;
}

const defaultNameMap: Record<PlayerId, string> = {
  north: 'North',
  west: 'West',
  east: 'East',
  south: 'You',
};

const rankOrder: Array<string> = [
  "2","3","4","5","6","7","8","9","10","J","Q","K","A"
];

function sortByRank(cards: CardType[]) {
  return [...cards].sort(
    (a, b) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank)
  );
}

export const Table: React.FC<TableProps> = ({
  state,
  playCard,
  you,
  onEvaluateTrick,
  nameMap = defaultNameMap,
}) => {
  const { trick, round, turn, hands, tricksWon } = state;

  const trickIsFull = Object.values(trick).every(c => c !== null);
  const isMyTurn = turn === you && !trickIsFull;
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isMyTurn) {
      timer = setTimeout(() => setIsActive(true), 500);
    } else {
      setIsActive(false);
    }
    return () => clearTimeout(timer);
  }, [isMyTurn]);

  const legalSet = new Set(
    isActive
      ? legalMoves(state, you).map(c => `${c.suit}-${c.rank}`)
      : []
  );

  const [lastWinner, setLastWinner] = useState<PlayerId | null>(null);
  const prevTrickRef = useRef(trick);

  useEffect(() => {
    const prevCount = Object.values(prevTrickRef.current).filter(c => c !== null).length;
    const currCount = Object.values(trick).filter(c => c !== null).length;

    if (prevCount < 4 && currCount === 4) {
      setLastWinner(determineTrickWinner(trick));
    }
    if (currCount === 0) {
      setLastWinner(null);
    }

    prevTrickRef.current = trick;
  }, [trick]);

  const yourHand = hands[you] || [];
  const sortedHand = sortByRank(yourHand);

  const turnDisplay = turn
    ? turn === you
      ? "You"
      : nameMap[turn]
    : "—";

  return (
    <div className="relative w-full h-full bg-teal-800 text-white">
      <div className="absolute top-4 left-4 bg-black bg-opacity-60 px-3 py-1 rounded">
        Round: {round} | Turn: {turnDisplay}
      </div>

      {/* Simplified opponent display */}
      <div className="absolute top-16 left-4">
        <div>North: {nameMap.north}</div>
      </div>
      <div className="absolute top-16 right-4">
        <div>East: {nameMap.east}</div>
      </div>
      <div className="absolute top-16 left-1/2 transform -translate-x-1/2">
        <div>West: {nameMap.west}</div>
      </div>

      {/* Trick display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="mb-2">Current Trick</div>
        <div className="flex gap-4">
          {(["north", "east", "south", "west"] as PlayerId[]).map((seat) => {
            const card = trick[seat];
            return (
              <div key={seat} className="flex flex-col items-center">
                <div className="text-sm">{nameMap[seat]}</div>
                <div className="w-16 h-24 border rounded flex items-center justify-center bg-white text-black">
                  {card ? `${card.rank}${card.suit[0].toUpperCase()}` : "—"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Your hand */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <div className="flex gap-2">
          {sortedHand.map((c, idx) => {
            const key = `${c.suit}-${c.rank}-${idx}`;
            const canPlay = isActive && legalSet.has(`${c.suit}-${c.rank}`);
            return (
              <div
                key={key}
                onClick={canPlay ? () => playCard(you, c) : undefined}
                className={`border rounded px-2 py-1 cursor-pointer ${canPlay ? "ring-2 ring-yellow-400" : "opacity-60"}`}
              >
                <div>{c.rank}</div>
                <div>{c.suit[0].toUpperCase()}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
