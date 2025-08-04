// src/components/TrickPile.tsx
import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PlayerId, Card as CardType } from "../types/spades";
import { Card } from "./Card";

interface TrickPileProps {
  trick: Record<PlayerId, CardType | null>;
  winner: PlayerId | null;
  seatOf: Record<PlayerId, 'north' | 'east' | 'south' | 'west'>;
  onFlyOutEnd?: () => void;
}

type Position = { x: number; y: number; rotate: number };

const seatOffsets: Record<'north' | 'east' | 'south' | 'west', Position> = {
  north: { x: 0, y: -200, rotate: 0 },
  east: { x: 300, y: 0, rotate: 0 },
  west: { x: -300, y: 0, rotate: 0 },
  south: { x: 0, y: 200, rotate: 0 },
};

const centerSlots: Record<'north' | 'east' | 'south' | 'west', Position> = {
  north: { x: 0, y: -50, rotate: -5 },
  east: { x: 50, y: 0, rotate: 10 },
  west: { x: -50, y: 0, rotate: -8 },
  south: { x: 0, y: 50, rotate: 3 },
};

// Order in which plays are considered for stacking
const playOrder: PlayerId[] = ["north", "east", "west", "south"];

export const TrickPile: React.FC<TrickPileProps> = ({
  trick,
  winner,
  onFlyOutEnd,
  seatOf,
}) => {
  const [cards, setCards] = useState<Array<{ player: PlayerId; card: CardType }>>([]);
  const [flyingOut, setFlyingOut] = useState(false);
  const prevTrickRef = useRef(trick);

  // 1) Detect newly played cards and append them in order
  useEffect(() => {
    const newPlays: Array<{ player: PlayerId; card: CardType }> = [];
    for (const p of playOrder) {
      if (!prevTrickRef.current[p] && trick[p]) {
        newPlays.push({ player: p, card: trick[p]! });
      }
    }
    if (newPlays.length) {
      setCards((old) =>
        [...old, ...newPlays].sort(
          (a, b) =>
            playOrder.indexOf(a.player) - playOrder.indexOf(b.player)
        )
      );
      setFlyingOut(false);
    }
    prevTrickRef.current = trick;
  }, [trick]);

  // 2) When four cards present and winner known, trigger fly-out and reset
  useEffect(() => {
    if (cards.length === 4 && winner) {
      // Wait before starting fly-out to let user see completed trick
      const t1 = setTimeout(() => setFlyingOut(true), 2000);
      // After brief fly-out, clear and notify
      const t2 = setTimeout(() => {
        setCards([]);
        setFlyingOut(false);
        if (onFlyOutEnd) onFlyOutEnd();
      }, 2200);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [cards, winner, onFlyOutEnd]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <AnimatePresence>
        {cards.map(({ player, card }, idx) => {
          const isOut = flyingOut && winner;
          const seat = seatOf[player];
          const target = isOut ? seatOffsets[seat] : centerSlots[seat];

          return (
            <motion.div
              key={`${player}-${card.suit}-${card.rank}`}
              initial={seatOffsets[seat]}
              animate={{
                x: target.x,
                y: target.y,
                rotate: target.rotate,
                scale: isOut ? 0.6 : 1,
                opacity: 1,
              }}
              exit={{ opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                delay: isOut ? 0 : idx * 0.1,
              }}
              style={{ position: "absolute", zIndex: idx + 1 }}
            >
              <Card card={card} faceUp />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
