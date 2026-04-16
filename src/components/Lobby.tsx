import React, { useState } from "react";
import { motion } from "framer-motion";

export interface Player {
  id: string;
  name: string;
  seat?: string;
  isAI?: boolean;
}

export interface Room {
  id: string;
  players: Player[];
  started?: boolean;
}

interface Props {
  rooms: Record<string, Room>;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
}

export const Lobby: React.FC<Props> = ({ rooms, onCreateRoom, onJoinRoom }) => {
  const [joinId, setJoinId] = useState("");

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{
        background:
          "radial-gradient(ellipse at 50% 40%, #1e7a42 0%, #0d4222 50%, #060f08 100%)",
      }}
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="text-5xl mb-2">♠</div>
        <h1 className="text-4xl font-black text-white tracking-widest">SPADES</h1>
        <p className="text-gray-500 text-sm mt-1 tracking-wider">
          Find or create a room
        </p>
      </motion.div>

      <div className="w-full max-w-lg">
        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl p-5 mb-4"
          style={{
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div className="flex gap-3">
            <input
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && joinId.trim() && onJoinRoom(joinId.trim())
              }
              placeholder="Room ID…"
              className="flex-1 px-3 py-2.5 rounded-xl text-white placeholder-gray-600 text-sm outline-none focus:ring-2 focus:ring-green-500"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => joinId.trim() && onJoinRoom(joinId.trim())}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{
                background: "linear-gradient(90deg, #4f46e5, #3730a3)",
                boxShadow: "0 4px 14px rgba(79,70,229,0.4)",
              }}
            >
              Join
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={onCreateRoom}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{
                background: "linear-gradient(90deg, #16a34a, #15803d)",
                boxShadow: "0 4px 14px rgba(22,163,74,0.4)",
              }}
            >
              + New Room
            </motion.button>
          </div>
        </motion.div>

        {/* Room list */}
        <div className="space-y-2">
          {Object.entries(rooms).length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center text-gray-500 py-12 text-sm"
            >
              No rooms yet — create one to start!
            </motion.div>
          ) : (
            Object.entries(rooms).map(([id, room], idx) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.05 }}
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{
                  background: "rgba(0,0,0,0.38)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-mono font-bold text-sm">
                      {id}
                    </span>
                    {room.started && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{
                          background: "rgba(239,68,68,0.2)",
                          color: "#f87171",
                          border: "1px solid rgba(239,68,68,0.3)",
                        }}
                      >
                        In Progress
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {room.players.map((p) => (
                      <span
                        key={p.id}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: "rgba(255,255,255,0.08)",
                          color: "rgba(255,255,255,0.7)",
                        }}
                      >
                        {p.name || "?"}
                      </span>
                    ))}
                    {Array.from({ length: 4 - room.players.length }).map(
                      (_, i) => (
                        <span
                          key={`empty-${i}`}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            color: "rgba(255,255,255,0.25)",
                            border: "1px dashed rgba(255,255,255,0.1)",
                          }}
                        >
                          Empty
                        </span>
                      )
                    )}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onJoinRoom(id)}
                  disabled={room.started || room.players.length >= 4}
                  className="ml-3 px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-35"
                  style={{
                    background:
                      room.started || room.players.length >= 4
                        ? "rgba(255,255,255,0.08)"
                        : "linear-gradient(90deg, #16a34a, #15803d)",
                    color: "white",
                  }}
                >
                  {room.players.length >= 4 ? "Full" : "Join"}
                </motion.button>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
