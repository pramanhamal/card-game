// src/components/Table.tsx
import React, { useState, useEffect, useRef } from "react";
import type { GameState, PlayerId, Card as CardType } from "../types/spades";
import { Opponent } from "./Opponent";
import { Card } from "./Card";
import { TrickPile } from "./TrickPile";
import { legalMoves, determineTrickWinner } from "../utils/gameLogic";

interface TableProps {
  state: GameState;
  playCard: (player: PlayerId, card: CardType) => void;
  you: PlayerId;
  onEvaluateTrick: () => void;
  nameMap?: Record<PlayerId, string>;
}

const defaultNameMap: Record<PlayerId, string> = {
  north: "North",
  west: "West",
  east: "East",
  south: "You",
};

// global rank ordering used for sorting
const rankOrder: Array<number | "J" | "Q" | "K" | "A"> = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A",
];

function sortByRank(cards: CardType[]) {
  return [...cards].sort(
    (a, b) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank)
  );
}

const SEAT_CLOCKWISE: PlayerId[] = ["north", "east", "south", "west"];

export const Table: React.FC<TableProps> = ({
  state,
  playCard,
  you,
  onEvaluateTrick,
  nameMap = defaultNameMap,
}) => {
  const { trick, round, turn, hands, tricksWon } = state;

  // ------------- perspective rotation -------------
  // Build clockwise sequence starting from "you"
  const youIdx = SEAT_CLOCKWISE.indexOf(you);
  const clockwiseFromYou = [
    ...SEAT_CLOCKWISE.slice(youIdx),
    ...SEAT_CLOCKWISE.slice(0, youIdx),
  ]; // e.g., [you, next clockwise, ..., ...]

  // Map display positions so that:
  // south (bottom) = you
  // west (left) = next clockwise after you
  // north (top) = next after that
  // east (right) = last
  const uiMapping: {
    south: PlayerId;
    west: PlayerId;
    north: PlayerId;
    east: PlayerId;
  } = {
    south: clockwiseFromYou[0],
    west: clockwiseFromYou[1],
    north: clockwiseFromYou[2],
    east: clockwiseFromYou[3],
  };

  const seatOf: Record<PlayerId, 'north' | 'east' | 'south' | 'west'> = {} as any;
  Object.entries(uiMapping).forEach(([seat, pid]) => {
    seatOf[pid] = seat as 'north' | 'east' | 'south' | 'west';
  });

  // Determine if it's this client's active turn
  const trickIsFull = Object.values(trick).every((c) => c !== null);
  const isMyTurn = turn === you && !trickIsFull;

  // Active UI delay
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

  // Legal move set for you
  const legalSet = new Set(
    isActive
      ? legalMoves(state, you).map((c) => `${c.suit}-${c.rank}`)
      : []
  );

  // Track last trick winner
  const [lastWinner, setLastWinner] = useState<PlayerId | null>(null);
  const prevTrickRef = useRef(trick);
  useEffect(() => {
    const prevCount = Object.values(prevTrickRef.current).filter(
      (c) => c !== null
    ).length;
    const currCount = Object.values(trick).filter((c) => c !== null).length;

    if (prevCount < 4 && currCount === 4) {
      setLastWinner(determineTrickWinner(trick));
    }
    if (currCount === 0) {
      setLastWinner(null);
    }

    prevTrickRef.current = trick;
  }, [trick]);

  // Build your sorted hand with alternating color grouping like before
  const yourHand = hands[you];
  const firstCard = yourHand[0];
  const firstIsBlack = firstCard
    ? firstCard.suit === "spades" || firstCard.suit === "clubs"
    : false;

  const suitsInHand = Array.from(new Set(yourHand.map((c) => c.suit)));
  const redSuits = suitsInHand
    .filter((s) => s === "hearts" || s === "diamonds")
    .sort();
  const blackSuits = suitsInHand
    .filter((s) => s === "spades" || s === "clubs")
    .sort();
  const groupLists = firstIsBlack ? [blackSuits, redSuits] : [redSuits, blackSuits];
  const indices: [number, number] = [0, 0];
  const suitOrder: string[] = [];
  let g = 0;
  while (suitOrder.length < suitsInHand.length) {
    const list = groupLists[g];
    const idx = indices[g]++;
    if (idx < list.length) suitOrder.push(list[idx]);
    g = 1 - g;
  }
  const sortedHand = suitOrder.flatMap((suit) =>
    sortByRank(yourHand.filter((c) => c.suit === suit))
  );

  return (
    <div className="relative w-full h-full bg-teal-800">
      <TrickPile
        trick={state.trick}
        winner={lastWinner}
        seatOf={seatOf}
        onFlyOutEnd={onEvaluateTrick}
      />

      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
        Round: {round} | Turn: {turn === you ? "You" : nameMap[turn]}
      </div>

      {/* Opponents placed according to rotated perspective */}
      <Opponent
        position="north"
        name={nameMap[uiMapping.north]}
        cardsCount={hands[uiMapping.north].length}
        tricks={tricksWon[uiMapping.north]}
      />
      <Opponent
        position="west"
        name={nameMap[uiMapping.west]}
        cardsCount={hands[uiMapping.west].length}
        tricks={tricksWon[uiMapping.west]}
      />
      <Opponent
        position="east"
        name={nameMap[uiMapping.east]}
        cardsCount={hands[uiMapping.east].length}
        tricks={tricksWon[uiMapping.east]}
      />

      {/* Your hand at bottom */}
      <div
        className="absolute inset-x-0 bottom-0 h-48 flex justify-center pointer-events-auto transition-all duration-300"
        style={{
          filter: isActive
            ? "drop-shadow(0 0 20px rgba(255, 255, 100, 0.4))"
            : "none",
        }}
      >
        {sortedHand.map((c, i) => {
          const total = sortedHand.length;
          const spread = 70;
          const angle =
            total > 1 ? -spread / 2 + (spread / (total - 1)) * i : 0;

          const key = `${c.suit}-${c.rank}`;
          const canPlay = isActive && legalSet.has(key);
          const scale = canPlay ? 1.15 : 1;
          const translateY = canPlay ? -100 : -80;

          return (
            <div
              key={key}
              className="absolute transition-transform duration-300 ease-in-out"
              style={{
                transform: `rotate(${angle}deg) translateY(${translateY}px) scale(${scale})`,
                transformOrigin: "50% 100%",
              }}
            >
              <div
                onClick={canPlay ? () => playCard(you, c) : undefined}
                className={`inline-block rounded-md ${
                  canPlay
                    ? "cursor-pointer"
                    : "pointer-events-none cursor-not-allowed"
                }`}
              >
                <Card card={c} faceUp />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
