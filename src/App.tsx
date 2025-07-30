// src/App.tsx
import React, { useState, useEffect } from 'react';
import { io, Socket } from "socket.io-client";
import { Table } from './components/Table';
import { NameInputPopup } from './components/NameInputPopup';
import { Lobby } from './components/Lobby';

// A placeholder for the game state you'll receive from the server
// You would replace this with your actual GameState type
interface GameStateFromServer {
    // ... define properties based on your 'GameState' type
}

const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [rooms, setRooms] = useState({});
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState<any | null>(null); // This will hold the game state from the server

  useEffect(() => {
    // This effect will run once when the component mounts to establish connection
    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('rooms_update', (updatedRooms) => {
      setRooms(updatedRooms);
    });

    socket.on('joined_room', (roomId, roomDetails) => {
      setCurrentRoom(roomId);
      console.log(`Joined room ${roomId}`, roomDetails);
    });

    socket.on('room_update', (roomDetails) => {
        console.log(`Room updated`, roomDetails);
    });

    socket.on('start_game', (data) => {
      alert(data.message); // The popup saying "All players are in"
      setGameStarted(true);
      // Here, you would receive the initial game state from the server
      // setGameState(data.initialState);
    });

    // Clean up listeners
    return () => {
      socket.off('rooms_update');
      socket.off('joined_room');
      socket.off('start_game');
      socket.off('room_update');
    };
  }, [socket]);

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

  // Render logic based on the current state
  if (!playerName) {
    return <NameInputPopup onNameSubmit={handleNameSubmit} />;
  }

  if (currentRoom && gameStarted) {
    // The game has started!
    // You'll need to pass the server-driven gameState to the Table component
    // return <Table state={gameState} playCard={...} ... />;
    return <div className="text-white text-2xl text-center p-10">Game in progress in room {currentRoom}...</div>;
  }

  if (currentRoom) {
      // Waiting in a room
      return <div className="text-white text-2xl text-center p-10">Waiting for players in room {currentRoom}...</div>;
  }

  // If name is set but not in a room, show the lobby
  return <Lobby rooms={rooms} onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
};

export default App;