// src/components/Table.tsx
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
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
    const prevState = prevStateRef.current;
    const prevTrick = prevState.trick;
    const currTrick = currentState.trick;

    const prevCount = Object.values(prevTrick).filter(Boolean).length;
    const currCount = Object.values(currTrick).filter(Boolean).length;

    if (prevCount === 3 && currCount === 0) {
      const lastPlayerToPlay = prevState.turn;
      if (lastPlayerToPlay) {
        const prevHand = prevState.hands[lastPlayerToPlay] || [];
        const currHand = currentState.hands[lastPlayerToPlay] || [];
        const playedCard = prevHand.find(
          (c) =>
            !currHand.some((sc) => sc.rank === c.rank && sc.suit === c.suit)
        );
        if (playedCard) {
          const fullTrick = { ...prevTrick, [lastPlayerToPlay]: playedCard };
          setVisualTrick(fullTrick);
        } else {
          setVisualTrick(currTrick);
        }
      }
    } else {
      setVisualTrick(currTrick);
    }

    prevStateRef.current = currentState;
  }, [currentState]);

  useEffect(() => {
    const visualTrickCount = Object.values(visualTrick).filter(Boolean).length;
    if (visualTrickCount === 4) {
      try {
        const winner = determineTrickWinner(visualTrick);
        setLastWinner(winner);
      } catch {
        // ignore invalid trick
      }
    } else {
      setLastWinner(null);
    }
  }, [visualTrick]);

  const handleFlyOutEnd = () => {
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

  const seatOf: Record<PlayerId, "north" | "east" | "south" | "west"> =
    {} as any;
  Object.entries(uiMapping).forEach(([seat, pid]) => {
    seatOf[pid] = seat as "north" | "east" | "south" | "west";
  });

  const trickIsFull = Object.values(visualTrick).every((c) => c !== null);
  const isMyTurn = turn === you && !trickIsFull;

  const [isActive, setIsActive] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isMyTurn) {
      timer = setTimeout(() => setIsActive(true), 400);
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
  const groupLists = firstIsBlack
    ? [blackSuits, redSuits]
    : [redSuits, blackSuits];
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
    <div
      className="relative w-full h-full"
      style={{
        background:
          "radial-gradient(ellipse at 50% 45%, #1e7a42 0%, #145c31 45%, #0d4222 100%)",
      }}
    >
      {/* Subtle felt pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='0.04'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10S0 14.5 0 20s4.5 10 10 10 10-4.5 10-10zm10 0c0 5.5 4.5 10 10 10s10-4.5 10-10-4.5-10-10-10-10 4.5-10 10z'/%3E%3C/g%3E%3C/svg%3E")`,
          opacity: 0.5,
        }}
      />

      {/* Table oval border */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: "12px",
          borderRadius: "50% / 40%",
          border: "2px solid rgba(255,255,255,0.07)",
          boxShadow:
            "inset 0 0 60px rgba(0,0,0,0.25), 0 0 0 4px rgba(0,0,0,0.3)",
        }}
      />

      <TrickPile
        trick={visualTrick}
        winner={lastWinner}
        seatOf={seatOf}
        onFlyOutEnd={handleFlyOutEnd}
      />

      {/* Round / Turn indicator */}
      <div className="absolute top-3 left-3 z-10">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-white"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
        >
          <span className="text-gray-400 text-xs">Round</span>
          <span className="font-bold">{round}</span>
          <span className="text-gray-500">·</span>
          <span className={turn === you ? "text-yellow-300 font-bold" : "text-gray-200"}>
            {turn === you ? "Your turn" : `${nameMap[turn]}'s turn`}
          </span>
        </div>
      </div>

      {/* Opponents */}
      <Opponent
        position="north"
        name={nameMap[uiMapping.north]}
        cardsCount={hands[uiMapping.north].length}
        tricks={tricksWon[uiMapping.north]}
        isCurrentTurn={turn === uiMapping.north}
      />
      <Opponent
        position="west"
        name={nameMap[uiMapping.west]}
        cardsCount={hands[uiMapping.west].length}
        tricks={tricksWon[uiMapping.west]}
        isCurrentTurn={turn === uiMapping.west}
      />
      <Opponent
        position="east"
        name={nameMap[uiMapping.east]}
        cardsCount={hands[uiMapping.east].length}
        tricks={tricksWon[uiMapping.east]}
        isCurrentTurn={turn === uiMapping.east}
      />

      {/* Your hand — bottom */}
      <div
        className="absolute inset-x-0 bottom-0 h-52 flex justify-center pointer-events-auto"
        style={{
          filter: isActive
            ? "drop-shadow(0 0 22px rgba(255,230,80,0.45))"
            : "none",
          transition: "filter 0.4s ease",
        }}
      >
        {/* Your name / turn badge */}
        <div
          className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-0.5 rounded-full z-20"
          style={{
            background: isActive
              ? "rgba(255,210,0,0.85)"
              : "rgba(0,0,0,0.5)",
            color: isActive ? "#1a1a00" : "#ccc",
            backdropFilter: "blur(4px)",
            transition: "background 0.3s, color 0.3s",
          }}
        >
          {nameMap[you]}{isActive ? " — Your Turn" : ""}
        </div>

        <div>
          {sortedHand.map((c, i) => {
            const total = sortedHand.length;
            const spread = Math.min(72, total * 5.5);
            const angle =
              total > 1 ? -spread / 2 + (spread / (total - 1)) * i : 0;
            const key = `${c.suit}-${c.rank}`;
            const canPlay = isActive && legalSet.has(key);
            const translateY = canPlay ? -108 : -84;

            return (
              <div
                key={key}
                className="absolute"
                style={{ opacity: 1 }}
              >
                <div
                  className="transition-all duration-250 ease-out"
                  style={{
                    transform: `rotate(${angle}deg) translateY(${translateY}px)`,
                    transformOrigin: "50% 100%",
                  }}
                  onClick={canPlay ? () => playCard(you, c) : undefined}
                >
                  <div
                    className={`rounded-lg overflow-hidden transition-all duration-200 ${
                      canPlay
                        ? "cursor-pointer ring-2 ring-yellow-300 ring-offset-1 ring-offset-transparent"
                        : canPlay === false && isActive
                        ? "opacity-55 cursor-not-allowed"
                        : ""
                    }`}
                    style={
                      canPlay
                        ? {
                            boxShadow:
                              "0 6px 20px rgba(0,0,0,0.5), 0 0 8px rgba(255,220,60,0.4)",
                          }
                        : {
                            boxShadow: "0 3px 10px rgba(0,0,0,0.35)",
                          }
                    }
                  >
                    <Card card={c} faceUp />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
