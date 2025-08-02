// src/hooks/useMultiplayerGameState.ts
import { useState, useEffect, useCallback } from "react";
import socket from "../services/socket";
import { PlayerId, Card } from "../types/spades";

export interface RoomsMap {
  [roomId: string]: {
    players: { id: string; name: string }[];
    createdAt: number;
    started?: boolean;
    [k: string]: any;
  };
}

export interface SeatInfo {
  name: string;
}

// Uppercase seat names coming from server
type UpperSeat = "North" | "East" | "South" | "West";
type UpperSeatKey = UpperSeat;

/**
 * Normalize a server object with uppercase seat keys into lowercase PlayerId keys.
 * Example: { North: 1, East: 2 } -> { north: 1, east: 2, south: defaultVal, west: defaultVal }
 */
function normalizeSeatObject<T>(
  obj: Partial<Record<UpperSeatKey, T>> | undefined,
  defaultVal: T
): Record<PlayerId, T> {
  return {
    north: obj?.North ?? defaultVal,
    east: obj?.East ?? defaultVal,
    south: obj?.South ?? defaultVal,
    west: obj?.West ?? defaultVal,
  };
}

const defaultSeating: Record<PlayerId, SeatInfo> = {
  north: { name: "" },
  east: { name: "" },
  south: { name: "" },
  west: { name: "" },
};

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

const uppercaseSeatify = (pid: PlayerId): string =>
  pid.charAt(0).toUpperCase() + pid.slice(1); // e.g., "south" -> "South"

export function useMultiplayerGameState(
  roomId: string | null,
  playerName: string
) {
  const [rooms, setRooms] = useState<RoomsMap>({});
  const [joinedRoom, setJoinedRoom] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<PlayerId>("south"); // canonical lowercase seat
  const [seat, setSeat] = useState<UpperSeat | null>(null); // raw from server like "South"

  const [seating, setSeating] = useState<Record<PlayerId, SeatInfo>>(defaultSeating);
  const [hand, setHand] = useState<Card[]>([]);
  const [currentTurnSeat, setCurrentTurnSeat] = useState<PlayerId | null>(null);
  const [spadesBroken, setSpadesBroken] = useState(false);
  const [currentTrick, setCurrentTrick] = useState<Record<PlayerId, Card | null>>({
    north: null,
    east: null,
    south: null,
    west: null,
  });
  const [handsRemaining, setHandsRemaining] = useState<Record<PlayerId, number>>({
    north: 13,
    east: 13,
    south: 13,
    west: 13,
  });
  const [tricksWon, setTricksWon] = useState<Record<PlayerId, number>>({
    north: 0,
    east: 0,
    south: 0,
    west: 0,
  });
  const [bids, setBids] = useState<Record<PlayerId, number | null>>({
    north: null,
    east: null,
    south: null,
    west: null,
  });
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

    socket.on("game_started", (payload: any) => {
      // Your assigned seat (e.g., "South")
      const upperSeat: string = payload.yourSeat;
      setSeat(upperSeat as UpperSeat);
      const pid = seatToPlayerId(upperSeat) || "south";
      setPlayerId(pid);

      // Seating (names)
      const normalizedSeating = normalizeSeatObject<SeatInfo>(payload.seats, { name: "" });
      setSeating(normalizedSeating);

      // Your hand
      setHand(payload.hand || []);

      // Turn
      if (payload.currentTurnSeat) {
        const turnPid = seatToPlayerId(payload.currentTurnSeat);
        if (turnPid) setCurrentTurnSeat(turnPid);
      }

      setSpadesBroken(!!payload.spadesBroken);

      if (payload.trick) {
        setCurrentTrick(normalizeSeatObject<Card | null>(payload.trick, null));
      }

      if (payload.handsRemaining) {
        setHandsRemaining(normalizeSeatObject<number>(payload.handsRemaining, 13));
      }

      if (payload.tricksWon) {
        setTricksWon(normalizeSeatObject<number>(payload.tricksWon, 0));
      }

      if (payload.bids) {
        setBids(normalizeSeatObject<number | null>(payload.bids, null));
      }

      setGameStarted(true);
    });

    socket.on("trick_update", (p: any) => {
      if (p.currentTrick) {
        setCurrentTrick(normalizeSeatObject<Card | null>(p.currentTrick, null));
      }
      if (p.currentTurnSeat) {
        const turnPid = seatToPlayerId(p.currentTurnSeat);
        if (turnPid) setCurrentTurnSeat(turnPid);
      }
      if (p.handsRemaining) {
        setHandsRemaining(normalizeSeatObject<number>(p.handsRemaining, 13));
      }
      if (p.tricksWon) {
        setTricksWon(normalizeSeatObject<number>(p.tricksWon, 0));
      }
      if (p.bids) {
        setBids(normalizeSeatObject<number | null>(p.bids, null));
      }
    });

    socket.on("trick_won", (p: any) => {
      setCurrentTrick({ north: null, east: null, south: null, west: null });
      if (p.currentTurnSeat) {
        const turnPid = seatToPlayerId(p.currentTurnSeat);
        if (turnPid) setCurrentTurnSeat(turnPid);
      }
      if (p.handsRemaining) {
        setHandsRemaining(normalizeSeatObject<number>(p.handsRemaining, 13));
      }
      if (p.tricksWon) {
        setTricksWon(normalizeSeatObject<number>(p.tricksWon, 0));
      }
      if (p.bids) {
        setBids(normalizeSeatObject<number | null>(p.bids, null));
      }
    });

    socket.on("hand_update", (p: any) => {
      if (p.hand) setHand(p.hand);
    });

    socket.on("your_turn", (p: any) => {
      if (p.seat) {
        const pid2 = seatToPlayerId(p.seat);
        if (pid2) setCurrentTurnSeat(pid2);
      }
    });

    socket.on("spades_broken", (broken: boolean) => {
      setSpadesBroken(broken);
    });

    socket.on("bids_update", (updatedBids: Record<string, number>) => {
      setBids(normalizeSeatObject<number | null>(updatedBids, null));
    });

    return () => {
      socket.off("rooms_update");
      socket.off("room_created");
      socket.off("joined_room");
      socket.off("game_started");
      socket.off("trick_update");
      socket.off("trick_won");
      socket.off("hand_update");
      socket.off("your_turn");
      socket.off("spades_broken");
      socket.off("bids_update");
    };
  }, [roomId]);

  const createRoom = useCallback(() => {
    socket.emit("create_room");
  }, []);

  const joinRoom = useCallback((rid: string) => {
    socket.emit("join_room", rid);
  }, []);

  const placeBid = useCallback(
    (bid: number) => {
      if (!playerId || !joinedRoom) return;
      socket.emit("place_bid", {
        roomId: joinedRoom,
        seat: uppercaseSeatify(playerId),
        bid,
      });
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

  // Sync player name
  useEffect(() => {
    socket.emit("set_player_name", playerName);
  }, [playerName]);

  return {
    rooms,
    joinedRoom,
    setJoinedRoom,
    playerId,
    seat, // uppercase if needed
    seating,
    hand,
    currentTurnSeat,
    spadesBroken,
    currentTrick,
    handsRemaining,
    tricksWon,
    bids,
    gameStarted,
    createRoom,
    joinRoom,
    placeBid,
    playCard,
  };
}
