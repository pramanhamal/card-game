import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { Card } from "../types/spades";

interface Props {
  onSelect: (bid: number) => void;
  hand?: Card[];
}

const SUIT_SYMBOLS = ["♠", "♥", "♦", "♣"];

// Calculate estimated tricks for hand strength
function estimateHandStrength(hand: Card[]): number {
  if (!hand || hand.length === 0) return 3; // Default middle bid

  const cardValues: Record<string, number> = { A: 5, K: 4, Q: 3, J: 2, "10": 1, "9": 0.5, "8": 0.3 };

  let strength = 0;
  for (const card of hand) {
    strength += cardValues[card.rank as string] || 0;
  }

  // Convert card strength to estimated tricks (0-8)
  // Max strength = 65 (13 aces), should estimate ~8 tricks
  // Min strength = 0, should estimate ~0-1 tricks
  const maxStrength = 65;
  const estimatedTricks = Math.max(1, Math.round((strength / maxStrength) * 8));

  return Math.min(8, estimatedTricks);
}

export const BetPopup: React.FC<Props> = ({ onSelect, hand = [] }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(1);
  const bids = [1, 2, 3, 4, 5, 6, 7, 8];

  // Calculate recommended bid based on hand strength
  const estimatedTricks = estimateHandStrength(hand);
  const recommendedBid = Math.min(8, Math.max(1, estimatedTricks));

  // Auto-select after 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onSelect(recommendedBid);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [recommendedBid, onSelect]);

  return (
    <motion.div
      className="fixed z-50 pointer-events-auto"
      style={{
        top: "35%",
        left: "50%",
      }}
      initial={{ scale: 0.85, opacity: 0, x: "-50%", y: "-50%" }}
      animate={{ scale: 1, opacity: 1, x: "-50%", y: "-50%" }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
    >
      <motion.div
        className="rounded-3xl px-12 py-5"
        style={{
          background: "linear-gradient(160deg, #1a3a1a 0%, #0d2410 100%)",
          border: "2px solid rgba(255,255,255,0.2)",
          boxShadow:
            "0 24px 60px rgba(0,0,0,0.9), 0 0 20px rgba(34,197,94,0.2)",
          minWidth: "600px",
        }}
      >
        {/* Header */}
        <div className="text-center mb-3">
          <div className="flex justify-center gap-3 mb-1 text-base">
            {SUIT_SYMBOLS.map((s, i) => (
              <span
                key={i}
                style={{ color: i < 2 ? "#e8e8e8" : "#d44" }}
              >
                {s}
              </span>
            ))}
          </div>
          <h2 className="text-lg font-bold text-white tracking-wide">
            Place Your Bid
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            How many tricks will you win?
          </p>
        </div>

        {/* Bid grid */}
        <div className="grid grid-cols-8 gap-3 mb-4">
          {bids.map((b) => (
            <motion.button
              key={b}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.92 }}
              onHoverStart={() => setHovered(b)}
              onHoverEnd={() => setHovered(null)}
              onClick={() => onSelect(b)}
              className="relative rounded-lg py-4 px-2 text-lg font-bold transition-all"
              style={{
                background:
                  hovered === b
                    ? "rgba(255,215,0,0.35)"
                    : b === recommendedBid
                    ? "rgba(76,175,80,0.25)"
                    : "rgba(255,255,255,0.1)",
                border:
                  hovered === b
                    ? "2px solid rgba(255,215,0,0.6)"
                    : b === recommendedBid
                    ? "2px solid rgba(76,175,80,0.8)"
                    : "1px solid rgba(255,255,255,0.15)",
                color:
                  hovered === b
                    ? "#ffd700"
                    : b === recommendedBid
                    ? "#4caf50"
                    : "white",
                boxShadow:
                  b === recommendedBid
                    ? "0 0 12px rgba(76,175,80,0.5)"
                    : "none",
              }}
            >
              {b}
            </motion.button>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-4 pt-3 border-t border-gray-600">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-400">Auto-select in</span>
            <span className="text-sm font-bold text-white">{timeLeft}s</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-blue-500"
              initial={{ width: "100%" }}
              animate={{ width: `${(timeLeft / 1) * 100}%` }}
              transition={{ linear: true, duration: 0.1 }}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
