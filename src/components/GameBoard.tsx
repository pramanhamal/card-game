// src/components/GameBoard.tsx
import React, { useState, useEffect } from "react";
import socket from "../services/socket";

type Card = {
  suit: string;
  rank: string;
};

export interface SeatInfo {
  name: string;
}

export interface GameBoardProps {
  roomId: string;
  yourSeat: string; // e.g., "South"
  seats: Record<string, SeatInfo>; // { North: {name}, ... }
  initialHand: Card[];
  startingSeat: string;
}

const seatClockwise = ["North", "East", "South", "West"];

function computeRelative(yourSeat: string) {
  const idx = seatClockwise.indexOf(yourSeat);
  return {
    self: yourSeat,
    left: seatClockwise[(idx + 3) % 4], // counter-clockwise
    right: seatClockwise[(idx + 1) % 4], // clockwise
    opposite: seatClockwise[(idx + 2) % 4],
  };
}

const GameBoard: React.FC<GameBoardProps> = ({
  roomId,
  yourSeat,
  seats,
  initialHand,
  startingSeat,
}) => {
  const [hand, setHand] = useState<Card[]>(initialHand);
  const [currentTrick, setCurrentTrick] = useState<
    { seat: string; card: Card }[]
  >([]);
  const [currentTurnSeat, setCurrentTurnSeat] = useState<string>(startingSeat);
  const [spadesBroken, setSpadesBroken] = useState<boolean>(false);
  const [handsRemaining, setHandsRemaining] = useState<Record<string, number>>({
    North: 13,
    East: 13,
    South: 13,
    West: 13,
  });
  const [lastTrickWinner, setLastTrickWinner] = useState<string | null>(null);

  useEffect(() => {
    socket.on("trick_update", (payload: any) => {
      setCurrentTrick(payload.currentTrick);
      setCurrentTurnSeat(payload.currentTurnSeat);
      setHandsRemaining(payload.handsRemaining);
    });
    socket.on("trick_won", (payload: any) => {
      setLastTrickWinner(payload.winnerSeat);
      setCurrentTrick([]);
      setCurrentTurnSeat(payload.currentTurnSeat);
      setHandsRemaining(payload.handsRemaining);
    });
    socket.on("spades_broken", (b: boolean) => {
      setSpadesBroken(b);
    });
    socket.on("hand_update", (payload: any) => {
      setHand(payload.hand);
    });
    socket.on("your_turn", (payload: any) => {
      setCurrentTurnSeat(payload.seat);
    });

    return () => {
      socket.off("trick_update");
      socket.off("trick_won");
      socket.off("spades_broken");
      socket.off("hand_update");
      socket.off("your_turn");
    };
  }, []);

  const relative = computeRelative(yourSeat);
  const isYourTurn = currentTurnSeat === yourSeat;

  const handlePlay = (card: Card) => {
    if (!isYourTurn) return;
    socket.emit("play_card", { roomId, card });
  };

  const renderCard = (card: Card, clickable = false) => {
    return (
      <div
        style={{
          border: "1px solid #444",
          borderRadius: 4,
          padding: 6,
          margin: 4,
          minWidth: 50,
          textAlign: "center",
          cursor: clickable ? "pointer" : "default",
          opacity: clickable ? 1 : 0.8,
          background: "#fff",
        }}
        onClick={() => {
          if (clickable) handlePlay(card);
        }}
      >
        <div>{card.rank}</div>
        <div style={{ fontSize: 12 }}>{card.suit[0].toUpperCase()}</div>
      </div>
    );
  };

  return (
    <div style={{ padding: 16 }}>
      <h3>Spades Game</h3>
      <div style={{ marginBottom: 8 }}>
        You are: <strong>{seats[yourSeat].name}</strong> ({yourSeat})
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {/* Opposite */}
        <div style={{ textAlign: "center" }}>
          <div>{seats[relative.opposite]?.name}</div>
          <div>{relative.opposite}</div>
          <div>Cards: {handsRemaining[relative.opposite]}</div>
        </div>

        <div style={{ flexGrow: 1, textAlign: "center" }}>
          {/* Current trick */}
          <div style={{ marginBottom: 12 }}>
            <div>
              <strong>Current Turn:</strong> {currentTurnSeat} (
              {seats[currentTurnSeat]?.name})
            </div>
            {lastTrickWinner && (
              <div>
                <em>Last trick won by {lastTrickWinner} ({seats[lastTrickWinner]?.name})</em>
              </div>
            )}
            <div style={{ marginTop: 8, display: "flex", justifyContent: "center" }}>
              {currentTrick.map((p, i) => (
                <div
                  key={i}
                  style={{
                    margin: 6,
                    padding: 6,
                    border: "1px solid #888",
                    borderRadius: 4,
                    minWidth: 80,
                  }}
                >
                  <div style={{ fontSize: 12 }}>{p.seat}</div>
                  <div>{p.card.rank} of {p.card.suit}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div>
              Spades broken: {spadesBroken ? "Yes" : "No"}
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ textAlign: "center" }}>
          <div>{seats[relative.right]?.name}</div>
          <div>{relative.right}</div>
          <div>Cards: {handsRemaining[relative.right]}</div>
        </div>
      </div>

      {/* Your hand (bottom) */}
      <div style={{ marginTop: 20 }}>
        <div>
          <strong>Your Hand</strong>{" "}
          {isYourTurn && <span style={{ color: "green" }}>(Your Turn)</span>}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {hand.map((c, idx) => (
            <div key={idx}>{renderCard(c, isYourTurn)}</div>
          ))}
        </div>
      </div>

      {/* Left */}
      <div style={{ marginTop: 20, display: "flex", gap: 40 }}>
        <div style={{ textAlign: "center" }}>
          <div>{seats[relative.left]?.name}</div>
          <div>{relative.left}</div>
          <div>Cards: {handsRemaining[relative.left]}</div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
