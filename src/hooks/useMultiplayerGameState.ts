// src/hooks/useMultiplayerGameState.ts
import { useState, useEffect, useCallback } from "react";
import socket from "../services/socket";

export type Card = { suit: string; rank: string };
export type Seat = "North" | "East" | "South" | "West";
export type PlayerId = "north" | "east" | "south" | "west";

// Helper to convert "North" -> "north" etc.
const seatToPlayerId = (s: string): PlayerId | null => {
  switch (s.toLowerCase()) {
    case "north":
      return "north";
    case "east":
      return "east";
    case "south":
      return "south";
    case "west":
      return "west";
    default:
      return null;
  }
};

export interface RoomsMap {
  [roomId: string]: {
    players: { id: string; name: string }[];
    createdAt: number;
    started?: boolean;
    [k: string]: any;
  };
}

export function useMultiplayerGameState(roomId: string | null, playerName: string) {
  const [rooms, setRooms] = useState<RoomsMap>({});
  const [joinedRoom, setJoinedRoom] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<PlayerId>("south"); // lowercase for UI

  // Simplified placeholders; you can integrate the deeper game state from previous version
  const [hand, setHand] = useState<Card[]>([]);
  const [bids, setBids] = useState<Record<PlayerId, number | null>>({
    north: null,
    east: null,
    south: null,
    west: null,
  });
  const [tricksWon, setTricksWon] = useState<Record<PlayerId, number>>({
    north: 0,
    east: 0,
    south: 0,
    west: 0,
  });
  const [currentTurnSeat, setCurrentTurnSeat] = useState<PlayerId | null>(null);
  const [currentTrick, setCurrentTrick] = useState<any>(null);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    socket.on("rooms_update", (updated: RoomsMap) => {
      setRooms(updated);
    });

    socket.on("room_created", ({ roomId: rid }: { roomId: string }) => {
      setJoinedRoom(rid);
    });

    socket.on("joined_room", ({ roomId: rid }: { roomId: string }) => {
      setJoinedRoom(rid);
    });

    // You can also listen for deeper game events here to populate hand/bids etc.

    return () => {
      socket.off("rooms_update");
      socket.off("room_created");
      socket.off("joined_room");
    };
  }, []);

  useEffect(() => {
    socket.emit("set_player_name", playerName);
  }, [playerName]);

  const createRoom = useCallback(() => {
    socket.emit("create_room");
  }, []);

  const joinRoom = useCallback((rid: string) => {
    socket.emit("join_room", rid);
  }, []);

  const placeBid = useCallback(
    (bid: number) => {
      if (!playerId || !joinedRoom) return;
      const seatName = playerId.charAt(0).toUpperCase() + playerId.slice(1); // "south"->"South"
      socket.emit("place_bid", { roomId: joinedRoom, seat: seatName, bid });
    },
    [playerId, joinedRoom]
  );

  const playCard = useCallback(
    (card: Card) => {
      if (!joinedRoom) return;
      socket.emit("play_card", { roomId: joinedRoom, card });
    },
    [joinedRoom]
  );

  return {
    // basic state
    rooms,
    joinedRoom,
    setJoinedRoom, // exposed so App can manually override if needed
    playerId,
    hand,
    bids,
    tricksWon,
    currentTurnSeat,
    currentTrick,
    gameStarted,
    // actions
    createRoom,
    joinRoom,
    placeBid,
    playCard,
  };
}
