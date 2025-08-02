import React, { useState, useEffect, useMemo } from 'react';
import { io, Socket } from "socket.io-client";

// --- Import Your Components ---
import { Table } from './components/Table';
import { NameInputPopup } from './components/NameInputPopup';
import { Lobby } from './components/Lobby';
import { GameOverPopup } from './components/GameOverPopup';

// --- Import Your Game Types ---
import { GameState, PlayerId, Card } from './types/spades';

// --- SERVER URL ---
const SERVER_URL = "https://callbreak-server.onrender.com"; // adjust if needed

// --- Helper Types ---
interface Player {
  id: string;
  name: string;
}
interface RoomFromServer {
  players: Player[];
  createdAt?: number;
  started?: boolean;
}
interface Room {
  id: string;
  players: Player[];
}

// Seat rotation logic so viewerSeat becomes "south"
const SEAT_ORDER: PlayerId[] = ["north", "east", "south", "west"];

function mapSeatForView(serverSeat: PlayerId, viewerSeat: PlayerId): PlayerId {
  const viewerIndex = SEAT_ORDER.indexOf(viewerSeat);
  const targetIndex = SEAT_ORDER.indexOf("south");
  const rotation = (targetIndex - viewerIndex + 4) % 4;
  const serverIndex = SEAT_ORDER.indexOf(serverSeat);
  return SEAT_ORDER[(serverIndex + rotation) % 4];
}

function remapHands(
  canonical: Record<PlayerId, Card[]>,
  viewerSeat: PlayerId
): Record<PlayerId, Card[]> {
  const local: Record<PlayerId, Card[]> = {
    north: [],
    east: [],
    south: [],
    west: [],
  };
  SEAT_ORDER.forEach((serverSeat) => {
    const localSeat = mapSeatForView(serverSeat, viewerSeat);
    local[localSeat] = canonical[serverSeat];
  });
  return local;
}

function remapTrick(
  trick: Record<PlayerId, Card | null>,
  viewerSeat: PlayerId
): Record<PlayerId, Card | null> {
  const local: Record<PlayerId, Card | null> = {
    north: null,
    east: null,
    south: null,
    west: null,
  };
  SEAT_ORDER.forEach((serverSeat) => {
    const localSeat = mapSeatForView(serverSeat, viewerSeat);
    local[localSeat] = trick[serverSeat];
  });
  return local;
}

function remapAggregates<T>(
  aggregate: Record<PlayerId, T>,
  viewerSeat: PlayerId
): Record<PlayerId, T> {
  const local: Record<PlayerId, T> = {
    north: aggregate.north,
    east: aggregate.east,
    south: aggregate.south,
    west: aggregate.west,
  } as any;
  SEAT_ORDER.forEach((serverSeat) => {
    const localSeat = mapSeatForView(serverSeat, viewerSeat);
    local[localSeat] = aggregate[serverSeat];
  });
  return local;
}

function remapTurn(
  canonicalTurn: PlayerId | null,
  viewerSeat: PlayerId
): PlayerId | null {
  if (!canonicalTurn) return null;
  return mapSeatForView(canonicalTurn, viewerSeat);
}

