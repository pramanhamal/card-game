import React from "react";
import { GameMode } from "../types/spades";
import { motion } from "framer-motion";
import "./GameModeScreen.css";

interface GameModeScreenProps {
  onSelectMode: (mode: GameMode) => void;
}

export const GameModeScreen: React.FC<GameModeScreenProps> = ({ onSelectMode }) => {
  const modes = [
    {
      mode: GameMode.HOTSPOT,
      title: "🌐 Hotspot",
      description: "Play with random players worldwide",
      icon: "📡",
    },
    {
      mode: GameMode.PRIVATE_TABLE,
      title: "🎭 Private Table",
      description: "Create or join with PIN",
      icon: "🔐",
    },
    {
      mode: GameMode.MULTIPLAYER,
      title: "👥 Multiplayer",
      description: "Join friends in lobby",
      icon: "👫",
    },
    {
      mode: GameMode.SINGLEPLAYER,
      title: "🤖 Singleplayer",
      description: "Play against AI bots",
      icon: "🎮",
    },
  ];

  return (
    <motion.div
      className="game-mode-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="mode-header">
        <h1>Select Game Mode</h1>
        <p>Choose how you want to play</p>
      </div>

      <div className="modes-grid">
        {modes.map((item, idx) => (
          <motion.button
            key={item.mode}
            className="mode-button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectMode(item.mode)}
          >
            <div className="mode-icon">{item.icon}</div>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
