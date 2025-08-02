// src/hooks/useMultiplayerGameState.ts
import { useState, useEffect, useCallback } from "react";
import socket from "../services/socket";

export type Card = { suit: string; rank: string };
export type Seat = "North" | "East" | "South" | "West";

export interface GameState {
  seat: Seat | null;
  seating: Record<Seat, { name: string }>;
  hand: Card[];
  currentTurnSeat: Seat | null;
  spadesBroken: boolean;
  currentTrick: { seat: Seat; card: Card }[];
  handsRemaining: Record<Seat, number>;
  tricksWon: Record<Seat, number>;
  bids: Record<Seat, number | null>;
  gameStarted: boolean;
}

export function useMultiplayerGameState(roomId: string | null, playerName: string) {
  const [seat, setSeat] = useState<Seat | null>(null);
  const [seating, setSeating] = useState<Record<Seat, { name: string }>>({
    North: { name: "" },
    East: { name: "" },
    South: { name: "" },
    West: { name: "" },
  });
  const [hand, setHand] = useState<Card[]>([]);
  const [currentTurnSeat, setCurrentTurnSeat] = useState<Seat | null>(null);
  const [spadesBroken, setSpadesBroken] = useState(false);
  const [currentTrick, setCurrentTrick] = useState<{ seat: Seat; card: Card }[]>([]);
  const [handsRemaining, setHandsRemaining] = useState<Record<Seat, number>>({
    North: 13,
    East: 13,
    South: 13,
    West: 13,
  });
  const [tricksWon, setTricksWon] = useState<Record<Seat, number>>({
    North: 0,
    East: 0,
    South: 0,
    West: 0,
  });
  const [bids, setBids] = useState<Record<Seat, number | null>>({
    North: null,
    East: null,
    South: null,
    West: null,
  });
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    socket.on("game_started", (payload: any) => {
      setSeat(payload.yourSeat);
      setSeating(payload.seats || { North: { name: "" }, East: { name: "" }, South: { name: "" }, West: { name: "" } });
      setHand(payload.hand || []);
      setCurrentTurnSeat(payload.currentTurnSeat || null);
      setSpadesBroken(!!payload.spadesBroken);
      setTricksWon(payload.tricksWon || { North: 0, East: 0, South: 0, West: 0 });
      setBids(payload.bids || { North: null, East: null, South: null, West: null });
      setGameStarted(true);
    });

    socket.on("trick_update", (p: any) => {
      if (p.currentTrick) setCurrentTrick(p.currentTrick);
      if (p.currentTurnSeat) setCurrentTurnSeat(p.currentTurnSeat);
      if (p.handsRemaining) setHandsRemaining(p.handsRemaining);
      if (p.tricksWon) setTricksWon(p.tricksWon);
      if (p.bids) setBids(p.bids);
    });

    socket.on("trick_won", (p: any) => {
      setCurrentTrick([]);
      if (p.currentTurnSeat) setCurrentTurnSeat(p.currentTurnSeat);
      if (p.handsRemaining) setHandsRemaining(p.handsRemaining);
      if (p.tricksWon) setTricksWon(p.tricksWon);
      if (p.bids) setBids(p.bids);
    });

    socket.on("hand_update", (p: any) => {
      if (p.hand) setHand(p.hand);
    });

    socket.on("your_turn", (p: any) => {
      if (p.seat) setCurrentTurnSeat(p.seat);
    });

    socket.on("spades_broken", (b: boolean) => {
      setSpadesBroken(b);
    });

    socket.on("bids_update", (updatedBids: Record<string, number>) => {
      setBids({
        North: updatedBids.North ?? null,
        East: updatedBids.East ?? null,
        South: updatedBids.South ?? null,
        West: updatedBids.West ?? null,
      });
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
  }, []);

  const createRoom = useCallback(() => {
    socket.emit("create_room");
  }, []);

  const joinRoom = useCallback((rid: string) => {
    socket.emit("join_room", rid);
  }, []);

  const placeBid = useCallback(
    (bid: number) => {
      if (!seat || !roomId) return;
      socket.emit("place_bid", { roomId, seat, bid });
    },
    [seat, roomId]
  );

  const playCard = useCallback(
    (card: Card) => {
      if (!seat || !roomId) return;
      socket.emit("play_card", { roomId, card });
    },
    [seat, roomId]
  );

  return {
    seat,
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
