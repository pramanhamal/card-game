// src/components/Opponent.tsx
import React from "react";
import { motion } from "framer-motion";

export type OpponentPosition = "north" | "west" | "east";

interface OpponentProps {
  name: string;
  cardsCount: number;
  tricks: number;
  position: OpponentPosition;
  isAI?: boolean;
  isCurrentTurn?: boolean;
  bid?: number | null;
}

const AVATAR_GRADIENTS: Record<OpponentPosition, [string, string]> = {
  north: ["#1a6fd4", "#1452a8"],
  west:  ["#7c3aed", "#5b21b6"],
  east:  ["#0e7c5a", "#065f46"],
};

export const Opponent: React.FC<OpponentProps> = ({
  name,
  cardsCount,
  tricks,
  position,
  isAI = false,
  isCurrentTurn = false,
  bid = null,
}) => {
  const posClasses: Record<OpponentPosition, string> = {
    north: "absolute top-3 left-1/2 -translate-x-1/2",
    west:  "absolute left-3 top-1/2 -translate-y-1/2",
    east:  "absolute right-3 top-1/2 -translate-y-1/2",
  };

  const initial = name ? name[0].toUpperCase() : "?";
  const [colorTop, colorBot] = AVATAR_GRADIENTS[position];
  const hasBid = bid !== null && bid >= 0;

  const dots = Array.from({ length: Math.min(cardsCount, 6) });

  return (
    <div
      className={`${posClasses[position]} flex flex-col items-center pointer-events-none select-none`}
      style={{ zIndex: 5 }}
    >
      <motion.div
        animate={isCurrentTurn ? { scale: [1, 1.07, 0.97, 1.07, 0.97, 1] } : { scale: 1 }}
        transition={isCurrentTurn ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } : {}}
        style={{ position: "relative" }}
      >
        {/* Glow ring */}
        {isCurrentTurn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute",
              inset: -6,
              borderRadius: "50%",
              border: "2.5px solid #ffd700",
              boxShadow: "0 0 16px rgba(255,210,40,0.7)",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Main circle */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: colorBot,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(0,0,0,0.55)",
            position: "relative",
          }}
        >
          {/* Inner circle */}
          <div
            style={{
              width: 66,
              height: 66,
              borderRadius: "50%",
              background: colorTop,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
            }}
          >
            {/* Initial */}
            <span style={{ fontSize: 20, fontWeight: 900, color: "rgba(255,255,255,0.9)", letterSpacing: 1 }}>
              {initial}
            </span>

            {/* Bid or card dots */}
            {hasBid ? (
              <div style={{ textAlign: "center", lineHeight: 1 }}>
                <div style={{ fontSize: 8, color: "rgba(255,255,255,0.5)", letterSpacing: 0.5 }}>Call</div>
                <div style={{ fontSize: 13, fontWeight: "bold", color: "#ffd700" }}>
                  {bid === 0 ? "NIL" : bid}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center", maxWidth: 36, marginTop: 2 }}>
                {dots.map((_, i) => (
                  <div
                    key={i}
                    style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.4)" }}
                  />
                ))}
                {cardsCount > 6 && (
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.55)" }}>+{cardsCount - 6}</span>
                )}
              </div>
            )}
          </div>

          {/* Tricks badge */}
          {tricks > 0 && (
            <div
              style={{
                position: "absolute",
                bottom: -4,
                right: -4,
                background: "rgba(0,0,0,0.75)",
                border: "1px solid rgba(255,210,0,0.5)",
                borderRadius: 10,
                padding: "1px 5px",
                fontSize: 10,
                color: "#ffd700",
                fontWeight: "bold",
              }}
            >
              {tricks}✦
            </div>
          )}
        </div>
      </motion.div>

      {/* Name banner */}
      <div
        style={{
          marginTop: 6,
          padding: "3px 10px",
          borderRadius: 12,
          background: isCurrentTurn ? "rgba(255,210,40,0.2)" : "rgba(0,0,0,0.5)",
          border: isCurrentTurn ? "1px solid rgba(255,210,40,0.5)" : "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          gap: 5,
          maxWidth: 110,
          backdropFilter: "blur(6px)",
          transition: "all 0.3s ease",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: isCurrentTurn ? "#ffd700" : "rgba(255,255,255,0.9)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: 80,
          }}
        >
          {name}
        </span>
        {isAI && (
          <span style={{ fontSize: 9, background: "rgba(250,200,0,0.25)", color: "#ffd700", padding: "0 4px", borderRadius: 4 }}>
            Bot
          </span>
        )}
      </div>
    </div>
  );
};
