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
  state: currentState,
  playCard,
  you,
  onEvaluateTrick,
  nameMap = defaultNameMap,
}) => {
  const { trick: serverTrick, round, turn, hands, tricksWon } = currentState;

  const [visualTrick, setVisualTrick] = useState(serverTrick);
  const [lastWinner, setLastWinner] = useState<PlayerId | null>(null);
  const prevStateRef = useRef<GameState>(currentState);

  useEffect(() => {
    console.log("--- Table.tsx state updated ---");
    const prevState = prevStateRef.current;
    const prevTrick = prevState.trick;
    const currTrick = currentState.trick;

    const prevCount = Object.values(prevTrick).filter(Boolean).length;
    const currCount = Object.values(currTrick).filter(Boolean).length;

    console.log(`[Table] Trick count changed: ${prevCount} -> ${currCount}`);

    if (prevCount === 3 && currCount === 0) {
      console.log("[Table] CRITICAL: Detected 3 -> 0 trick. Reconstructing 4th card.");
      const lastPlayerToPlay = prevState.turn;
      console.log(`[Table] Last player was: ${lastPlayerToPlay}`);
      
      if (lastPlayerToPlay) {
        const prevHand = prevState.hands[lastPlayerToPlay] || [];
        const currHand = currentState.hands[lastPlayerToPlay] || [];
        
        const playedCard = prevHand.find(
          (c) => !currHand.some(sc => sc.rank === c.rank && sc.suit === c.suit)
        );

        if (playedCard) {
          console.log(`[Table] Reconstructed 4th card:`, playedCard);
          const fullTrick = { ...prevTrick, [lastPlayerToPlay]: playedCard };
          console.log("[Table] Setting visualTrick to reconstructed 4-card trick:", fullTrick);
          setVisualTrick(fullTrick);
        } else {
            console.error("[Table] FAILED to reconstruct 4th card. Hands might be out of sync.");
            setVisualTrick(currTrick);
        }
      }
    } else {
      console.log("[Table] Normal state update. Syncing visualTrick with serverTrick.");
      setVisualTrick(currTrick);
    }

    prevStateRef.current = currentState;
  }, [currentState]);

  useEffect(() => {
    const visualTrickCount = Object.values(visualTrick).filter(Boolean).length;
    if (visualTrickCount === 4) {
      try {
        const winner = determineTrickWinner(visualTrick);
        console.log(`[Table] Visual trick has 4 cards. Winner determined: ${winner}`);
        setLastWinner(winner);
      } catch (e) {
        // This can happen if the trick is invalid. Do nothing.
      }
    } else {
      setLastWinner(null);
    }
  }, [visualTrick]);

  const handleFlyOutEnd = () => {
    console.log("[Table] fly-out animation finished. Syncing visual trick back to server state.");
    setVisualTrick(currentState.trick);
    onEvaluateTrick();
  };

  const youIdx = SEAT_CLOCKWISE.indexOf(you);
  const clockwiseFromYou = [
    ...SEAT_CLOCKWISE.slice(youIdx),
    ...SEAT_CLOCKWISE.slice(0, youIdx),
  ];

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

  const trickIsFull = Object.values(visualTrick).every((c) => c !== null);
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
      ? legalMoves(currentState, you).map((c) => `${c.suit}-${c.rank}`)
      : []
  );

  const yourHand = hands[you] || [];
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
        trick={visualTrick}
        winner={lastWinner}
        seatOf={seatOf}
        onFlyOutEnd={handleFlyOutEnd}
      />

      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
        Round: {round} | Turn: {turn === you ? "You" : nameMap[turn]}
      </div>

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