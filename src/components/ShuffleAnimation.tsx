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
const HALF = 6; // 6 cards per half = 12 total

// Deal targets: north, east, south, west
const DEAL_TARGETS = [
  { x: 0,    y: -220, rotate: 0   }, // north
  { x: 270,  y: 0,    rotate: 90  }, // east
  { x: 0,    y: 220,  rotate: 180 }, // south
  { x: -270, y: 0,    rotate: -90 }, // west
];

// Distribute 12 cards evenly across 4 directions by global index
// L0-L5 get global indices 0-5, R0-R5 get 6-11
// Each direction gets 3 cards
function dealTarget(globalIdx: number) {
  return DEAL_TARGETS[globalIdx % 4];
}

export const ShuffleAnimation: React.FC<Props> = ({ onComplete }) => {
  const [phase, setPhase] = useState<Phase>("appear");

  useEffect(() => {
    // Slightly slower: total ~2.0s
    const timings: [Phase, number][] = [
      ["split",  320],
      ["riffle", 820],
      ["deal",   1380],
      ["done",   1900],
    ];

    const timers = timings.map(([p, delay]) =>
      setTimeout(() => setPhase(p), delay)
    );
    const doneTimer = setTimeout(onComplete, 2000);

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
      {/* Left half — global indices 0..5 */}
      {Array.from({ length: HALF }, (_, i) => {
        const globalIdx = i;
        const target = dealTarget(globalIdx);
        const stackX = -i * 0.7;
        const stackY = -i * 0.6;

        return (
          <motion.img
            key={`L${i}`}
            src={backMaroon}
            draggable={false}
            initial={{ x: stackX, y: stackY, rotate: -4, opacity: 0, scale: 0.88 }}
            animate={
              phase === "appear"
                ? { x: stackX, y: stackY, rotate: -4, opacity: 1, scale: 1 }
              : phase === "split"
                ? { x: -80, y: -i * 1.8, rotate: -14, opacity: 1, scale: 1 }
              : phase === "riffle"
                ? { x: -i * 0.4, y: -(i * 2 + 1), rotate: 0, opacity: 1, scale: 1 }
              : /* deal */
                { x: target.x, y: target.y, rotate: target.rotate + (i % 2 === 0 ? 20 : -20), opacity: 0, scale: 0.25 }
            }
            transition={
              phase === "appear"
                ? { type: "spring", stiffness: 260, damping: 22, delay: i * 0.035 }
              : phase === "split"
                ? { type: "spring", stiffness: 300, damping: 26, delay: i * 0.025 }
              : phase === "riffle"
                ? { type: "spring", stiffness: 460, damping: 28, delay: i * 0.065 }
              : /* deal */
                { duration: 0.38, ease: "easeIn", delay: globalIdx * 0.022 }
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

      {/* Right half — global indices 6..11 */}
      {Array.from({ length: HALF }, (_, i) => {
        const globalIdx = i + HALF;
        const target = dealTarget(globalIdx);
        const stackX = i * 0.7;
        const stackY = -i * 0.6;

        return (
          <motion.img
            key={`R${i}`}
            src={backMaroon}
            draggable={false}
            initial={{ x: stackX, y: stackY, rotate: 4, opacity: 0, scale: 0.88 }}
            animate={
              phase === "appear"
                ? { x: stackX, y: stackY, rotate: 4, opacity: 1, scale: 1 }
              : phase === "split"
                ? { x: 80, y: -i * 1.8, rotate: 14, opacity: 1, scale: 1 }
              : phase === "riffle"
                ? { x: i * 0.4, y: -(i * 2 + 2), rotate: 0, opacity: 1, scale: 1 }
              : /* deal */
                { x: target.x, y: target.y, rotate: target.rotate + (i % 2 === 0 ? -20 : 20), opacity: 0, scale: 0.25 }
            }
            transition={
              phase === "appear"
                ? { type: "spring", stiffness: 260, damping: 22, delay: i * 0.035 + 0.018 }
              : phase === "split"
                ? { type: "spring", stiffness: 300, damping: 26, delay: i * 0.025 + 0.012 }
              : phase === "riffle"
                ? { type: "spring", stiffness: 460, damping: 28, delay: i * 0.065 + 0.032 }
              : /* deal */
                { duration: 0.38, ease: "easeIn", delay: globalIdx * 0.022 }
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
        {phase !== "deal" && (
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              top: "62%",
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(255,255,255,0.4)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              pointerEvents: "none",
            }}
          >
            {(phase === "appear" || phase === "split") ? "Shuffling…" : "Dealing…"}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
