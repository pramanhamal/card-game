import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "./WaitingRoom.css";

interface Player {
  id: string;
  name: string;
  seat: string | null;
}

interface WaitingRoomProps {
  roomId: string;
  players: Player[];
  currentPlayerSeat: string | null;
  isHost: boolean;
  mode: string;
  onStartGame: () => void;
  onLeave: () => void;
}

const SEAT_ORDER = ["north", "east", "south", "west"];
const SEAT_POSITIONS = {
  north: { top: "10%", left: "50%", transform: "translateX(-50%)" },
  east: { top: "50%", right: "10%", transform: "translateY(-50%)" },
  south: { bottom: "10%", left: "50%", transform: "translateX(-50%)" },
  west: { top: "50%", left: "10%", transform: "translateY(-50%)" },
};

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  roomId,
  players,
  currentPlayerSeat,
  isHost,
  mode,
  onStartGame,
  onLeave,
}) => {
  const [canStart, setCanStart] = useState(false);

  useEffect(() => {
    // Host can start with at least 1 player, or auto-start with 4
    const playerCount = players.length;
    setCanStart(playerCount >= 1);
  }, [players]);

  // Build seat map
  const seatMap: Record<string, Player | null> = {
    north: null,
    east: null,
    south: null,
    west: null,
  };

  players.forEach((p) => {
    if (p.seat && p.seat in seatMap) {
      seatMap[p.seat] = p;
    }
  });

  return (
    <motion.div
      className="waiting-room"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="waiting-header">
        <h1>Waiting for Players</h1>
        <p className="room-id">Room: {roomId}</p>
        {mode === "singleplayer" && <p className="room-mode">Playing with AI Bots</p>}
        {mode === "private_table" && <p className="room-mode">Private Table</p>}
        {mode === "hotspot" && <p className="room-mode">Hotspot Match</p>}
        {mode === "multiplayer" && <p className="room-mode">Multiplayer</p>}
      </div>

      <div className="table-visualization">
        {SEAT_ORDER.map((seat) => (
          <motion.div
            key={seat}
            className={`seat-slot ${seat}`}
            style={SEAT_POSITIONS[seat as keyof typeof SEAT_POSITIONS] as React.CSSProperties}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: SEAT_ORDER.indexOf(seat) * 0.1 }}
          >
            {seatMap[seat] ? (
              <motion.div
                className={`player-card ${seat === currentPlayerSeat ? "current" : ""}`}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
              >
                <div className="player-avatar">👤</div>
                <div className="player-info">
                  <div className="player-name">{seatMap[seat]!.name}</div>
                  <div className="seat-label">{seat.toUpperCase()}</div>
                </div>
                {seat === currentPlayerSeat && <div className="you-badge">YOU</div>}
              </motion.div>
            ) : (
              <motion.div
                className="empty-slot"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
              >
                <div className="empty-icon">+</div>
                <div className="empty-label">Empty</div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="waiting-info">
        <p className="player-count">
          {players.length} / {mode === "singleplayer" ? "4 (with AI)" : "4"}
        </p>
        {mode === "multiplayer" && !isHost && (
          <p className="waiting-message">Waiting for {4 - players.length} more player(s)...</p>
        )}
        {mode === "hotspot" && !isHost && (
          <p className="waiting-message">Waiting for {4 - players.length} more player(s)...</p>
        )}
        {mode === "private_table" && !isHost && (
          <p className="waiting-message">Waiting for host to start the game...</p>
        )}
        {isHost && mode === "private_table" && (
          <p className="host-message">You can start the game with any number of players!</p>
        )}
      </div>

      <div className="waiting-actions">
        <motion.button
          className="btn-leave"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onLeave}
        >
          ← Leave
        </motion.button>

        {isHost && mode === "private_table" && (
          <motion.button
            className="btn-start"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStartGame}
            disabled={!canStart}
          >
            Start Game 🎯
          </motion.button>
        )}

        {!isHost && players.length === 4 && (
          <motion.div
            className="auto-start-message"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <span className="pulse">●</span> Auto-starting...
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
