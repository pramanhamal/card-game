import React, { useState } from "react";

export interface Player {
  id: string;
  name: string;
  seat?: string;
  isAI?: boolean;
}

export interface Room {
  id: string;
  players: Player[];
  started?: boolean;
}

interface Props {
  rooms: Record<string, Room>;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
}

export const Lobby: React.FC<Props> = ({
  rooms,
  onCreateRoom,
  onJoinRoom,
}) => {
  const [joinId, setJoinId] = useState("");
  return (
    <div className="min-h-screen bg-teal-800 p-6 text-white flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between mb-4">
          <h1 className="text-3xl font-bold">Lobby</h1>
          <button onClick={onCreateRoom} className="bg-green-500 px-4 py-2 rounded">
            Create Room
          </button>
        </div>
        <div className="flex gap-2 mb-6">
          <input
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            placeholder="Room ID"
            className="flex-1 px-3 py-2 rounded text-black"
          />
          <button
            onClick={() => onJoinRoom(joinId)}
            className="bg-indigo-500 px-4 py-2 rounded"
          >
            Join
          </button>
        </div>
        <div className="space-y-3">
          {Object.entries(rooms).map(([id, room]) => (
            <div
              key={id}
              className="bg-gray-900 p-3 rounded flex justify-between"
            >
              <div>
                <div className="font-semibold">Room ID: {id}</div>
                <div className="text-sm">
                  Players: {room.players.length}/4 {room.started && "(started)"}
                </div>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {room.players.map((p) => (
                    <div
                      key={p.id}
                      className="bg-gray-700 px-2 py-1 rounded text-xs"
                    >
                      {p.name} {p.isAI ? "(Bot)" : ""}
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => onJoinRoom(id)}
                className="bg-blue-500 px-3 py-1 rounded"
              >
                Join
              </button>
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
