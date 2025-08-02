// src/App.tsx
import React, { useState, useEffect, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import { Lobby, Room as LobbyRoom } from "./components/Lobby";
import { NameInputPopup } from "./components/NameInputPopup";
import { Table } from "./components/Table";
import type { GameState, PlayerId, Card } from "./types/spades";

// fixed server url
const SERVER_URL = "https://call-break-server.onrender.com";

interface Player {
  id: string;
  name: string;
}
interface RoomFromServer {
  players: Player[];
  started?: boolean;
}
interface Room {
  id: string;
  players: Player[];
  started?: boolean;
}

// viewer seat remapping helpers so the client sees themselves as south
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
    local[localSeat] = canonical[serverSeat] || [];
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
  const viewerIndex = SEAT_ORDER.indexOf(viewerSeat);
  const targetIndex = SEAT_ORDER.indexOf("south");
  const rotation = (targetIndex - viewerIndex + 4) % 4;
  const serverIndex = SEAT_ORDER.indexOf(canonicalTurn);
  return SEAT_ORDER[(serverIndex + rotation) % 4];
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

const defaultEmptyGameState: GameState = {
  trick: { north: null, east: null, south: null, west: null },
  round: 0,
  turn: null,
  hands: { north: [], east: [], south: [], west: [] },
  tricksWon: { north: 0, east: 0, south: 0, west: 0 },
  bids: { north: null, east: null, south: null, west: null },
  spadesBroken: false,
};

const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [rooms, setRooms] = useState<Record<string, RoomFromServer>>({});
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [viewerSeat, setViewerSeat] = useState<PlayerId | null>(null);
  const [seatingNames, setSeatingNames] = useState<Record<PlayerId, string>>({
    north: "North",
    east: "East",
    south: "You",
    west: "West",
  });
  const [canonicalHands, setCanonicalHands] = useState<Record<PlayerId, Card[]>>({
    north: [],
    east: [],
    south: [],
    west: [],
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
  const [canonicalSpadesBroken, setCanonicalSpadesBroken] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [showGameStartPopup, setShowGameStartPopup] = useState(false);
  const [joinNotifications, setJoinNotifications] = useState<string[]>([]);

  // init socket once
  useEffect(() => {
    const sock = io(SERVER_URL, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
    setSocket(sock);
    return () => {
      sock.disconnect();
    };
  }, []);

  // socket listeners: only depend on socket
  useEffect(() => {
    if (!socket) return;

    const handleRoomsUpdate = (updated: Record<string, RoomFromServer>) => {
      setRooms(updated);
    };

    const handleRoomCreated = ({ roomId, room }: any) => {
      setCurrentRoom({ id: roomId, players: room.players });
    };

    const handleJoinedRoom = ({ roomId, room }: any) => {
      setCurrentRoom({ id: roomId, players: room.players });
    };

    const handleRoomUpdate = ({ roomId, players }: any) => {
      setCurrentRoom(prev =>
        prev && prev.id === roomId ? { ...prev, players } : { id: roomId, players }
      );
    };

    const handlePlayerJoined = ({ name }: any) => {
      const msg = `${name} has joined.`;
      setJoinNotifications(n => [...n, msg]);
      setTimeout(() => {
        setJoinNotifications(n => n.filter(m => m !== msg));
      }, 4000);
    };

    const handleGameStarted = (payload: any) => {
      const seat = seatToPlayerId(payload.yourSeat);
      if (!seat) return;
      setViewerSeat(seat);
      setGameStarted(true);
      setShowGameStartPopup(true);
      setTimeout(() => setShowGameStartPopup(false), 2000);

      setSeatingNames({
        north: payload.seats?.North?.name || "North",
        east: payload.seats?.East?.name || "East",
        south: payload.seats?.South?.name || "You",
        west: payload.seats?.West?.name || "West",
      });

      setCanonicalHands(prev => ({ ...prev, [seat]: payload.hand || [] }));
      setCanonicalTurn(seatToPlayerId(payload.currentTurnSeat));
      setCanonicalTricksWon({
        north: payload.tricksWon?.North ?? 0,
        east: payload.tricksWon?.East ?? 0,
        south: payload.tricksWon?.South ?? 0,
        west: payload.tricksWon?.West ?? 0,
      });
      setCanonicalBids({
        north: payload.bids?.North ?? null,
        east: payload.bids?.East ?? null,
        south: payload.bids?.South ?? null,
        west: payload.bids?.West ?? null,
      });
      setCanonicalSpadesBroken(!!payload.spadesBroken);
      setCanonicalTrick({ north: null, east: null, south: null, west: null });
    };

    const handleTrickUpdate = (p: any) => {
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
        setCanonicalTricksWon(prev => ({
          north: p.tricksWon?.North ?? prev.north,
          east: p.tricksWon?.East ?? prev.east,
          south: p.tricksWon?.South ?? prev.south,
          west: p.tricksWon?.West ?? prev.west,
        }));
      }
      if (p.bids) {
        setCanonicalBids(prev => ({
          north: p.bids?.North ?? prev.north,
          east: p.bids?.East ?? prev.east,
          south: p.bids?.South ?? prev.south,
          west: p.bids?.West ?? prev.west,
        }));
      }
      if (typeof p.spadesBroken === "boolean") {
        setCanonicalSpadesBroken(p.spadesBroken);
      }
    };

    socket.on("rooms_update", handleRoomsUpdate);
    socket.on("room_created", handleRoomCreated);
    socket.on("joined_room", handleJoinedRoom);
    socket.on("room_update", handleRoomUpdate);
    socket.on("player_joined", handlePlayerJoined);
    socket.on("game_started", handleGameStarted);
    socket.on("trick_update", handleTrickUpdate);

    return () => {
      socket.off("rooms_update", handleRoomsUpdate);
      socket.off("room_created", handleRoomCreated);
      socket.off("joined_room", handleJoinedRoom);
      socket.off("room_update", handleRoomUpdate);
      socket.off("player_joined", handlePlayerJoined);
      socket.off("game_started", handleGameStarted);
      socket.off("trick_update", handleTrickUpdate);
    };
  }, [socket]);

  // emitters
  const handleNameSubmit = (name: string) => {
    setPlayerName(name);
    socket?.emit("set_player_name", name);
  };
  const handleCreateRoom = () => socket?.emit("create_room");
  const handleJoinRoom = (roomId: string) => {
    socket?.emit("join_room", roomId);
    setCurrentRoom(prev => (prev ? { id: roomId, players: prev.players } : null));
  };
  const handlePlayCard = (player: PlayerId, card: Card) => {
    if (!currentRoom) return;
    socket?.emit("play_card", { roomId: currentRoom.id, card });
  };

  // derived local game state (viewer as south)
  const localGameState: GameState = useMemo(() => {
    if (!viewerSeat) return defaultEmptyGameState;
    return {
      trick: remapTrick(canonicalTrick, viewerSeat),
      round: 0,
      turn: remapTurn(canonicalTurn, viewerSeat),
      hands: remapHands(canonicalHands, viewerSeat),
      tricksWon: remapAggregates(canonicalTricksWon, viewerSeat),
      bids: remapAggregates(canonicalBids, viewerSeat),
      spadesBroken: canonicalSpadesBroken,
    };
  }, [
    canonicalHands,
    canonicalTrick,
    canonicalTurn,
    canonicalTricksWon,
    canonicalBids,
    canonicalSpadesBroken,
    viewerSeat,
  ]);

  const lobbyRoomsForComponent: Record<string, LobbyRoom> = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(rooms).map(([id, r]) => [
          id,
          { id, players: r.players, started: r.started },
        ])
      ),
    [rooms]
  );

  // UI logic
  if (!playerName) return <NameInputPopup onNameSubmit={handleNameSubmit} />;

  if (showGameStartPopup) {
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
            north: seatingNames.north,
            east: seatingNames.east,
            south: seatingNames.south,
            west: seatingNames.west,
          }}
        />
      </div>
    );
  }

  if (currentRoom) {
    return (
      <div className="fixed inset-0 bg-teal-800 flex items-center justify-center text-white text-2xl relative">
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 space-y-1 z-30">
          {joinNotifications.map((n, i) => (
            <div
              key={i}
              className="bg-green-500 text-white px-4 py-2 rounded shadow-md"
            >
              {n}
            </div>
          ))}
        </div>

        <div className="bg-black bg-opacity-50 p-10 rounded-lg text-center shadow-lg">
          <h2 className="text-3xl font-bold mb-4">
            Room: {currentRoom.players[0]?.name}'s Game
          </h2>
          <p className="mb-6">
            Waiting for players... ({currentRoom.players.length}/4)
          </p>
          <div className="space-y-2">
            {currentRoom.players.map((p) => (
              <p key={p.id}>{p.name} has joined.</p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Lobby
      rooms={lobbyRoomsForComponent}
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
    />
  );
};

export default App;
