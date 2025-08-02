// src/components/Table.tsx
import React, { useState, useEffect, useRef } from 'react';
import { GameState, PlayerId, Card as CardType } from '../types/spades';
import { Opponent } from './Opponent';
import { Card } from './Card';
import { TrickPile } from './TrickPile';
import { legalMoves, determineTrickWinner } from '../utils/gameLogic';

interface TableProps {
  state: GameState;
  playCard: (player: PlayerId, card: CardType) => void;
  you: PlayerId;
  onEvaluateTrick: () => void;
}

// fallback trick so Object.values never throws
const defaultTrick: Record<PlayerId, CardType | null> = {
  north: null,
  east: null,
  south: null,
  west: null,
};

// display name map
const nameMap: Record<PlayerId, string> = {
  north: 'North',
  east: 'East',
  south: 'You',
  west: 'West',
};

const validPlayerIds: PlayerId[] = ['north', 'east', 'south', 'west'];

function normalizePlayerId(value: any, fallback: PlayerId): PlayerId {
  if (typeof value === 'string' && validPlayerIds.includes(value as PlayerId)) {
    return value as PlayerId;
  }
  return fallback;
}

export const Table: React.FC<TableProps> = ({ state, playCard, you, onEvaluateTrick }) => {
  // defensive destructure with defaults
  const {
    trick: rawTrick,
    round = 0,
    turn: rawTurn,
    hands = { north: [], east: [], south: [], west: [] },
    tricksWon = { north: 0, east: 0, south: 0, west: 0 },
    bids = { north: 0, east: 0, south: 0, west: 0 },
  } = (state || {}) as Partial<GameState> as any;

  const turn: PlayerId = normalizePlayerId(rawTurn, you);
  const trick: Record<PlayerId, CardType | null> = rawTrick ?? defaultTrick;

  // delayed active-turn UI
  const trickIsFull = Object.values(trick).every((c) => c !== null);
  const isMyTurn = turn === you && !trickIsFull;
  const [isActive, setIsActive] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (isMyTurn) {
      timer = setTimeout(() => setIsActive(true), 500);
    } else {
      setIsActive(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isMyTurn]);

  // legal moves safe
  const legalCardArr: CardType[] = isActive
    ? (typeof legalMoves === 'function' ? (legalMoves(state, you) || []) : [])
    : [];
  const legalSet = new Set(legalCardArr.map((c) => `${c.suit}-${c.rank}`));

  // track last trick winner
  const [lastWinnerRaw, setLastWinnerRaw] = useState<PlayerId | null>(null);
  const prevTrickRef = useRef<Record<PlayerId, CardType | null>>(trick);

  useEffect(() => {
    const prevCount = Object.values(prevTrickRef.current || defaultTrick).filter((c) => c !== null)
      .length;
    const currCount = Object.values(trick || defaultTrick).filter((c) => c !== null).length;

    if (prevCount === 3 && currCount === 4) {
      const winner = determineTrickWinner(trick);
      if (winner) {
        setLastWinnerRaw(winner);
      }
    }
    prevTrickRef.current = trick;
  }, [trick]);

  const lastWinner: PlayerId | null = lastWinnerRaw;

  // Your hand
  const yourHand: CardType[] = hands[you] || [];

  const canPlayCard = (card: CardType) => {
    if (!isActive) return false;
    const key = `${card.suit}-${card.rank}`;
    return legalSet.has(key);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Status / TrickPile */}
      <div className="relative w-full flex flex-col items-center text-white mb-4">
        <div className="mb-1">
          <div>
            Round: {round} | Turn: {turn === you ? 'You' : nameMap[turn]}
          </div>
          {lastWinner && (
            <div className="text-sm">
              Last trick won by: {lastWinner === you ? 'You' : nameMap[lastWinner]}
            </div>
          )}
        </div>
        <TrickPile trick={trick} winner={lastWinner ?? null} onFlyOutEnd={onEvaluateTrick} />
      </div>

      {/* Opponents */}
      <div className="flex justify-between mb-2">
        <Opponent
          position="north"
          name={nameMap.north}
          cardsCount={(hands.north || []).length}
          tricks={tricksWon.north}
        />
      </div>
      <div className="flex flex-1">
        <div className="flex-1">
          <Opponent
            position="west"
            name={nameMap.west}
            cardsCount={(hands.west || []).length}
            tricks={tricksWon.west}
          />
        </div>
        <div className="flex-1" />
        <div className="flex-1">
          <Opponent
            position="east"
            name={nameMap.east}
            cardsCount={(hands.east || []).length}
            tricks={tricksWon.east}
          />
        </div>
      </div>

      {/* Your hand at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-48 flex justify-center pointer-events-auto">
        <div className="flex gap-2 flex-wrap justify-center">
          {yourHand.map((c: CardType, i: number) => {
            const playable = canPlayCard(c);
            return (
              <div key={i} className="relative">
                <div
                  onClick={playable ? () => playCard(you, c) : undefined}
                  className={`inline-block rounded-md transition ${
                    playable
                      ? 'cursor-pointer'
                      : 'pointer-events-none cursor-not-allowed opacity-50'
                  }`}
                >
                  <Card card={c} faceUp />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Table;
