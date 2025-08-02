import React, { useState, useEffect } from "react";
import Lobby, { Room } from "./components/Lobby";
import socket from "./services/socket";
import GameBoard from "./components/GameBoard";

type Card = {
  suit: string;
  rank: string;
};

interface GameStartedPayload {
  roomId: string;
  yourSeat: string;
  seats: Record<string, { name: string }>;
  hand: Card[];
  currentTurnSeat: string;
  spadesBroken: boolean;
}

const App: React.FC = () => {
  const [rooms, setRooms] = useState<Record<string, Room>>({});
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [gameData, setGameData] = useState<{
    roomId: string;
    yourSeat: string;
    seats: Record<string, { name: string }>;
    hand: Card[];
    currentTurnSeat: string;
    spadesBroken: boolean;
  } | null>(null);
  const [startingSeat, setStartingSeat] = useState<string>("");

  useEffect(() => {
    socket.on("rooms_update", (updated: Record<string, Room>) => {
      setRooms(updated);
    });

    socket.on("room_update", (room: Room) => {
      setCurrentRoom(room);
    });

    socket.on("seating", (payload: any) => {
      // could use to show seating before personal game_started
      console.log("Seating info:", payload);
    });

    socket.on("game_started", (payload: GameStartedPayload) => {
      console.log("Game started payload:", payload);
      setGameData({
        roomId: payload.roomId,
        yourSeat: payload.yourSeat,
        seats: payload.seats,
        hand: payload.hand,
        currentTurnSeat: payload.currentTurnSeat,
        spadesBroken: payload.spadesBroken,
      });
      setStartingSeat(payload.currentTurnSeat);
    });

    return () => {
      socket.off("rooms_update");
      socket.off("room_update");
      socket.off("seating");
      socket.off("game_started");
    };
  }, []);

  const createRoom = () => {
    socket.emit("create_room");
  };

  const joinRoom = (roomId: string) => {
    socket.emit("join_room", roomId);
  };

  if (gameData) {
    return (
      <GameBoard
        roomId={gameData.roomId}
        yourSeat={gameData.yourSeat}
        seats={gameData.seats}
        initialHand={gameData.hand}
        startingSeat={startingSeat}
      />
    );
  }

  return (
    <div>
      <Lobby rooms={rooms} onCreateRoom={createRoom} onJoinRoom={joinRoom} />
    </div>
  );
};

export default App;
