// src/components/Lobby.tsx
import React from 'react';

interface RoomInfo {
  players: { id: string; name: string }[];
}

interface LobbyProps {
  rooms: Record<string, RoomInfo>;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ rooms, onCreateRoom, onJoinRoom }) => {
  return (
    <div className="fixed inset-0 bg-teal-800 z-40 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg p-8 w-full max-w-lg text-center shadow-2xl">
        <h2 className="text-3xl font-bold mb-6">Game Lobby</h2>
        <div className="space-y-4 mb-6">
          {Object.keys(rooms).length > 0 ? (
            Object.entries(rooms).map(([roomId, room]) => (
              <div key={roomId} className="flex justify-between items-center p-4 border rounded">
                <div>
                  <p className="font-bold">Room {roomId.slice(-4)}</p>
                  <p className="text-sm text-gray-600">{room.players.map(p => p.name).join(', ')}</p>
                </div>
                <span className="font-mono bg-gray-200 px-3 py-1 rounded-full">{room.players.length}/4</span>
                {room.players.length < 4 && (
                  <button onClick={() => onJoinRoom(roomId)} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                    Join
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No active rooms. Create one to start!</p>
          )}
        </div>
        <button onClick={onCreateRoom} className="w-full px-6 py-3 bg-blue-500 text-white rounded-full text-lg font-semibold hover:bg-blue-600 transition">
          Create New Room
        </button>
      </div>
    </div>
  );
};