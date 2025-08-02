import React, { useState, useEffect } from "react";
import socket, { setPlayerName } from "../services/socket";

export interface Room {
  players: { id: string; name: string }[];
  createdAt: number;
}

export interface LobbyProps {
  rooms: Record<string, Room>;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
}

const Lobby: React.FC<LobbyProps> = ({ rooms, onCreateRoom, onJoinRoom }) => {
  const [name, setName] = useState("Player");
  const [roomIdInput, setRoomIdInput] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const onError = (err: any) => {
      setStatus(err?.message || "Server error");
    };
    socket.on("error", onError);
    socket.on("room_full", (rid: string) => {
      setStatus(`Room ${rid} is full`);
    });
    return () => {
      socket.off("error", onError);
      socket.off("room_full");
    };
  }, []);

  const handleCreate = () => {
    if (!name.trim()) {
      setStatus("Enter a name first");
      return;
    }
    setPlayerName(name.trim());
    onCreateRoom();
    setStatus("Creating room...");
  };

  const handleJoin = () => {
    if (!name.trim() || !roomIdInput.trim()) {
      setStatus("Name and Room ID required");
      return;
    }
    setPlayerName(name.trim());
    onJoinRoom(roomIdInput.trim());
    setStatus(`Joining room ${roomIdInput.trim()}...`);
  };

  return (
    <div style={{ padding: 16, maxWidth: 700, margin: "0 auto" }}>
      <h2>Lobby</h2>

      <div style={{ marginBottom: 12 }}>
        <label>
          Your name:{" "}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Display name"
            style={{ padding: 6 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
        <button onClick={handleCreate} style={{ padding: "6px 14px" }}>
          Create Room
        </button>
        <div>
          <input
            placeholder="Room ID"
            value={roomIdInput}
            onChange={(e) => setRoomIdInput(e.target.value)}
            style={{ padding: 6 }}
          />
          <button onClick={handleJoin} style={{ marginLeft: 6, padding: "6px 14px" }}>
            Join Room
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <strong>Status:</strong> {status}
      </div>

      <div>
        <h4>Available Rooms</h4>
        {Object.keys(rooms).length === 0 && <div>No rooms yet</div>}
        {Object.entries(rooms).map(([id, room]) => (
          <div
            key={id}
            style={{
              border: "1px solid #ddd",
              padding: 10,
              borderRadius: 6,
              marginBottom: 8,
              background: "#fafafa",
            }}
          >
            <div>
              <strong>Room ID:</strong> {id}
            </div>
            <div>
              Players ({room.players.length}/4): {room.players.map((p) => p.name).join(", ")}
            </div>
            <div style={{ marginTop: 6 }}>
              <button
                onClick={() => {
                  setPlayerName(name.trim() || "Player");
                  onJoinRoom(id);
                  setStatus(`Joining room ${id}...`);
                }}
                disabled={room.players.length >= 4}
                style={{ padding: "4px 10px" }}
              >
                {room.players.length >= 4 ? "Full" : "Join"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Lobby;
export { Lobby };
