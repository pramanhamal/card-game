import React, { useState, useEffect } from "react";
import Lobby, { Room } from "./components/Lobby";
import socket from "./services/socket";

const App: React.FC = () => {
  const [rooms, setRooms] = useState<Record<string, Room>>({});
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [startPayload, setStartPayload] = useState<any>(null);

  useEffect(() => {
    socket.on("rooms_update", (updated: Record<string, Room>) => {
      setRooms(updated);
    });

    socket.on("room_update", (room: Room) => {
      setCurrentRoom(room);
    });

    socket.on("start_game", (payload) => {
      console.log("Game starting payload:", payload);
      setCurrentRoom(payload.room);
      setGameStarted(true);
      setStartPayload(payload);
      // TODO: transition to actual game UI / initialize game state here
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

  if (gameStarted && currentRoom) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Game Started!</h2>
        <div>
          Room players:{" "}
          {currentRoom.players.map((p) => (
            <span key={p.id}>{p.name} </span>
          ))}
        </div>
        <div>{startPayload?.message}</div>
        {/* Replace with actual game component */}
      </div>
    );
  }

  return (
    <div>
      <Lobby rooms={rooms} onCreateRoom={createRoom} onJoinRoom={joinRoom} />
    </div>
  );
};

export default App;
