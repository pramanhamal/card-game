// src/components/Dashboard.tsx
import React from "react";
import { motion } from "framer-motion";
import type { GameResult, PlayerId } from "../types/spades";

interface Props {
  history: GameResult[];
  onClose: () => void;
  playerNames: Record<PlayerId, string>;
  avatars: Record<PlayerId, string | undefined>;
  yourSeat?: PlayerId;
}

const MEDALS = ["🥇", "🥈", "🥉", "🎖️"];

export const Dashboard: React.FC<Props> = ({
  history,
  onClose,
  playerNames,
  avatars,
  yourSeat,
}) => {
  if (history.length === 0) return null;

  const lastRound = history[history.length - 1]!;
  const scores: Record<PlayerId, number> =
    lastRound.totalScores != null ? lastRound.totalScores : lastRound.scores;

  const players = Object.keys(scores) as PlayerId[];
  const sorted = [...players].sort((a, b) => scores[b] - scores[a]);

  const displayName = (p: PlayerId) => {
    const base = playerNames[p] || p.toUpperCase();
    return p === yourSeat ? `${base} (You)` : base;
  };

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #1c1c2e 0%, #0e0e1a 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <h2 className="text-lg font-bold text-white">Leaderboard</h2>
          <span className="text-xs text-gray-500">
            Round {lastRound.gameId}
          </span>
        </div>

        {/* Player rows */}
        <div className="p-4 space-y-2">
          {sorted.map((p, idx) => {
            const isYou = p === yourSeat;
            const roundScore = lastRound.scores[p];
            const totalScore = scores[p];

            return (
              <motion.div
                key={p}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 + idx * 0.07 }}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{
                  background:
                    idx === 0
                      ? "rgba(255,215,0,0.1)"
                      : isYou
                      ? "rgba(99,102,241,0.12)"
                      : "rgba(255,255,255,0.04)",
                  border:
                    idx === 0
                      ? "1px solid rgba(255,215,0,0.25)"
                      : isYou
                      ? "1px solid rgba(99,102,241,0.25)"
                      : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <span className="text-xl w-7 text-center flex-shrink-0">
                  {MEDALS[idx] || ""}
                </span>

                {/* Avatar */}
                {avatars[p] ? (
                  <img
                    src={avatars[p]}
                    alt={displayName(p)}
                    className="w-9 h-9 rounded-full flex-shrink-0"
                    style={{ border: "2px solid rgba(255,255,255,0.15)" }}
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold"
                    style={{
                      background: idx === 0 ? "rgba(255,215,0,0.3)" : "rgba(255,255,255,0.12)",
                      color: idx === 0 ? "#ffd700" : "white",
                    }}
                  >
                    {(playerNames[p] || "?")[0].toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div
                    className="font-semibold text-sm truncate"
                    style={{
                      color: idx === 0 ? "#ffd700" : "rgba(255,255,255,0.9)",
                    }}
                  >
                    {displayName(p)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Bid {lastRound.bids[p]} · Won {lastRound.tricksWon[p]}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div
                    className="text-lg font-black tabular-nums"
                    style={{ color: idx === 0 ? "#ffd700" : "rgba(255,255,255,0.8)" }}
                  >
                    {totalScore}
                  </div>
                  <div
                    className="text-xs tabular-nums"
                    style={{
                      color: roundScore >= 0 ? "#4ade80" : "#f87171",
                    }}
                  >
                    {roundScore >= 0 ? "+" : ""}
                    {roundScore}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={onClose}
        className="mt-5 px-8 py-3 rounded-xl font-bold text-sm tracking-wide text-white"
        style={{
          background: "linear-gradient(90deg, #16a34a, #15803d)",
          boxShadow: "0 4px 16px rgba(22,163,74,0.35)",
        }}
      >
        Continue →
      </motion.button>
    </motion.div>
  );
};

export default Dashboard;
