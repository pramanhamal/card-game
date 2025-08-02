import React, { useState, useEffect } from "react";
import Lobby, { Room } from "./components/Lobby"; // or: import { Lobby, Room } from ...
import socket from "./services/socket"; // path adjust if needed

const App: React.FC = () => {
  const [rooms, setRooms] = useState<Record<string, Room>>({});
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);

  useEffect(() => {
    socket.on("rooms_update", (updated: Record<string, Room>) => {
      setRooms(updated);
    });

    socket.on("room_update", (room: Room) => {
      setCurrentRoom(room);
    });

    socket.on("start_game", (payload) => {
      console.log("Game starting:", payload);
    });

    return () => {
      socket.off("rooms_update");
      socket.off("room_update");
      socket.off("start_game");
    };
  }, []);

  const createRoom = () => {
    socket.emit("create_room");
  };

  const joinRoom = (roomId: string) => {
    socket.emit("join_room", roomId);
  };

  return (
    <div>
      <Lobby rooms={rooms} onCreateRoom={createRoom} onJoinRoom={joinRoom} />
    </div>
  );
};

export default App;
