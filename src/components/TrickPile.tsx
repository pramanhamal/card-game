// src/components/TrickPile.tsx
import React, { useEffect, useState } from "react";
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

export const TrickPile: React.FC<TrickPileProps> = ({
  trick,
  winner,
  onFlyOutEnd,
  seatOf,
}) => {
  const [isFlyingOut, setIsFlyingOut] = useState(false);

  useEffect(() => {
    if (winner) {
      const flyOutTimer = setTimeout(() => {
        setIsFlyingOut(true);
      }, 800);

      const cleanupTimer = setTimeout(() => {
        onFlyOutEnd?.();
        setIsFlyingOut(false);
      }, 1400);

      return () => {
        clearTimeout(flyOutTimer);
        clearTimeout(cleanupTimer);
      };
    }
  }, [winner, onFlyOutEnd]);

  const cardsToRender = (Object.entries(trick) as [PlayerId, CardType | null][])
    .filter(([, card]) => card !== null)
    .map(([player, card]) => ({
      player,
      card: card!,
      key: `${player}-${card!.suit}-${card!.rank}`,
    }));

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <AnimatePresence>
        {cardsToRender.map(({ key, player, card }, idx) => {
          const seat = seatOf[player];
          if (!seat) return null;

          const startPos = seatOffsets[seat];
          const endPos = centerSlots[seat];
          
          let animateTarget = {
            x: endPos.x,
            y: endPos.y,
            rotate: endPos.rotate,
            scale: 1,
          };

          if (isFlyingOut && winner) {
            const winnerSeat = seatOf[winner];
            const winnerTarget = seatOffsets[winnerSeat];
            animateTarget = {
              x: winnerTarget.x,
              y: winnerTarget.y,
              rotate: 0,
              scale: 0.5,
            };
          }

          return (
            <motion.div
              key={key}
              initial={{ x: startPos.x, y: startPos.y, rotate: startPos.rotate, scale: 1 }}
              animate={animateTarget}
              exit={{ opacity: 0, scale: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                delay: isFlyingOut ? 0 : idx * 0.1,
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