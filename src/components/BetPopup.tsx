import React, { useState } from "react";
import { motion } from "framer-motion";

interface Props {
  onSelect: (bid: number) => void;
}

const SUIT_SYMBOLS = ["♠", "♥", "♦", "♣"];

export const BetPopup: React.FC<Props> = ({ onSelect }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const bids = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <motion.div
      className="fixed z-50 pointer-events-auto"
      style={{
        top: "45%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
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
        <div className="grid grid-cols-8 gap-2">
          {bids.map((b) => (
            <motion.button
              key={b}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.92 }}
              onHoverStart={() => setHovered(b)}
              onHoverEnd={() => setHovered(null)}
              onClick={() => onSelect(b)}
              className="relative rounded-lg py-3 px-2 text-base font-bold transition-all"
              style={{
                background:
                  hovered === b
                    ? "rgba(255,215,0,0.35)"
                    : "rgba(255,255,255,0.1)",
                border:
                  hovered === b
                    ? "2px solid rgba(255,215,0,0.6)"
                    : "1px solid rgba(255,255,255,0.15)",
                color: hovered === b ? "#ffd700" : "white",
              }}
            >
              {b}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