function seatToPlayerId(seat: string): PlayerId | null {
  switch (seat.toLowerCase()) {
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
}

// placeholder opponent hand of N unseen cards
function makePlaceholderHand(count: number): Card[] {
  const placeholder: Card = { suit: "clubs", rank: 2 as any };
  return Array.from({ length: count }, () => ({ ...placeholder }));
}

const App: React.FC = () => {
  // --- State ---
  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerName, setPlayerName] = useState<string>('');
  const [rooms, setRooms] = useState<Record<string, RoomFromServer>>({});
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [showGameStartPopup, setShowGameStartPopup] = useState(false);

  // Canonical (server) game state
  const [viewerSeat, setViewerSeat] = useState<PlayerId | null>(null);
  const [canonicalHands, setCanonicalHands] = useState<Record<PlayerId, Card[]>>({
    north: makePlaceholderHand(13),
    east: makePlaceholderHand(13),
    south: makePlaceholderHand(13),
    west: makePlaceholderHand(13),
  });
  const [canonicalTrick, setCanonicalTrick] = useState<Record<PlayerId, Card | null>>({
    north: null,
    east: null,
    south: null,
    west: null,
  });
  const [canonicalTurn, setCanonicalTurn] = useState<PlayerId | null>(null);
  const [canonicalTricksWon, setCanonicalTricksWon] = useState<Record<PlayerId, number>>({
    north: 0,
    east: 0,
    south: 0,
    west: 0,
  });
  const [canonicalBids, setCanonicalBids] = useState<Record<PlayerId, number | null>>({
    north: null,
    east: null,
    south: null,
    west: null,
  });
  const [seating, setSeating] = useState<Record<PlayerId, string>>({
    north: "North",
    east: "East",
    south: "You",
    west: "West",
  });

  // --- Socket setup ---
  useEffect(() => {
    const sock = io(SERVER_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      path: "/socket.io",
    });
    setSocket(sock);

    sock.on("rooms_update", (updated: Record<string, RoomFromServer>) => {
      setRooms(updated);
    });

    sock.on("room_created", ({ roomId, room }: any) => {
      setCurrentRoom({ id: roomId, players: room.players });
    });

    sock.on("joined_room", ({ roomId, room }: any) => {
      setCurrentRoom({ id: roomId, players: room.players });
    });

    sock.on("room_update", ({ players }: any) => {
      if (currentRoom) {
        setCurrentRoom({ id: currentRoom.id, players });
      }
    });

    sock.on("game_started", (payload: any) => {
      const seat = seatToPlayerId(payload.yourSeat);
      if (!seat) return;
      setViewerSeat(seat);

      const newSeating: Record<PlayerId, string> = {
        north: payload.seats?.North?.name || "North",
        east: payload.seats?.East?.name || "East",
        south: payload.seats?.South?.name || "You",
        west: payload.seats?.West?.name || "West",
      };
      newSeating[seat] = "You";
      setSeating(newSeating);

      setCanonicalHands((prev) => ({
        ...prev,
        [seat]: payload.hand || [],
      }));

      setCanonicalTurn(seatToPlayerId(payload.currentTurnSeat));

      setCanonicalTricksWon({
        north: payload.tricksWon?.North ?? 0,
        east: payload.tricksWon?.East ?? 0,
        south: payload.tricksWon?.South ?? 0,
        west: payload.tricksWon?.West ?? 0,
      });

      if (payload.bids) {
        setCanonicalBids({
          north: payload.bids?.North ?? null,
          east: payload.bids?.East ?? null,
          south: payload.bids?.South ?? null,
          west: payload.bids?.West ?? null,
        });
      }

      setCanonicalTrick({
        north: null,
        east: null,
        south: null,
        west: null,
      });

      setGameStarted(true);
      setShowGameStartPopup(true);
      setTimeout(() => setShowGameStartPopup(false), 2500);
    });

    sock.on("trick_update", (p: any) => {
      if (p.currentTrick) {
        const newTrick: Record<PlayerId, Card | null> = {
          north: null,
          east: null,
          south: null,
          west: null,
        };
        p.currentTrick.forEach((t: any) => {
          const pid = seatToPlayerId(t.seat);
          if (pid) newTrick[pid] = t.card;
        });
        setCanonicalTrick(newTrick);
      }
      if (p.currentTurnSeat) {
        setCanonicalTurn(seatToPlayerId(p.currentTurnSeat));
      }
      if (p.tricksWon) {
        setCanonicalTricksWon({
          north: p.tricksWon?.North ?? canonicalTricksWon.north,
          east: p.tricksWon?.East ?? canonicalTricksWon.east,
          south: p.tricksWon?.South ?? canonicalTricksWon.south,
          west: p.tricksWon?.West ?? canonicalTricksWon.west,
        });
      }
    });

    sock.on("trick_won", (p: any) => {
      setCanonicalTrick({ north: null, east: null, south: null, west: null });
      if (p.currentTurnSeat) {
        setCanonicalTurn(seatToPlayerId(p.currentTurnSeat));
      }
      if (p.tricksWon) {
        setCanonicalTricksWon({
          north: p.tricksWon?.North ?? canonicalTricksWon.north,
          east: p.tricksWon?.East ?? canonicalTricksWon.east,
          south: p.tricksWon?.South ?? canonicalTricksWon.south,
          west: p.tricksWon?.West ?? canonicalTricksWon.west,
        });
      }
    });

    sock.on("bids_update", (updatedBids: any) => {
      setCanonicalBids({
        north: updatedBids?.North ?? null,
        east: updatedBids?.East ?? null,
        south: updatedBids?.South ?? null,
        west: updatedBids?.West ?? null,
      });
    });

    return () => {
      sock.off("rooms_update");
      sock.off("room_created");
      sock.off("joined_room");
      sock.off("room_update");
      sock.off("game_started");
      sock.off("trick_update");
      sock.off("trick_won");
      sock.off("bids_update");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoom]);

  // --- Event emitters ---
  const handleNameSubmit = (name: string) => {
    setPlayerName(name);
    socket?.emit("set_player_name", name);
  };

  const handleCreateRoom = () => {
    socket?.emit("create_room");
  };

  const handleJoinRoom = (roomId: string) => {
    socket?.emit("join_room", roomId);
    setCurrentRoom({ id: roomId, players: currentRoom?.players || [] });
  };

  const handlePlayCard = (player: PlayerId, card: Card) => {
    if (player !== "south") return; // local viewer
    if (!currentRoom) return;
    socket?.emit("play_card", { roomId: currentRoom.id, card });
  };

  // --- Derived rotated GameState ---
  const localGameState: GameState = useMemo(() => {
    if (!viewerSeat) {
      return {
        trick: { north: null, east: null, south: null, west: null },
        round: 0,
        turn: "south",
        hands: { north: [], east: [], south: [], west: [] },
        tricksWon: { north: 0, east: 0, south: 0, west: 0 },
        bids: { north: null, east: null, south: null, west: null },
        scores: { north: 0, east: 0, south: 0, west: 0 },
        deck: [],
      } as GameState;
    }

    return {
      trick: remapTrick(canonicalTrick, viewerSeat),
      round: 0,
      turn: (remapTurn(canonicalTurn, viewerSeat) ?? "south") as PlayerId,
      hands: remapHands(canonicalHands, viewerSeat),
      tricksWon: remapAggregates(canonicalTricksWon, viewerSeat),
      bids: remapAggregates(canonicalBids, viewerSeat),
      scores: { north: 0, east: 0, south: 0, west: 0 },
      deck: [],
    } as GameState;
  }, [canonicalHands, canonicalTrick, canonicalTurn, canonicalTricksWon, canonicalBids, viewerSeat]);

  // --- Lobby rooms converted to required shape ---
  const lobbyRooms: Record<string, Room> = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(rooms).map(([id, r]) => [
          id,
          { id, players: r.players },
        ])
      ) as Record<string, Room>,
    [rooms]
  );

  // --- UI Flow ---
  if (!playerName) {
    return <NameInputPopup onNameSubmit={handleNameSubmit} />;
  }

  if (showGameStartPopup && currentRoom) {
    return (
      <div className="fixed inset-0 bg-teal-800 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl text-2xl font-bold animate-pulse">
          All players are in! Starting the game...
        </div>
      </div>
    );
  }

  if (gameStarted && currentRoom) {
    return (
      <div className="fixed inset-0 bg-teal-800 overflow-hidden">
        <Table
          state={localGameState}
          playCard={handlePlayCard}
          you="south"
          onEvaluateTrick={() => {}}
          nameMap={{
            north: seating.north,
            east: seating.east,
            south: seating.south,
            west: seating.west,
          }}
        />
      </div>
    );
  }

  if (currentRoom) {
    return (
      <div className="fixed inset-0 bg-teal-800 flex items-center justify-center text-white text-2xl">
        <div className="bg-black bg-opacity-50 p-10 rounded-lg text-center shadow-lg">
          <h2 className="text-3xl font-bold mb-4">
            Room: {currentRoom.players[0]?.name}'s Game
          </h2>
          <p className="mb-6">
            Waiting for players... ({currentRoom.players.length}/4)
          </p>
          <div className="space-y-2">
            {currentRoom.players.map(p => (
              <p key={p.id}>{p.name} has joined.</p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Lobby
      rooms={lobbyRooms}
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
    />
  );
};

export default App;
