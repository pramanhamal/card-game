// src/components/Lobby.tsx
import React, { useState } from "react";

export interface Room {
  id: string;
  players: { id: string; name: string }[];
}

interface LobbyProps {
  rooms: Record<string, Room>;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ rooms, onCreateRoom, onJoinRoom }) => {
  const [joinId, setJoinId] = useState("");

  return (
    <div className="min-h-screen bg-teal-800 flex flex-col items-center p-6 text-white">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Lobby</h1>
          <button
            onClick={onCreateRoom}
            className="bg-green-500 px-4 py-2 rounded hover:bg-green-600"
          >
            Create Room
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          <input
            placeholder="Room ID"
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            className="flex-1 px-3 py-2 rounded text-black"
          />
          <button
            onClick={() => onJoinRoom(joinId)}
            className="bg-indigo-500 px-4 py-2 rounded hover:bg-indigo-600"
          >
            Join
          </button>
        </div>

        <div className="space-y-3">
          {Object.entries(rooms).map(([id, room]) => (
            <div
              key={id}
              className="bg-gray-900 p-3 rounded flex justify-between items-center"
            >
              <div>
                <div className="font-medium">Room ID: {id}</div>
                <div className="text-sm">
                  Players: {room.players.length}/4
                  {room.players.length > 0 && (
                    <div className="mt-1">
                      {room.players.map((p) => (
                        <span key={p.id} className="mr-2">
                          {p.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <button
                  onClick={() => onJoinRoom(id)}
                  className="bg-blue-500 px-3 py-1 rounded hover:bg-blue-600"
                >
                  Join
                </button>
              </div>
            </div>
          ))}
          {Object.keys(rooms).length === 0 && (
            <div className="text-center text-gray-300">No rooms yet</div>
          )}
        </div>
      </div>
    </div>
  );
};
