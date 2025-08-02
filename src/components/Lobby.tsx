import React, { useState, useEffect } from "react";
import socket, { setPlayerName } from "../services/socket"; // adjust path if your alias is different

export type Room = {
  players: { id: string; name: string }[];
  createdAt: number;
};

export const Lobby: React.FC = () => {
  const [name, setName] = useState("Player");
  const [roomIdInput, setRoomIdInput] = useState("");
  const [rooms, setRooms] = useState<Record<string, Room>>({});
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    socket.on("rooms_update", (updatedRooms: Record<string, Room>) => {
      setRooms(updatedRooms);
    });

    socket.on("room_update", (room: Room) => {
      setCurrentRoom(room);
    });

    socket.on("start_game", (payload: any) => {
      setStatus("Game is starting!");
      console.log("start_game:", payload);
    });

    socket.on("room_full", (rid: string) => {
      setStatus(`Room ${rid} is full`);
    });

    socket.on("error", (err: any) => {
      setStatus(err?.message || "Server error");
    });

    return () => {
      socket.off("rooms_update");
      socket.off("room_update");
      socket.off("start_game");
      socket.off("room_full");
      socket.off("error");
    };
  }, []);

  const handleCreate = () => {
    if (!name.trim()) {
      setStatus("Enter a name first");
      return;
    }
    setPlayerName(name.trim());
    socket.emit("create_room");
    setStatus("Creating room...");
  };

  const handleJoin = () => {
    if (!name.trim() || !roomIdInput.trim()) {
      setStatus("Name and Room ID required");
      return;
    }
    setPlayerName(name.trim());
    socket.emit("join_room", roomIdInput.trim());
    setStatus(`Joining room ${roomIdInput.trim()}...`);
  };

  return (
    <div style={{ padding: 16, maxWidth: 600, margin: "0 auto" }}>
      <h2>Lobby</h2>

      <div style={{ marginBottom: 12 }}>
        <label>
          Your name:{" "}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Display name"
            style={{ padding: 4 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 12 }}>
        <button onClick={handleCreate} style={{ marginRight: 8, padding: "6px 12px" }}>
          Create Room
        </button>
        <input
          placeholder="Room ID"
          value={roomIdInput}
          onChange={(e) => setRoomIdInput(e.target.value)}
          style={{ padding: 4, marginRight: 8 }}
        />
        <button onClick={handleJoin} style={{ padding: "6px 12px" }}>
          Join Room
        </button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <strong>Status:</strong> {status}
      </div>

      <div style={{ marginBottom: 16 }}>
        <h4>Available Rooms</h4>
        {Object.keys(rooms).length === 0 && <div>No rooms yet</div>}
        {Object.entries(rooms).map(([id, room]) => (
          <div
            key={id}
            style={{
              border: "1px solid #ccc",
              padding: 8,
              marginBottom: 8,
              borderRadius: 6,
              background: currentRoom && room === currentRoom ? "#eef" : "#fff",
            }}
          >
            <div>
              <strong>Room ID:</strong> {id}
            </div>
            <div>
              Players ({room.players.length}/4):{" "}
              {room.players.map((p) => p.name).join(", ")}
            </div>
            <div>
              <button
                onClick={() => {
                  setPlayerName(name.trim() || "Player");
                  socket.emit("join_room", id);
                  setStatus(`Joining room ${id}...`);
                }}
                disabled={room.players.length >= 4}
              >
                {room.players.length >= 4 ? "Full" : "Join"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {currentRoom && (
        <div style={{ borderTop: "1px solid #ddd", paddingTop: 12 }}>
          <h4>Current Room</h4>
          <div>
            Players ({currentRoom.players.length}/4):
            <ul>
              {currentRoom.players.map((p) => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lobby;
