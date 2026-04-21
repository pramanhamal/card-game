import React from "react";
import { motion } from "framer-motion";
import type { PlayerId, GameResult } from "../types/spades";

interface Props {
  totalScores: Record<PlayerId, number>;
  seatingNames: Record<PlayerId, string>;
  gameHistory: GameResult[];
  onPlayAgain: () => void;
}

const SEAT_ORDER: PlayerId[] = ["north", "east", "south", "west"];
const MEDALS = ["🥇", "🥈", "🥉", "🎖️"];

export const GameOverPopup: React.FC<Props> = ({
  totalScores,
  seatingNames,
  gameHistory,
  onPlayAgain,
}) => {
  const sorted = [...SEAT_ORDER].sort(
    (a, b) => totalScores[b] - totalScores[a]
  );
  const topScore = totalScores[sorted[0]];
  const winners = sorted.filter((p) => totalScores[p] === topScore);

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 26, delay: 0.1 }}
        className="rounded-2xl p-7 w-full max-w-2xl text-center max-h-[90vh] overflow-y-auto"
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

        <h2 className="text-3xl font-bold text-white mb-1">Game Complete!</h2>
        <p className="text-sm text-gray-400 mb-6">
          {winners.map((w) => seatingNames[w]).join(" & ")} wins!
        </p>

        {/* Final Scores */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Final Scores</h3>
          <div className="space-y-2">
            {sorted.map((p, idx) => (
              <motion.div
                key={p}
                initial={{ x: -24, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.25 + idx * 0.07 }}
                className="flex items-center justify-between px-4 py-3 rounded-xl"
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
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{MEDALS[idx]}</span>
                  <div className="text-left">
                    <span
                      className="font-semibold text-sm block"
                      style={{ color: idx === 0 ? "#ffd700" : "rgba(255,255,255,0.9)" }}
                    >
                      {seatingNames[p]}
                    </span>
                    <span className="text-xs text-gray-500">
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </span>
                  </div>
                </div>
                <span
                  className="font-bold text-2xl tabular-nums"
                  style={{ color: idx === 0 ? "#ffd700" : "rgba(255,255,255,0.8)" }}
                >
                  {totalScores[p]}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Round Statistics */}
        {gameHistory.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Round Breakdown</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {gameHistory.map((round, roundIdx) => (
                <motion.div
                  key={roundIdx}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + roundIdx * 0.05 }}
                  className="px-4 py-2 rounded-lg bg-rgba(255,255,255,0.03) border border-rgba(255,255,255,0.06)"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-white">Round {round.gameId}</span>
                    <div className="flex gap-6 text-xs">
                      {SEAT_ORDER.map((seat) => (
                        <div key={seat} className="text-center">
                          <div className="text-gray-400">{seatingNames[seat]}</div>
                          <div className="text-white font-semibold">
                            {round.scores[seat]} pts
                          </div>
                          <div className="text-gray-500 text-xs">
                            {round.tricksWon[seat]} tricks, {round.bids[seat]} bid
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Button */}
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
