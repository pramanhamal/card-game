// src/components/NameInputPopup.tsx
import React, { useState } from 'react';

interface NameInputPopupProps {
  onNameSubmit: (name: string) => void;
}

export const NameInputPopup: React.FC<NameInputPopupProps> = ({ onNameSubmit }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onNameSubmit(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-8 w-full max-w-sm text-center shadow-2xl">
        <h2 className="text-2xl font-bold mb-4">Enter Your Name</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 border rounded mb-4"
          placeholder="Player Name"
          required
        />
        <button
          type="submit"
          className="w-full px-6 py-3 bg-blue-500 text-white rounded-full text-lg font-semibold hover:bg-blue-600 transition"
        >
          Join Lobby
        </button>
      </form>
    </div>
  );
};