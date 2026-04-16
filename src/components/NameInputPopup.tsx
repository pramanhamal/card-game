import React, { useState } from "react";
import { motion } from "framer-motion";

interface Props {
  onNameSubmit: (name: string) => void;
}

export const NameInputPopup: React.FC<Props> = ({ onNameSubmit }) => {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (name.trim()) onNameSubmit(name.trim());
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        background:
          "radial-gradient(ellipse at 50% 45%, #1e7a42 0%, #0d4222 60%, #050f08 100%)",
      }}
    >
      {/* Decorative suit symbols */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
        style={{ opacity: 0.06, fontSize: 160, color: "white" }}
      >
        <span style={{ position: "absolute", top: "5%", left: "5%" }}>♠</span>
        <span style={{ position: "absolute", top: "5%", right: "5%" }}>♥</span>
        <span style={{ position: "absolute", bottom: "5%", left: "5%" }}>♣</span>
        <span style={{ position: "absolute", bottom: "5%", right: "5%" }}>♦</span>
      </div>

      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
        className="w-full max-w-sm mx-4 rounded-2xl p-8"
        style={{
          background: "rgba(10,30,15,0.9)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Logo area */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 400 }}
            className="text-5xl mb-3"
          >
            ♠
          </motion.div>
          <h1 className="text-3xl font-black tracking-widest text-white">
            SPADES
          </h1>
          <p className="text-xs text-gray-500 mt-1 tracking-wider uppercase">
            Multiplayer Card Game
          </p>
        </div>

        {/* Name form */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-gray-400 tracking-wider uppercase">
            Your Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Enter your name…"
            autoFocus
            className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 text-sm font-medium outline-none focus:ring-2 focus:ring-green-500"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              transition: "border-color 0.2s",
            }}
          />
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="w-full py-3 rounded-xl font-bold text-sm tracking-wide disabled:opacity-40"
            style={{
              background: name.trim()
                ? "linear-gradient(90deg, #16a34a, #15803d)"
                : "rgba(255,255,255,0.08)",
              color: "white",
              boxShadow: name.trim()
                ? "0 4px 16px rgba(22,163,74,0.35)"
                : "none",
              transition: "all 0.25s ease",
            }}
          >
            Enter the Table →
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
