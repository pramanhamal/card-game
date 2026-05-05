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
    const players = currentRoom!.players;
    const filledSeats = players.length;
    const slots: (Player | null)[] = [
      players[0] || null,
      players[1] || null,
      players[2] || null,
      players[3] || null,
    ];

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          gap: "2rem",
          background: "radial-gradient(ellipse at 50% 40%, #5a3a8a 0%, #3b1f6b 40%, #1e0f3d 100%)",
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center" }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "0.25rem" }}>♠</div>
          <h1 style={{ color: "white", fontSize: "1.8rem", fontWeight: 900, letterSpacing: "0.15em", margin: 0 }}>
            SPADES
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
            Waiting for players…
          </p>
        </motion.div>

        {/* 4 horizontal player slots */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.25rem",
          }}
        >
          {slots.map((player, idx) => {
            const isYou = player?.seat === yourSeat || player?.id === currentRoom!.players.find(p => p.seat === yourSeat)?.id;
            return (
              <motion.div
                key={idx}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                  width: 80,
                }}
              >
                <AnimatePresence mode="wait">
                  {player ? (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, scale: 0.5, y: 16 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20 }}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}
                    >
                      <div style={{
                        width: 68, height: 68, borderRadius: "50%",
                        background: isYou
                          ? "linear-gradient(135deg, #4a3000, #8a6000)"
                          : "linear-gradient(135deg, #2a2a4a, #1a1a3a)",
                        border: isYou ? "2px solid rgba(255,210,40,0.8)" : "2px solid rgba(255,255,255,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "1.6rem", fontWeight: 900, color: isYou ? "#ffd700" : "rgba(255,255,255,0.85)",
                        boxShadow: isYou ? "0 0 18px rgba(255,210,40,0.5)" : "0 2px 8px rgba(0,0,0,0.5)",
                      }}>
                        {player.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div style={{ color: isYou ? "#ffd700" : "white", fontWeight: 700, fontSize: "0.8rem", textAlign: "center", maxWidth: 76, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {player.name}
                      </div>
                      {isYou && (
                        <div style={{ background: "rgba(255,210,40,0.15)", color: "#ffd700", fontSize: "0.6rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999, border: "1px solid rgba(255,210,40,0.4)", letterSpacing: "0.1em" }}>
                          YOU
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`empty-${idx}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}
                    >
                      <motion.div
                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 1.8, repeat: Infinity, delay: idx * 0.3 }}
                        style={{
                          width: 68, height: 68, borderRadius: "50%",
                          background: "rgba(255,255,255,0.04)",
                          border: "2px dashed rgba(255,255,255,0.2)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "1.4rem", color: "rgba(255,255,255,0.25)",
                        }}
                      >
                        ?
                      </motion.div>
                      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem", fontWeight: 500 }}>
                        Waiting…
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Status */}
        <motion.div style={{ textAlign: "center" }}>
          {filledSeats === 4 ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ color: "#4ade80", fontWeight: 700, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }}>●</motion.span>
              All players in — starting game…
            </motion.div>
          ) : (
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.9rem", margin: 0 }}>
              {filledSeats} / 4 players joined
            </p>
          )}
        </motion.div>

        {/* Leave Button */}
        <motion.button
          className="leave-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onLeaveRoom}
        >
          ← Leave
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
