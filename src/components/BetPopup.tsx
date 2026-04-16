import React, { useState } from "react";
import { motion } from "framer-motion";

interface Props {
  onSelect: (bid: number) => void;
}

const SUIT_SYMBOLS = ["♠", "♥", "♦", "♣"];

export const BetPopup: React.FC<Props> = ({ onSelect }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const bids = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="rounded-2xl p-6 w-full max-w-xs"
        style={{
          background: "linear-gradient(160deg, #1a3a1a 0%, #0d2410 100%)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow:
            "0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        {/* Header */}
        <div className="text-center mb-5">
          <div className="flex justify-center gap-3 mb-2 text-lg">
            {SUIT_SYMBOLS.map((s, i) => (
              <span
                key={i}
                style={{ color: i < 2 ? "#e8e8e8" : "#d44" }}
              >
                {s}
              </span>
            ))}
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            Place Your Bid
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            How many tricks will you win?
          </p>
        </div>

        {/* Bid grid */}
        <div className="grid grid-cols-4 gap-2">
          {bids.map((b) => (
            <motion.button
              key={b}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              onHoverStart={() => setHovered(b)}
              onHoverEnd={() => setHovered(null)}
              onClick={() => onSelect(b)}
              className="relative rounded-xl py-3 text-lg font-bold transition-colors"
              style={{
                background:
                  b === 0
                    ? hovered === b
                      ? "rgba(239,68,68,0.35)"
                      : "rgba(239,68,68,0.18)"
                    : hovered === b
                    ? "rgba(255,215,0,0.28)"
                    : "rgba(255,255,255,0.08)",
                border:
                  b === 0
                    ? "1px solid rgba(239,68,68,0.4)"
                    : "1px solid rgba(255,255,255,0.1)",
                color: b === 0 ? "#fca5a5" : "white",
              }}
            >
              {b === 0 ? "NIL" : b}
            </motion.button>
          ))}
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">
          Nil bid = 0 tricks scored
        </p>
      </motion.div>
    </motion.div>
  );
};
