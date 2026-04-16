// src/components/TrickPile.tsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PlayerId, Card as CardType } from "../types/spades";
import { Card } from "./Card";

interface TrickPileProps {
  trick: Record<PlayerId, CardType | null>;
  winner: PlayerId | null;
  seatOf: Record<PlayerId, "north" | "east" | "south" | "west">;
  onFlyOutEnd?: () => void;
}

type Position = { x: number; y: number; rotate: number };

// Spawn positions — cards animate FROM here to center
const seatOffsets: Record<"north" | "east" | "south" | "west", Position> = {
  north: { x: 0, y: -220, rotate: 0 },
  east:  { x: 340, y: 0, rotate: 0 },
  west:  { x: -340, y: 0, rotate: 0 },
  south: { x: 0, y: 220, rotate: 0 },
};

// Where cards rest in the center of the table
const centerSlots: Record<"north" | "east" | "south" | "west", Position> = {
  north: { x: 0, y: -56, rotate: -6 },
  east:  { x: 56, y: 0,  rotate: 12 },
  west:  { x: -56, y: 0, rotate: -9 },
  south: { x: 0, y: 56,  rotate: 4 },
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
      const flyOutTimer = setTimeout(() => setIsFlyingOut(true), 820);
      const cleanupTimer = setTimeout(() => {
        onFlyOutEnd?.();
        setIsFlyingOut(false);
      }, 1480);
      return () => {
        clearTimeout(flyOutTimer);
        clearTimeout(cleanupTimer);
      };
    }
  }, [winner, onFlyOutEnd]);

  const cardsToRender = (
    Object.entries(trick) as [PlayerId, CardType | null][]
  )
    .filter(([, card]) => card !== null)
    .map(([player, card]) => ({
      player,
      card: card!,
      key: `${player}-${card!.suit}-${card!.rank}`,
    }));

  const trickIsFull = cardsToRender.length === 4;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Subtle glow on the table center when all cards are in */}
      <AnimatePresence>
        {trickIsFull && !isFlyingOut && (
          <motion.div
            key="glow"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="absolute rounded-full"
            style={{
              width: 200,
              height: 140,
              background:
                "radial-gradient(ellipse, rgba(255,220,80,0.18) 0%, transparent 70%)",
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cardsToRender.map(({ key, player, card }, idx) => {
          const seat = seatOf[player];
          if (!seat) return null;

          const startPos = seatOffsets[seat];
          const endPos = centerSlots[seat];

          let animateTarget: Position & { scale: number; opacity: number };

          if (isFlyingOut && winner) {
            const winnerSeat = seatOf[winner];
            const winnerTarget = seatOffsets[winnerSeat];
            animateTarget = {
              x: winnerTarget.x,
              y: winnerTarget.y,
              rotate: 0,
              scale: 0.4,
              opacity: 0,
            };
          } else {
            animateTarget = {
              x: endPos.x,
              y: endPos.y,
              rotate: endPos.rotate,
              scale: 1,
              opacity: 1,
            };
          }

          return (
            <motion.div
              key={key}
              initial={{
                x: startPos.x,
                y: startPos.y,
                rotate: startPos.rotate,
                scale: 0.85,
                opacity: 0,
              }}
              animate={animateTarget}
              exit={{ opacity: 0, scale: 0.2, transition: { duration: 0.2 } }}
              transition={
                isFlyingOut
                  ? { type: "tween", duration: 0.38, ease: "easeIn" }
                  : {
                      type: "spring",
                      stiffness: 420,
                      damping: 32,
                      delay: idx * 0.06,
                    }
              }
              style={{ position: "absolute", zIndex: idx + 1 }}
            >
              {/* Card glow ring for the winning seat */}
              <div
                className="relative"
                style={
                  winner && seatOf[winner] === seat && trickIsFull
                    ? {
                        filter:
                          "drop-shadow(0 0 10px rgba(255,215,0,0.9)) drop-shadow(0 0 4px rgba(255,215,0,0.6))",
                      }
                    : {}
                }
              >
                <Card card={card} faceUp />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
