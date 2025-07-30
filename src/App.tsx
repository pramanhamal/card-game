// src/App.tsx
import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from "socket.io-client";

// --- Import Your Components ---
import { NameInputPopup } from './components/NameInputPopup';
import { Lobby } from './components/Lobby';
import { GameState } from './types/spades';

// --- SERVER URL ---
// This must be the correct URL of your deployed backend service from Render
const SERVER_URL = "https://callbreak-server.onrender.com";

// --- Helper Types for Multiplayer ---
interface Player { id: string; name: string; }
interface Room { id: string; players: Player[]; gameState: GameState | null; }
type Screen = 'enter_name' | 'lobby' | 'waiting_room' | 'in_game';

const App: React.FC = () => {
  // --- State Management ---
  const [screen, setScreen] = useState<Screen>('enter_name');
  const [playerName, setPlayerName] = useState<string>('');
  const [rooms, setRooms] = useState<Record<string, Room>>({});
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // --- Effect for Server Connection and Event Listeners ---
  useEffect(() => {
    // This effect runs only once to establish the connection
    const newSocket = io(SERVER_URL);
    socketRef.current = newSocket;

    newSocket.on('connect', () => console.log('Successfully connected to server'));
    newSocket.on('connect_error', (err) => console.error('Connection Error:', err.message));

    newSocket.on('rooms_update', (updatedRooms) => setRooms(updatedRooms));
    newSocket.on('joined_room', (roomDetails) => {
      setCurrentRoom(roomDetails);
      setScreen('waiting_room');
    });
    newSocket.on('room_update', (roomDetails) => setCurrentRoom(roomDetails));
    newSocket.on('start_game', (data) => {
      setCurrentRoom(data.room);
      setScreen('in_game');
    });
    
    // Clean up the connection when the component unmounts
    return () => {
      newSocket.disconnect();
    };
  }, []); // Empty array ensures this runs only ONCE.

  // --- Handler Functions to Emit Events ---
  const handleNameSubmit = (name: string) => {
    setPlayerName(name);
    setScreen('lobby');
    socketRef.current?.emit('join_lobby', name);
  };
  const handleCreateRoom = () => socketRef.current?.emit('create_room');
  const handleJoinRoom = (roomId: string) => socketRef.current?.emit('join_room', roomId);

  // --- Render Logic ---
  switch (screen) {
    case 'enter_name':
      return <NameInputPopup onNameSubmit={handleNameSubmit} />;
    case 'lobby':
      return <Lobby rooms={rooms} onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
    case 'waiting_room':
      if (!currentRoom) return <div className="text-white text-center p-10">Loading room...</div>;
      return (
        <div className="fixed inset-0 bg-teal-800 flex items-center justify-center text-white text-2xl">
          <div className="bg-black bg-opacity-50 p-10 rounded-lg text-center shadow-lg">
            <h2 className="text-3xl font-bold mb-4">Room: {currentRoom.players[0]?.name}'s Game</h2>
            <p className="mb-6 animate-pulse">Waiting for players... ({currentRoom.players.length}/4)</p>
            <div className="space-y-2">
              {currentRoom.players.map(p => <p key={p.id}>✅ {p.name} has joined.</p>)}
            </div>
          </div>
        </div>
      );
    case 'in_game':
      return (
        <div className="fixed inset-0 bg-teal-800 flex items-center justify-center text-white text-2xl">
          <h1 className="text-4xl font-bold">Game in Progress!</h1>
          {/* This is where you will render your <Table /> component */}
        </div>
      );
    default:
      return <NameInputPopup onNameSubmit={handleNameSubmit} />;
  }
};

export default App;