import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./MultiplayerLobby.css";

interface Player {
  id: string;
  name: string;
  seat?: string | null;
}

interface Room {
  id: string;
  players: Player[];
  started?: boolean;
  mode?: string;
}

interface MultiplayerLobbyProps {
  rooms: Record<string, Room>;
  currentRoom: Room | null;
  yourSeat: string | null;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
  onLeaveRoom: () => void;
}

const SEATS = ["north", "east", "south", "west"];
const SEAT_POSITIONS: Record<string, React.CSSProperties> = {
  north: { top: "5%", left: "50%", transform: "translateX(-50%)" },
  east: { top: "50%", right: "5%", transform: "translateY(-50%)" },
  south: { bottom: "5%", left: "50%", transform: "translateX(-50%)" },
  west: { top: "50%", left: "5%", transform: "translateY(-50%)" },
};

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  rooms,
  currentRoom,
  yourSeat,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
}) => {
  const [autoStarting, setAutoStarting] = useState(false);

  useEffect(() => {
    // Auto-start when 4 players are in current room
    if (
      currentRoom &&
      currentRoom.players &&
      currentRoom.players.length === 4 &&
      !autoStarting
    ) {
      setAutoStarting(true);
      console.log("Auto-starting game with 4 players");
    }
  }, [currentRoom, autoStarting]);

  // Get available seats (with assigned players first)
  const getSeatMap = (room: Room) => {
    const seatMap: Record<string, Player | null> = {
      north: null,
      east: null,
      south: null,
      west: null,
    };

    if (!Array.isArray(room.players)) return seatMap;

    // Assign players to seats based on seat assignment from server
    room.players.forEach((player, idx) => {
      if (player && player.seat && player.seat in seatMap) {
        // Player has assigned seat
        seatMap[player.seat] = player;
      } else if (player && idx < SEATS.length && !seatMap[SEATS[idx]]) {
        // Fallback: assign to seat based on join order
        seatMap[SEATS[idx]] = player;
      }
    });

    return seatMap;
  };

  // VISUAL ROOM TABLE: Show when player has joined a room
  const hasJoinedRoom = !!(currentRoom && currentRoom.id && currentRoom.players && Array.isArray(currentRoom.players));

  if (hasJoinedRoom) {
    const seatMap = getSeatMap(currentRoom!);
    const filledSeats = currentRoom!.players.length;

    console.log("Rendering VISUAL ROOM with currentRoom:", currentRoom);

    return (
      <motion.div
        className="multiplayer-lobby-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="lobby-header">
          <h1>🎴 Multiplayer Lobby</h1>
          <p className="room-info">Room: {currentRoom!.id}</p>
        </div>

        <div className="room-table-container">
          <div className="room-visualization">
            {/* Center table */}
            <div className="table-center">
              <div className="card-deck">🎴</div>
              <div className="player-count-badge">
                {filledSeats}
                <span>/4</span>
              </div>
            </div>

            {/* 4 Player Seats */}
            {SEATS.map((seat, idx) => (
              <motion.div
                key={seat}
                className={`seat-position ${seat}`}
                style={SEAT_POSITIONS[seat]}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <AnimatePresence>
                  {seatMap[seat] ? (
                    <motion.div
                      className={`player-slot filled ${
                        yourSeat === seat ? "your-seat" : ""
                      }`}
                      initial={{ scale: 0.8, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0.8, rotate: -10 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <div className="player-avatar">👤</div>
                      <div className="player-details">
                        <div className="player-name">
                          {seatMap[seat]!.name}
                        </div>
                        <div className="seat-label">
                          {seat.toUpperCase()}
                        </div>
                      </div>
                      {yourSeat === seat && (
                        <div className="you-indicator">YOU</div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      className="player-slot empty"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.8 }}
                    >
                      <div className="empty-seat-icon">+</div>
                      <div className="empty-seat-label">
                        {seat.toUpperCase()}
                      </div>
                      <div className="waiting-text">Waiting...</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Status and Actions */}
        <div className="lobby-status">
          {filledSeats === 4 && (
            <motion.div
              className="auto-start-message"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <span className="pulse-dot">●</span>
              Starting game...
            </motion.div>
          )}
          {filledSeats < 4 && (
            <p className="waiting-message">
              Waiting for {4 - filledSeats} more player{filledSeats === 3 ? "" : "s"}...
            </p>
          )}
        </div>

        {/* Leave Button */}
        <motion.button
          className="leave-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onLeaveRoom}
        >
          ← Leave Room
        </motion.button>
      </motion.div>
    );
  }

  console.log("Rendering ROOMS LIST - no currentRoom set. gameMode:", currentRoom);

  // Show available matchmaking rooms
  const multiplayerRooms = Object.entries(rooms)
    .filter(([id, room]) => room && room.mode === "multiplayer" && !room.started)
    .sort(([a], [b]) => a.localeCompare(b)); // Sort by room ID

  return (
    <motion.div
      className="multiplayer-lobby-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="lobby-header">
        <h1>🎴 Multiplayer Matchmaking</h1>
        <p className="subtitle">Join other players for a quick game</p>
      </div>

      <div className="rooms-section">
        <div className="rooms-list">
          {multiplayerRooms.length === 0 ? (
            <motion.div
              className="no-rooms"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p>Looking for players...</p>
              <p className="subtext">
                Waiting for other players to join or creating a new match
              </p>
            </motion.div>
          ) : (
            <div className="room-cards">
              {multiplayerRooms.map(([roomId, room]) => (
                <motion.div
                  key={roomId}
                  className="room-card matchmaking"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="room-header">
                    <span className="room-label">⚡ Quick Match</span>
                    <span className="player-count">
                      {room.players.length}
                      <span>/4</span>
                    </span>
                  </div>

                  <div className="room-players">
                    {room.players.map((player) => (
                      <motion.div
                        key={player.id}
                        className="player-badge"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                      >
                        <span className="avatar">👤</span>
                        <span className="name">{player.name}</span>
                      </motion.div>
                    ))}
                    {Array.from({ length: 4 - room.players.length }).map(
                      (_, idx) => (
                        <motion.div
                          key={`empty-${idx}`}
                          className="player-badge empty"
                          animate={{
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <span className="avatar">👤</span>
                          <span className="waiting">Waiting</span>
                        </motion.div>
                      )
                    )}
                  </div>

                  <motion.button
                    className="join-btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onJoinRoom(roomId)}
                    disabled={room.players.length >= 4}
                  >
                    {room.players.length >= 4 ? "Starting..." : "Join Match"}
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="info-box">
          <p>
            💡 <strong>How it works:</strong> Join a quick match with other online
            players. When 4 players are ready, the game starts automatically!
          </p>
        </div>
      </div>
    </motion.div>
  );
};
