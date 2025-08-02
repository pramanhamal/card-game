// src/components/NameInputPopup.tsx
import React, { useState } from "react";

interface NameInputPopupProps {
  onNameSubmit: (name: string) => void;
}

export const NameInputPopup: React.FC<NameInputPopupProps> = ({ onNameSubmit }) => {
  const [name, setName] = useState("");

  const submit = () => {
    if (name.trim()) onNameSubmit(name.trim());
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded p-6 w-full max-w-sm shadow">
        <h2 className="text-xl font-bold mb-2">Enter your name</h2>
        <input
          aria-label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full border px-3 py-2 rounded mb-4"
        />
        <button
          onClick={submit}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
