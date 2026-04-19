import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { Card } from "../types/spades";

interface Props {
  onSelect: (bid: number) => void;
  hand?: Card[];
}

const SUIT_SYMBOLS = ["♠", "♥", "♦", "♣"];

// Calculate win probability for each bid based on hand strength
function calculateBidProbability(hand: Card[], bid: number): number {
  if (!hand || hand.length === 0) return 0.5; // Default 50% if no hand info

  // Count high cards (A, K, Q, J, 10)
  const cardValues: Record<string, number> = { A: 5, K: 4, Q: 3, J: 2, "10": 1, "9": 0.5, "8": 0.3 };

  let strength = 0;
  for (const card of hand) {
    strength += cardValues[card.rank as string] || 0;
  }

  // Estimate expected tricks: strength / total possible
  const maxStrength = 13 * 5; // 13 aces worth 5 each
  const estimatedTricks = (strength / maxStrength) * 13;

  // Probability is how likely we are to win at least 'bid' tricks
  // Using a simple sigmoid-like calculation
  const diff = estimatedTricks - bid;
  const probability = 1 / (1 + Math.exp(-diff * 0.8)); // sigmoid function

  return Math.max(0.1, Math.min(0.95, probability)); // Clamp between 10% and 95%
}

export const BetPopup: React.FC<Props> = ({ onSelect, hand = [] }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(5);
  const [selected, setSelected] = useState<number | null>(null);
  const bids = [1, 2, 3, 4, 5, 6, 7, 8];

  // Calculate probabilities for each bid
  const probabilities = bids.map((bid) => ({
    bid,
    probability: calculateBidProbability(hand, bid),
  }));

  // Find recommended bid (highest probability)
  const recommendedBid = probabilities.reduce((max, current) =>
    current.probability > max.probability ? current : max
  ).bid;

  // Countdown timer
  useEffect(() => {
    if (selected) return; // Don't countdown if already selected

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-select recommended bid
          onSelect(recommendedBid);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selected, recommendedBid, onSelect]);

  const handleSelectBid = (bid: number) => {
    setSelected(bid);
    onSelect(bid);
  };

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
          position: "relative",
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

        {/* Bid grid with probabilities */}
        <div className="grid grid-cols-8 gap-2 mb-4">
          {probabilities.map(({ bid, probability }) => {
            const isRecommended = bid === recommendedBid;
            const percentChance = Math.round(probability * 100);
            const isHighProb = probability > 0.6;

            return (
              <motion.div key={bid} className="flex flex-col items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.92 }}
                  onHoverStart={() => setHovered(bid)}
                  onHoverEnd={() => setHovered(null)}
                  onClick={() => handleSelectBid(bid)}
                  className="relative rounded-lg py-3 px-2 text-base font-bold transition-all w-full"
                  style={{
                    background:
                      hovered === bid
                        ? "rgba(255,215,0,0.35)"
                        : isRecommended
                        ? "rgba(76,175,80,0.25)"
                        : isHighProb
                        ? "rgba(255,193,7,0.15)"
                        : "rgba(255,255,255,0.1)",
                    border:
                      hovered === bid
                        ? "2px solid rgba(255,215,0,0.6)"
                        : isRecommended
                        ? "2px solid rgba(76,175,80,0.8)"
                        : isHighProb
                        ? "1px solid rgba(255,193,7,0.4)"
                        : "1px solid rgba(255,255,255,0.15)",
                    color:
                      hovered === bid
                        ? "#ffd700"
                        : isRecommended
                        ? "#4caf50"
                        : "white",
                    boxShadow:
                      isRecommended
                        ? "0 0 10px rgba(76,175,80,0.4)"
                        : "none",
                  }}
                >
                  {bid}
                </motion.button>
                <div className="text-xs text-gray-400 text-center w-full">
                  {percentChance}%
                </div>
              </motion.div>
            );
          })}
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
              animate={{ width: `${(timeLeft / 5) * 100}%` }}
              transition={{ linear: true, duration: 0.1 }}
            />
          </div>
          {selected && (
            <div className="text-center mt-2 text-green-400 text-xs font-semibold">
              ✓ Bid selected: {selected}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
