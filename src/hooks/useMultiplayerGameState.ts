// src/hooks/useMultiplayerGameState.ts
import { useState, useEffect, useCallback } from "react";
import socket from "../services/socket";

export type Card = { suit: string; rank: string };
export type Seat = "North" | "East" | "South" | "West";
export type PlayerId = "north" | "east" | "south" | "west";

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

const makeEmptyPlayerRecord = <T,>(defaultValue: T): Record<PlayerId, T> => ({
  north: defaultValue,
  east: defaultValue,
  south: defaultValue,
  west: defaultValue,
});

interface TrickEntry {
  seat: string; // e.g. "North"
  card: Card;
}

export function useMultiplayerGameState(
  roomId: string | null,
  playerName: string
) {
  const [seat, setSeat] = useState<Seat | null>(null); // the uppercase seat from server
  const [yourPlayerId, setYourPlayerId] = useState<PlayerId>("south");
  const [seating, setSeating] = useState<Record<PlayerId, { name: string }>>({
    north: { name: "" },
    east: { name: "" },
    south: { name: "" },
    west: { name: "" },
  });
  const [hand, setHand] = useState<Card[]>([]);
  const [currentTurnSeat, setCurrentTurnSeat] = useState<PlayerId | null>(null);
  const [spadesBroken, setSpadesBroken] = useState(false);
  const [currentTrick, setCurrentTrick] = useState<Record<PlayerId, Card | null>>(
    makeEmptyPlayerRecord<Card | null>(null)
  );
  const [handsRemaining, setHandsRemaining] = useState<Record<PlayerId, number>>(
    {
      north: 13,
      east: 13,
      south: 13,
      west: 13,
    }
  );
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

  // Helper: convert array like [{seat:"North", card: {...}}...] to object map
  const normalizeTrickArray = (
    arr: TrickEntry[] | undefined
  ): Record<PlayerId, Card | null> => {
    const base = makeEmptyPlayerRecord<Card | null>(null);
    if (!Array.isArray(arr)) return base;
    arr.forEach((entry) => {
      const pid = seatToPlayerId(entry.seat);
      if (pid) {
        base[pid] = entry.card;
      }
    });
    return base;
  };

  useEffect(() => {
    socket.on("game_started", (payload: any) => {
      const upperSeat: Seat = payload.yourSeat;
      setSeat(upperSeat);
      const pid = seatToPlayerId(upperSeat) || "south";
      setYourPlayerId(pid);

      // seating: payload.seats has uppercase keys
      const seatingLower: Record<PlayerId, { name: string }> = {
        north: { name: "" },
        east: { name: "" },
        south: { name: "" },
        west: { name: "" },
      };
      if (payload.seats && typeof payload.seats === "object") {
        Object.entries(payload.seats).forEach(([seatName, info]: any) => {
          const pid2 = seatToPlayerId(seatName);
          if (pid2 && info && typeof info.name === "string") {
            seatingLower[pid2] = { name: info.name };
          }
        });
      }
      setSeating(seatingLower);

      setHand(payload.hand || []);
      setCurrentTurnSeat(
        payload.currentTurnSeat
          ? seatToPlayerId(payload.currentTurnSeat) || null
          : null
      );
      setSpadesBroken(!!payload.spadesBroken);

      // Convert bids/tricksWon from uppercase to lowercase
      if (payload.bids && typeof payload.bids === "object") {
        const bidLower: Record<PlayerId, number | null> = {
          north: null,
          east: null,
          south: null,
          west: null,
        };
        Object.entries(payload.bids).forEach(([seatName, v]: any) => {
          const pid2 = seatToPlayerId(seatName);
          if (pid2) {
            bidLower[pid2] = typeof v === "number" ? v : null;
          }
        });
        setBids(bidLower);
      }

      if (payload.tricksWon && typeof payload.tricksWon === "object") {
        const tricksLower: Record<PlayerId, number> = {
          north: 0,
          east: 0,
          south: 0,
          west: 0,
        };
        Object.entries(payload.tricksWon).forEach(([seatName, v]: any) => {
          const pid2 = seatToPlayerId(seatName);
          if (pid2) {
            tricksLower[pid2] = typeof v === "number" ? v : 0;
          }
        });
        setTricksWon(tricksLower);
      }

      setGameStarted(true);
      // reset current trick (none yet)
      setCurrentTrick(makeEmptyPlayerRecord<Card | null>(null));
    });

    socket.on("trick_update", (p: any) => {
      if (p.currentTrick) setCurrentTrick(normalizeTrickArray(p.currentTrick));
      if (p.currentTurnSeat) {
        setCurrentTurnSeat(seatToPlayerId(p.currentTurnSeat) || null);
      }
      if (p.handsRemaining) {
        const hr: Record<PlayerId, number> = {
          north: 13,
          east: 13,
          south: 13,
          west: 13,
        };
        Object.entries(p.handsRemaining).forEach(([seatName, v]: any) => {
          const pid2 = seatToPlayerId(seatName);
          if (pid2 && typeof v === "number") hr[pid2] = v;
        });
        setHandsRemaining(hr);
      }
      if (p.tricksWon) {
        const tricksLower: Record<PlayerId, number> = {
          north: 0,
          east: 0,
          south: 0,
          west: 0,
        };
        Object.entries(p.tricksWon).forEach(([seatName, v]: any) => {
          const pid2 = seatToPlayerId(seatName);
          if (pid2) {
            tricksLower[pid2] = typeof v === "number" ? v : 0;
          }
        });
        setTricksWon(tricksLower);
      }
      if (p.bids) {
        const bidLower: Record<PlayerId, number | null> = {
          north: null,
          east: null,
          south: null,
          west: null,
        };
        Object.entries(p.bids).forEach(([seatName, v]: any) => {
          const pid2 = seatToPlayerId(seatName);
          if (pid2) {
            bidLower[pid2] = typeof v === "number" ? v : null;
          }
        });
        setBids(bidLower);
      }
    });

    socket.on("trick_won", (p: any) => {
      setCurrentTrick(makeEmptyPlayerRecord<Card | null>(null)); // new trick starts empty
      if (p.currentTurnSeat) {
        setCurrentTurnSeat(seatToPlayerId(p.currentTurnSeat) || null);
      }
      if (p.handsRemaining) {
        const hr: Record<PlayerId, number> = {
          north: 13,
          east: 13,
          south: 13,
          west: 13,
        };
        Object.entries(p.handsRemaining).forEach(([seatName, v]: any) => {
          const pid2 = seatToPlayerId(seatName);
          if (pid2 && typeof v === "number") hr[pid2] = v;
        });
        setHandsRemaining(hr);
      }
      if (p.tricksWon) {
        const tricksLower: Record<PlayerId, number> = {
          north: 0,
          east: 0,
          south: 0,
          west: 0,
        };
        Object.entries(p.tricksWon).forEach(([seatName, v]: any) => {
          const pid2 = seatToPlayerId(seatName);
          if (pid2) {
            tricksLower[pid2] = typeof v === "number" ? v : 0;
          }
        });
        setTricksWon(tricksLower);
      }
      if (p.bids) {
        const bidLower: Record<PlayerId, number | null> = {
          north: null,
          east: null,
          south: null,
          west: null,
        };
        Object.entries(p.bids).forEach(([seatName, v]: any) => {
          const pid2 = seatToPlayerId(seatName);
          if (pid2) {
            bidLower[pid2] = typeof v === "number" ? v : null;
          }
        });
        setBids(bidLower);
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
      const bidLower: Record<PlayerId, number | null> = {
        north: null,
        east: null,
        south: null,
        west: null,
      };
      Object.entries(updatedBids).forEach(([seatName, v]: any) => {
        const pid2 = seatToPlayerId(seatName);
        if (pid2) {
          bidLower[pid2] = typeof v === "number" ? v : null;
        }
      });
      setBids(bidLower);
    });

    return () => {
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
      if (!yourPlayerId || !roomId) return;
      socket.emit("place_bid", { roomId, seat: yourPlayerId.charAt(0).toUpperCase() + yourPlayerId.slice(1), bid });
    },
    [yourPlayerId, roomId]
  );

  const playCard = useCallback(
    (card: Card) => {
      if (!yourPlayerId || !roomId) return;
      socket.emit("play_card", { roomId, card });
    },
    [yourPlayerId, roomId]
  );

  return {
    seat, // uppercase like "South"
    playerId: yourPlayerId, // lowercase for UI
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
