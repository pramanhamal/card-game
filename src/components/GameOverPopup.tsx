import React from "react";
import { motion } from "framer-motion";
import type { PlayerId } from "../types/spades";

interface Props {
  totalScores: Record<PlayerId, number>;
  onPlayAgain: () => void;
}

const SEAT_ORDER: PlayerId[] = ["north", "east", "south", "west"];
const MEDALS = ["🥇", "🥈", "🥉", "🎖️"];

export const GameOverPopup: React.FC<Props> = ({ totalScores, onPlayAgain }) => {
  const sorted = [...SEAT_ORDER].sort(
    (a, b) => totalScores[b] - totalScores[a]
  );
  const topScore = totalScores[sorted[0]];
  const winners = sorted.filter((p) => totalScores[p] === topScore);

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 26, delay: 0.1 }}
        className="rounded-2xl p-7 w-full max-w-md text-center"
        style={{
          background: "linear-gradient(160deg, #1c1c2e 0%, #12121c 100%)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
        }}
      >
        {/* Trophy */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, -8, 8, -4, 4, 0] }}
          transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
          className="text-6xl mb-3"
        >
          🏆
        </motion.div>

        <h2 className="text-2xl font-bold text-white mb-1">Game Over!</h2>
        <p className="text-sm text-gray-400 mb-5">
          {winners.map((w) => w.toUpperCase()).join(" & ")} wins!
        </p>

        {/* Score list */}
        <div className="space-y-2 mb-6">
          {sorted.map((p, idx) => (
            <motion.div
              key={p}
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.25 + idx * 0.07 }}
              className="flex items-center justify-between px-4 py-2.5 rounded-xl"
              style={{
                background:
                  idx === 0
                    ? "rgba(255,215,0,0.14)"
                    : "rgba(255,255,255,0.05)",
                border:
                  idx === 0
                    ? "1px solid rgba(255,215,0,0.3)"
                    : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{MEDALS[idx]}</span>
                <span
                  className="font-semibold text-sm"
                  style={{ color: idx === 0 ? "#ffd700" : "rgba(255,255,255,0.8)" }}
                >
                  {p.toUpperCase()}
                </span>
              </div>
              <span
                className="font-bold text-lg tabular-nums"
                style={{ color: idx === 0 ? "#ffd700" : "rgba(255,255,255,0.7)" }}
              >
                {totalScores[p]}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={onPlayAgain}
          className="w-full py-3 rounded-xl font-bold text-sm tracking-wide"
          style={{
            background: "linear-gradient(90deg, #16a34a, #15803d)",
            color: "white",
            boxShadow: "0 4px 16px rgba(22,163,74,0.35)",
          }}
        >
          Play Again
        </motion.button>
      </motion.div>
    </motion.div>
  );
};
