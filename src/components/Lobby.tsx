import React from 'react';
import { PlayerId } from '../types/spades';

export interface Player {
  id: string;
  name: string;
}

export interface Room {
  id: string;
  players: Player[];
}

export interface LobbyProps {
  rooms: Record<string, Room>;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ rooms, onCreateRoom, onJoinRoom }) => {
  return (
    <div className="min-h-screen bg-teal-800 flex flex-col items-center py-10 text-white">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Multiplayer Lobby</h1>
      </div>
      <div className="mb-4 flex gap-2">
        <button
          onClick={onCreateRoom}
          className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
        >
          Create Room
        </button>
      </div>
      <div className="w-full max-w-xl">
        {Object.entries(rooms).length === 0 && (
          <div className="p-4 bg-gray-700 rounded">No active rooms yet.</div>
        )}
        {Object.entries(rooms).map(([id, room]) => (
          <div
            key={id}
            className="border rounded p-4 mb-3 bg-gray-900 flex justify-between items-center"
          >
            <div>
              <div className="font-semibold">Room ID: {id}</div>
              <div className="text-sm">
                Players: {room.players.length}/4
              </div>
              <div className="text-xs">
                {room.players.map((p) => p.name).join(", ")}
              </div>
            </div>
            <button
              onClick={() => onJoinRoom(id)}
              className="px-3 py-1 bg-green-500 rounded hover:bg-green-600"
            >
              Join
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
