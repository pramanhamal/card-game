// src/components/TrickPile.tsx
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerId, Card as CardType } from '../types/spades';
import { Card } from './Card';

interface TrickPileProps {
  trick: Record<PlayerId, CardType | null>;
  winner: PlayerId | null;
  onFlyOutEnd?: () => void;
}

type Position = { x: number; y: number; rotate: number };

const seatOffsets: Record<PlayerId, Position> = {
  north: { x:   0, y: -200, rotate:  0 },
  east:  { x: 300, y:    0, rotate:  0 },
  west:  { x:-300, y:    0, rotate:  0 },
  south: { x:   0, y:  200, rotate:  0 },
};

const centerSlots: Record<PlayerId, Position> = {
  north: { x:   0, y:  -50, rotate: -5 },
  east:  { x:  50, y:    0, rotate: 10 },
  west:  { x: -50, y:    0, rotate: -8 },
  south: { x:   0, y:   50, rotate:  3 },
};

const playOrder: PlayerId[] = ['north','east','west','south'];

export const TrickPile: React.FC<TrickPileProps> = ({ trick, winner, onFlyOutEnd }) => {
  const [cards,     setCards]     = useState<Array<{ player: PlayerId; card: CardType }>>([]);
  const [flyingOut, setFlyingOut] = useState(false);
  const prevTrickRef = useRef(trick);

  // 1) Append newly played cards immediately
  useEffect(() => {
    const newPlays: Array<{ player: PlayerId; card: CardType }> = [];
    for (const p of playOrder) {
      if (!prevTrickRef.current[p] && trick[p]) {
        newPlays.push({ player: p, card: trick[p]! });
      }
    }
    if (newPlays.length) {
      setCards(old =>
        [...old, ...newPlays].sort(
          (a,b) => playOrder.indexOf(a.player) - playOrder.indexOf(b.player)
        )
      );
      setFlyingOut(false);
    }
    prevTrickRef.current = trick;
  }, [trick]);

  // 2) Once we have 4 cards & know the winner, hold 800ms then fly‑out, then clear
  useEffect(() => {
    if (cards.length === 4 && winner) {
      const t1 = setTimeout(() => setFlyingOut(true), 2000); // Wait 1s before fly-out
      const t2 = setTimeout(() => {
        setCards([]);
        setFlyingOut(false);
        if (onFlyOutEnd) onFlyOutEnd(); // Now evaluate the trick
      }, 2200); // Wait for animation to finish
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [cards, winner]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <AnimatePresence>
        {cards.map(({ player, card }, idx) => {
          const target = flyingOut && winner
            ? seatOffsets[winner]
            : centerSlots[player];
          return (
            <motion.div
              key={player}
              initial={seatOffsets[player]}
              animate={{
                x:      target.x,
                y:      target.y,
                rotate: target.rotate,
                scale:  flyingOut ? 0.6 : 1,
                opacity: 1,
              }}
              transition={{
                type:      'spring',
                stiffness: 300,
                damping:   25,
                delay:     flyingOut ? 0 : idx * 0.1,
              }}
              style={{ position: 'absolute', zIndex: idx + 1 }}
            >
              <Card card={card} faceUp />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
