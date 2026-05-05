// src/components/Table.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameState, PlayerId, Card as CardType } from "../types/spades";
import { Opponent } from "./Opponent";
import { Card } from "./Card";
import { TrickPile } from "./TrickPile";
import { legalMoves, determineTrickWinner } from "../utils/gameLogic";
import { playCardSnap, playDealWhoosh, playIllegalCard } from "../utils/sounds";

interface TableProps {
  state: GameState;
  playCard: (player: PlayerId, card: CardType) => void;
  you: PlayerId;
  onEvaluateTrick: () => void;
  nameMap?: Record<PlayerId, string>;
  yourName?: string;
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
  yourName,
}) => {
  const { trick: serverTrick, round, turn, hands, tricksWon, bids } = currentState;

  const [visualTrick, setVisualTrick] = useState(serverTrick);
  const [lastWinner, setLastWinner] = useState<PlayerId | null>(null);
  const prevStateRef = useRef<GameState>(currentState);
  const latestServerTrickRef = useRef(serverTrick);
  const flyOutActiveRef = useRef(false);

  useEffect(() => {
    const prevState = prevStateRef.current;
    const prevTrick = prevState.trick;
    const currTrick = currentState.trick;

    const prevCount = Object.values(prevTrick).filter(Boolean).length;
    const currCount = Object.values(currTrick).filter(Boolean).length;

    latestServerTrickRef.current = currTrick;

    if (currCount === 0 && prevCount > 0) {
      const reconstructed = { ...prevTrick } as typeof prevTrick;
      (["north", "east", "south", "west"] as PlayerId[]).forEach((player) => {
        if (!reconstructed[player]) {
          const prevHand = prevState.hands[player] || [];
          const currHand = currentState.hands[player] || [];
          const playedCard = prevHand.find(
            (c) => !currHand.some((sc) => sc.rank === c.rank && sc.suit === c.suit)
          );
          if (playedCard) reconstructed[player] = playedCard;
        }
      });
      flyOutActiveRef.current = true;
      setVisualTrick(reconstructed);
    } else if (currCount > 0 && !flyOutActiveRef.current) {
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
    }
  }, [visualTrick]);

  const handleFlyOutEnd = useCallback(() => {
    flyOutActiveRef.current = false;
    setLastWinner(null);
    setVisualTrick(latestServerTrickRef.current);
    onEvaluateTrick();
  }, [onEvaluateTrick]);

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

  const serverTrickCount = Object.values(currentState.trick).filter(Boolean).length;
  const isMyTurn = turn === you && serverTrickCount < 4;

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

  // Spades-broken toast
  const [showSpadesToast, setShowSpadesToast] = useState(false);
  const prevSpadesBroken = useRef(currentState.spadesBroken);
  useEffect(() => {
    if (!prevSpadesBroken.current && currentState.spadesBroken) {
      setShowSpadesToast(true);
      const t = setTimeout(() => setShowSpadesToast(false), 2400);
      return () => clearTimeout(t);
    }
    prevSpadesBroken.current = currentState.spadesBroken;
  }, [currentState.spadesBroken]);

  // Deal animation — track which round we've animated
  const [dealtRound, setDealtRound] = useState<number>(-1);
  const [dealing, setDealing] = useState(false);
  useEffect(() => {
    if (currentState.round !== dealtRound) {
      setDealing(true);
      playDealWhoosh();
      setDealtRound(currentState.round);
      const t = setTimeout(() => setDealing(false), 600);
      return () => clearTimeout(t);
    }
  }, [currentState.round, dealtRound]);

  // Shake state — key of card that should shake
  const [shakingCard, setShakingCard] = useState<string | null>(null);

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
  const redSuits = suitsInHand.filter((s) => s === "hearts" || s === "diamonds").sort();
  const blackSuits = suitsInHand.filter((s) => s === "spades" || s === "clubs").sort();
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
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at 50% 40%, #5a3a8a 0%, #3b1f6b 40%, #1e0f3d 100%)",
      }}
    >
      {/* Decorative side curtains */}
      <div className="absolute inset-y-0 left-0 w-16 pointer-events-none" style={{ background: "linear-gradient(to right, rgba(80,20,120,0.6), transparent)" }} />
      <div className="absolute inset-y-0 right-0 w-16 pointer-events-none" style={{ background: "linear-gradient(to left, rgba(80,20,120,0.6), transparent)" }} />

      {/* Top bar — score strip */}
      <div
        className="absolute top-0 inset-x-0 flex items-center justify-between px-3 py-1 z-20"
        style={{ background: "transparent" }}
      >
        <div
          className="flex items-center gap-3 px-3 py-1 rounded-lg"
          style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {([uiMapping.west, uiMapping.north, uiMapping.east, you] as PlayerId[]).map((pid) => {
            const isYou = pid === you;
            return (
              <div key={pid} className="flex flex-col items-center" style={{ minWidth: 36 }}>
                <span style={{ fontSize: 9, color: isYou ? "#ffd700" : "rgba(255,255,255,0.55)", fontWeight: isYou ? 700 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 48 }}>
                  {isYou ? "You" : nameMap[pid]}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: isYou ? "#ffd700" : "white", lineHeight: 1 }}>
                  {tricksWon[pid]}
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>/{bids[pid] >= 0 ? bids[pid] : "?"}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Table — wood outer frame */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "12%", bottom: "20%", left: "5%", right: "5%",
          clipPath: "polygon(6% 0%, 94% 0%, 100% 6%, 100% 94%, 94% 100%, 6% 100%, 0% 94%, 0% 6%)",
          background: "linear-gradient(145deg, #8B4513 0%, #A0522D 30%, #6B3410 60%, #8B4513 100%)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.7), 0 4px 12px rgba(0,0,0,0.5)",
        }}
      />
      {/* Table — green felt inner */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "15%", bottom: "23%", left: "8%", right: "8%",
          clipPath: "polygon(6% 0%, 94% 0%, 100% 6%, 100% 94%, 94% 100%, 6% 100%, 0% 94%, 0% 6%)",
          background: "radial-gradient(ellipse at 50% 45%, #2e9e55 0%, #1e7a3e 55%, #145c2e 100%)",
          boxShadow: "inset 0 0 60px rgba(0,0,0,0.35)",
        }}
      />

      {/* "Your Turn" center indicator */}
      {isMyTurn && (
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 z-10"
          style={{ top: "48%" }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="px-4 py-1 rounded-full text-sm font-bold"
            style={{
              background: "rgba(255,210,0,0.9)",
              color: "#1a1000",
              boxShadow: "0 2px 12px rgba(255,200,0,0.5)",
            }}
          >
            Your Turn
          </div>
        </motion.div>
      )}

      {/* Spades broken toast */}
      <AnimatePresence>
        {showSpadesToast && (
          <motion.div
            key="spades-toast"
            initial={{ opacity: 0, y: -18, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className="absolute left-1/2 -translate-x-1/2 z-40 px-5 py-2 rounded-full text-sm font-bold"
            style={{
              top: "28%",
              background: "linear-gradient(90deg, rgba(30,10,60,0.96), rgba(90,30,160,0.96))",
              border: "1px solid rgba(180,100,255,0.5)",
              color: "#d8b4fe",
              boxShadow: "0 4px 20px rgba(130,60,200,0.5)",
            }}
          >
            ♠ Spades Broken!
          </motion.div>
        )}
      </AnimatePresence>

      <TrickPile
        trick={visualTrick}
        winner={lastWinner}
        winnerName={lastWinner ? (lastWinner === you ? (yourName ?? "You") : nameMap[lastWinner]) : undefined}
        seatOf={seatOf}
        onFlyOutEnd={handleFlyOutEnd}
      />

      {/* Opponents */}
      <Opponent
        position="north"
        name={nameMap[uiMapping.north]}
        cardsCount={hands[uiMapping.north].length}
        tricks={tricksWon[uiMapping.north]}
        bid={bids[uiMapping.north] ?? null}
        isCurrentTurn={turn === uiMapping.north}
      />
      <Opponent
        position="west"
        name={nameMap[uiMapping.west]}
        cardsCount={hands[uiMapping.west].length}
        tricks={tricksWon[uiMapping.west]}
        bid={bids[uiMapping.west] ?? null}
        isCurrentTurn={turn === uiMapping.west}
      />
      <Opponent
        position="east"
        name={nameMap[uiMapping.east]}
        cardsCount={hands[uiMapping.east].length}
        tricks={tricksWon[uiMapping.east]}
        bid={bids[uiMapping.east] ?? null}
        isCurrentTurn={turn === uiMapping.east}
      />

      {/* Your hand — flat overlapping row at bottom */}
      <div
        className="absolute inset-x-0 bottom-0 flex items-end pointer-events-auto"
        style={{
          height: 110,
          background: "transparent",
          borderTop: "none",
          paddingBottom: 6,
          paddingLeft: 6,
          paddingRight: 6,
          gap: 8,
          filter: isActive ? "drop-shadow(0 0 14px rgba(255,230,80,0.4))" : "none",
          transition: "filter 0.4s ease",
        }}
      >
        <div
          className="flex items-end flex-1 justify-center"
          style={{ paddingBottom: 2 }}
        >
          {sortedHand.map((c, i) => {
            const total = sortedHand.length;
            const overlap = total > 1 ? Math.max(0, Math.ceil((total * 64 - 540) / (total - 1))) : 0;
            const key = `${c.suit}-${c.rank}`;
            const canPlay = isActive && legalSet.has(key);
            const isIllegal = isActive && !legalSet.has(key);
            const isShaking = shakingCard === key;
            const isLast = i === total - 1;
            return (
              <motion.div
                key={key}
                className="flex-shrink-0"
                initial={dealing ? { y: -120, opacity: 0, scale: 0.7 } : false}
                animate={
                  isShaking
                    ? { x: [0, -6, 6, -5, 5, -3, 3, 0], y: canPlay ? -12 : 0, opacity: 1, scale: 1, transition: { duration: 0.35 } }
                    : { y: canPlay ? -12 : 0, x: 0, opacity: 1, scale: 1 }
                }
                transition={dealing ? { delay: i * 0.04, type: "spring", stiffness: 300, damping: 22 } : { duration: 0.2 }}
                style={{
                  marginRight: isLast ? 0 : -overlap,
                  zIndex: i,
                  cursor: canPlay ? "pointer" : isIllegal ? "not-allowed" : "default",
                }}
                onClick={() => {
                  if (canPlay) {
                    playCardSnap();
                    playCard(you, c);
                  } else if (isIllegal) {
                    playIllegalCard();
                    setShakingCard(key);
                    setTimeout(() => setShakingCard(null), 380);
                  }
                }}
              >
                <div
                  className={`rounded-lg overflow-hidden transition-all duration-200 ${
                    canPlay
                      ? "ring-2 ring-yellow-300 ring-offset-1 ring-offset-transparent"
                      : isIllegal
                      ? "opacity-50"
                      : ""
                  }`}
                  style={{
                    boxShadow: canPlay
                      ? "0 4px 16px rgba(0,0,0,0.5), 0 0 6px rgba(255,220,60,0.4)"
                      : "0 2px 8px rgba(0,0,0,0.4)",
                  }}
                >
                  <Card card={c} faceUp />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
