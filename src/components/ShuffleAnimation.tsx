// src/components/ShuffleAnimation.tsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import backMaroon from "../assets/cards/back-maroon.png";

interface Props {
  onComplete: () => void;
}

type Phase = "appear" | "split" | "riffle" | "deal" | "done";

const CARD_W = 44;
const CARD_H = 66;
const HALF = 6; // 6 cards per half = 12 total visible

// Deal targets relative to center (table corners)
const DEAL_TARGETS = [
  { x: 0,    y: -210 }, // north
  { x: 260,  y: 0 },    // east
  { x: 0,    y: 210 },  // south
  { x: -260, y: 0 },    // west
];

export const ShuffleAnimation: React.FC<Props> = ({ onComplete }) => {
  const [phase, setPhase] = useState<Phase>("appear");

  useEffect(() => {
    const timings: [Phase, number][] = [
      ["split",  260],
      ["riffle", 640],
      ["deal",   1080],
      ["done",   1480],
    ];

    const timers = timings.map(([p, delay]) =>
      setTimeout(() => setPhase(p), delay)
    );
    const doneTimer = setTimeout(onComplete, 1500);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  if (phase === "done") return null;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 40 }}
    >
      {/* Left half */}
      {Array.from({ length: HALF }, (_, i) => {
        const stackOffset = { x: -i * 0.6, y: -i * 0.5 };

        const splitX  = -72;
        const splitY  = -i * 1.5;
        const riffleX = -i * 0.5;
        const riffleY = -(i * 2 + 1);  // interleave: odd slots in combined pile

        const dealX = DEAL_TARGETS[3].x; // west
        const dealY = DEAL_TARGETS[3].y;

        return (
          <motion.img
            key={`L${i}`}
            src={backMaroon}
            draggable={false}
            initial={{ x: stackOffset.x, y: stackOffset.y, rotate: -3, opacity: 0, scale: 0.85 }}
            animate={
              phase === "appear"
                ? { x: stackOffset.x, y: stackOffset.y, rotate: -3, opacity: 1, scale: 1 }
              : phase === "split"
                ? { x: splitX, y: splitY, rotate: -12, opacity: 1, scale: 1 }
              : phase === "riffle"
                ? { x: riffleX, y: riffleY, rotate: 0, opacity: 1, scale: 1 }
              : // deal
                { x: dealX, y: dealY, rotate: -120, opacity: 0, scale: 0.3 }
            }
            transition={
              phase === "appear"
                ? { type: "spring", stiffness: 280, damping: 24, delay: i * 0.03 }
              : phase === "split"
                ? { type: "spring", stiffness: 340, damping: 28, delay: i * 0.02 }
              : phase === "riffle"
                ? { type: "spring", stiffness: 500, damping: 30, delay: i * 0.055 }
              : // deal
                { duration: 0.32, ease: "easeIn", delay: i * 0.018 }
            }
            style={{
              position: "absolute",
              width: CARD_W,
              height: CARD_H,
              borderRadius: 5,
              boxShadow: "0 4px 14px rgba(0,0,0,0.65)",
              zIndex: i,
            }}
          />
        );
      })}

      {/* Right half */}
      {Array.from({ length: HALF }, (_, i) => {
        const stackOffset = { x: i * 0.6, y: -i * 0.5 };

        const splitX  = 72;
        const splitY  = -i * 1.5;
        const riffleX = i * 0.5;
        const riffleY = -(i * 2 + 2);  // interleave: even slots in combined pile

        const dealX = DEAL_TARGETS[1].x; // east
        const dealY = DEAL_TARGETS[1].y;

        return (
          <motion.img
            key={`R${i}`}
            src={backMaroon}
            draggable={false}
            initial={{ x: stackOffset.x, y: stackOffset.y, rotate: 3, opacity: 0, scale: 0.85 }}
            animate={
              phase === "appear"
                ? { x: stackOffset.x, y: stackOffset.y, rotate: 3, opacity: 1, scale: 1 }
              : phase === "split"
                ? { x: splitX, y: splitY, rotate: 12, opacity: 1, scale: 1 }
              : phase === "riffle"
                ? { x: riffleX, y: riffleY, rotate: 0, opacity: 1, scale: 1 }
              : // deal
                { x: dealX, y: dealY, rotate: 120, opacity: 0, scale: 0.3 }
            }
            transition={
              phase === "appear"
                ? { type: "spring", stiffness: 280, damping: 24, delay: i * 0.03 + 0.015 }
              : phase === "split"
                ? { type: "spring", stiffness: 340, damping: 28, delay: i * 0.02 + 0.01 }
              : phase === "riffle"
                ? { type: "spring", stiffness: 500, damping: 30, delay: i * 0.055 + 0.028 }
              : // deal
                { duration: 0.32, ease: "easeIn", delay: i * 0.018 + 0.009 }
            }
            style={{
              position: "absolute",
              width: CARD_W,
              height: CARD_H,
              borderRadius: 5,
              boxShadow: "0 4px 14px rgba(0,0,0,0.65)",
              zIndex: i + HALF,
            }}
          />
        );
      })}

      {/* Phase label */}
      <AnimatePresence mode="wait">
        {(phase === "appear" || phase === "split" || phase === "riffle") && (
          <motion.div
            key="label"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              top: "62%",
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "0.08em",
              pointerEvents: "none",
            }}
          >
            {phase === "appear" && "Shuffling…"}
            {phase === "split"  && "Shuffling…"}
            {phase === "riffle" && "Dealing…"}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
