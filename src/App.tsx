// client/src/App.tsx
import React, { useState, useEffect } from "react";
import socket from "./socket";

import { NameInputPopup } from "./components/NameInputPopup";
import { Lobby } from "./components/Lobby";
import { GameState } from "./types/spades";

interface Player { id: string; name: string; }
interface Room  { id: string; players: Player[]; gameState: GameState | null; }
type Screen   = "enter_name" | "lobby" | "waiting_room" | "in_game";

const App: React.FC = () => {
  const [screen, setScreen]             = useState<Screen>("enter_name");
  const [playerName, setPlayerName]     = useState<string>("");
  const [rooms, setRooms]               = useState<Record<string,Room>>({});
  const [currentRoom, setCurrentRoom]   = useState<Room | null>(null);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Connected with id", socket.id);
    });
    socket.on("connect_error", err => {
      console.error("❌ Connection Error:", err.message);
    });

    socket.on("rooms_update", (updated: Record<string,Room>) => {
      setRooms(updated);
    });
    socket.on("joined_room", (room: Room) => {
      setCurrentRoom(room);
      setScreen("waiting_room");
    });
    socket.on("room_update", (room: Room) => {
      setCurrentRoom(room);
    });
    socket.on("start_game", ({ room }: { room: Room }) => {
      setCurrentRoom(room);
      setScreen("in_game");
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("rooms_update");
      socket.off("joined_room");
      socket.off("room_update");
      socket.off("start_game");
      socket.disconnect();
    };
  }, []);

  const handleNameSubmit = (name: string) => {
    setPlayerName(name);
    setScreen("lobby");
    socket.emit("join_lobby", name);
  };
  const handleCreateRoom = () => socket.emit("create_room");
  const handleJoinRoom   = (roomId: string) => socket.emit("join_room", roomId);

  switch (screen) {
    case "enter_name":
      return <NameInputPopup onNameSubmit={handleNameSubmit} />;
    case "lobby":
      return <Lobby rooms={rooms} onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
    case "waiting_room":
      if (!currentRoom) return <div>Loading room…</div>;
      return (
        <div className="fixed inset-0 bg-teal-800 flex items-center justify-center text-white text-2xl">
          <div className="bg-black bg-opacity-50 p-10 rounded-lg text-center shadow-lg">
            <h2 className="text-3xl font-bold mb-4">Room: {currentRoom.players[0]?.name}'s Game</h2>
            <p className="mb-6 animate-pulse">
              Waiting for players… ({currentRoom.players.length}/4)
            </p>
            <div className="space-y-2">
              {currentRoom.players.map(p => <p key={p.id}>✅ {p.name} has joined.</p>)}
            </div>
          </div>
        </div>
      );
    case "in_game":
      return (
        <div className="fixed inset-0 bg-teal-800 flex items-center justify-center text-white text-2xl">
          <h1 className="text-4xl font-bold">Game in Progress!</h1>
        </div>
      );
    default:
      return <NameInputPopup onNameSubmit={handleNameSubmit} />;
  }
};

export default App;
