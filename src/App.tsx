import React, { useState, useEffect } from 'react';
import { io, Socket } from "socket.io-client";

// --- Import Your Components ---
import { Table } from './components/Table';
import { NameInputPopup } from './components/NameInputPopup';
import { Lobby } from './components/Lobby';
import { GameOverPopup } from './components/GameOverPopup';

// --- Import Your Game Types ---
import { GameState, PlayerId, Card } from './types/spades';

// --- SERVER URL ---
// Replace this with the URL of your deployed backend service from Render
const SERVER_URL = "https://call-break-server.onrender.com";

// --- Helper Types for Multiplayer ---
interface Player {
  id: string;
  name: string;
}
interface Room {
  id: string;
  players: Player[];
  gameState: GameState | null;
}

const App: React.FC = () => {
  // --- State Management ---
  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerName, setPlayerName] = useState<string>('');
  const [rooms, setRooms] = useState<Record<string, Room>>({});
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showGameStartPopup, setShowGameStartPopup] = useState(false);

  // --- Effects for Server Communication ---

  // Effect to establish a connection to the server
  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    // Clean up the connection when the component unmounts
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Effect to set up all socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listener for lobby updates (e.g., new room created)
    socket.on('rooms_update', (updatedRooms: Record<string, Room>) => {
      setRooms(updatedRooms);
    });

    // Listener for when this player successfully joins a room
    socket.on('joined_room', (roomDetails: Room) => {
      setCurrentRoom(roomDetails);
    });

    // Listener for when another player joins or leaves the current room
    socket.on('room_update', (roomDetails: Room) => {
      setCurrentRoom(roomDetails);
    });

    // Listener for when the game starts
    socket.on('start_game', (data: { room: Room; /* initialGameState: GameState */ }) => {
      setCurrentRoom(data.room);
      setShowGameStartPopup(true);
      setTimeout(() => {
        setShowGameStartPopup(false);
        // In a full implementation, the server would send the initial game state
        // setGameState(data.initialGameState);
      }, 3000); // Show popup for 3 seconds
    });

    // In a full game, you would also listen for game state updates
    // socket.on('game_state_update', (newGameState: GameState) => {
    //   setGameState(newGameState);
    // });

    // Cleanup listeners when the socket changes
    return () => {
      socket.off('rooms_update');
      socket.off('joined_room');
      socket.off('room_update');
      socket.off('start_game');
      // socket.off('game_state_update');
    };
  }, [socket]);


  // --- Handler Functions to Emit Events to Server ---

  const handleNameSubmit = (name: string) => {
    setPlayerName(name);
    socket?.emit('join_lobby', name);
  };

  const handleCreateRoom = () => {
    socket?.emit('create_room');
  };

  const handleJoinRoom = (roomId: string) => {
    socket?.emit('join_room', roomId);
  };

  // In a full game, you would emit player actions like this:
  // const handlePlayCard = (card: Card) => {
  //   socket?.emit('play_card', { roomId: currentRoom?.id, card });
  // };


  // --- Conditional Rendering Logic ---

  // 1. If the player hasn't entered their name yet
  if (!playerName) {
    return <NameInputPopup onNameSubmit={handleNameSubmit} />;
  }

  // 2. If the game is in progress
  if (gameState) {
    // NOTE: This part is a placeholder. You would need to fully integrate
    // the server-driven gameState with your Table component.
    return (
      <div className="fixed inset-0 bg-teal-800 overflow-hidden">
        {/* <Table state={gameState} playCard={handlePlayCard} you={...} onEvaluateTrick={...} /> */}
      </div>
    );
  }

  // 3. If the "Game Starting" popup should be visible
  if (showGameStartPopup) {
    return (
      <div className="fixed inset-0 bg-teal-800 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl text-2xl font-bold animate-pulse">
          All players are in! Starting the game...
        </div>
      </div>
    );
  }

  // 4. If the player is in a room, waiting for others
  if (currentRoom) {
    return (
      <div className="fixed inset-0 bg-teal-800 flex items-center justify-center text-white text-2xl">
        <div className="bg-black bg-opacity-50 p-10 rounded-lg text-center">
          <h2 className="text-3xl font-bold mb-4">Room: {currentRoom.players[0]?.name}'s Game</h2>
          <p className="mb-6">Waiting for players... ({currentRoom.players.length}/4)</p>
          <div className="space-y-2">
            {currentRoom.players.map(p => <p key={p.id}>{p.name} has joined.</p>)}
          </div>
        </div>
      </div>
    );
  }

  // 5. If none of the above, show the lobby
  return <Lobby rooms={rooms} onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
};

export default App;