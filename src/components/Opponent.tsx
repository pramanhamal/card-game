// src/components/Opponent.tsx
import React from "react";
import { motion } from "framer-motion";
import backMaroon from "../assets/cards/back-maroon.png";

export type OpponentPosition = "north" | "west" | "east";

interface OpponentProps {
  name: string;
  cardsCount: number;
  tricks: number;
  position: OpponentPosition;
  isAI?: boolean;
  isCurrentTurn?: boolean;
}

export const Opponent: React.FC<OpponentProps> = ({
  name,
  cardsCount,
  tricks,
  position,
  isAI = false,
  isCurrentTurn = false,
}) => {
  const posClasses: Record<OpponentPosition, string> = {
    north: "absolute top-3 left-1/2 -translate-x-1/2",
    west: "absolute left-3 top-1/2 -translate-y-1/2",
    east: "absolute right-3 top-1/2 -translate-y-1/2",
  };

  const displayCount = Math.min(cardsCount, 13);

  // For north: horizontal fan (cards spread left-right)
  // For east/west: vertical fan, container rotated 90°
  const isSide = position === "west" || position === "east";

  const fan = Array.from({ length: displayCount }).map((_, i) => {
    const offset = (i - (displayCount - 1) / 2) * 6;
    return (
      <img
        key={i}
        src={backMaroon}
        alt="Back of card"
        draggable={false}
        style={{
          position: "absolute",
          width: 44,
          height: 66,
          borderRadius: 5,
          transform: `rotate(${offset}deg) translateY(-8px)`,
          transformOrigin: "50% 100%",
          boxShadow: "0 2px 6px rgba(0,0,0,0.45)",
        }}
      />
    );
  });

  // Avatar initial letter
  const initial = name ? name[0].toUpperCase() : "?";

  return (
    <div
      className={`${posClasses[position]} flex flex-col items-center pointer-events-none`}
      style={{ zIndex: 5 }}
    >
      {/* Turn glow ring */}
      {isCurrentTurn && (
        <motion.div
          className="absolute rounded-full"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0.6, 1, 0.6], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            inset: isSide ? "-10px -6px" : "-8px -12px",
            border: "2px solid rgba(255, 220, 60, 0.85)",
            boxShadow: "0 0 14px rgba(255,210,40,0.6), 0 0 4px rgba(255,210,40,0.4)",
            borderRadius: 16,
            zIndex: -1,
          }}
        />
      )}

      {/* Card fan */}
      <div
        style={{
          position: "relative",
          width: isSide ? 70 : 90,
          height: isSide ? 90 : 70,
          transform: isSide ? "rotate(90deg)" : undefined,
        }}
      >
        {fan}
      </div>

      {/* Player info pill */}
      <div
        className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
        style={{
          background: isCurrentTurn
            ? "rgba(255,210,40,0.18)"
            : "rgba(0,0,0,0.45)",
          backdropFilter: "blur(6px)",
          border: isCurrentTurn
            ? "1px solid rgba(255,210,40,0.5)"
            : "1px solid rgba(255,255,255,0.1)",
          transition: "all 0.3s ease",
        }}
      >
        {/* Avatar circle */}
        <div
          className="flex items-center justify-center rounded-full text-xs font-bold"
          style={{
            width: 20,
            height: 20,
            background: isCurrentTurn
              ? "rgba(255,210,40,0.7)"
              : "rgba(255,255,255,0.15)",
            color: isCurrentTurn ? "#1a1a00" : "white",
            fontSize: 11,
          }}
        >
          {initial}
        </div>
        <span
          className="text-xs font-semibold truncate max-w-[72px]"
          style={{ color: isCurrentTurn ? "#ffd700" : "rgba(255,255,255,0.9)" }}
        >
          {name}
        </span>
        {isAI && (
          <span
            className="text-xs px-1 rounded"
            style={{ background: "rgba(250,200,0,0.3)", color: "#ffd700" }}
          >
            Bot
          </span>
        )}
        <span
          className="text-xs ml-1"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          {tricks}✦
        </span>
      </div>
    </div>
  );
};
