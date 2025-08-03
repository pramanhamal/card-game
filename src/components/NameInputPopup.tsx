import React, { useState } from "react";

interface Props {
  onNameSubmit: (name: string) => void;
}

export const NameInputPopup: React.FC<Props> = ({ onNameSubmit }) => {
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold mb-2">Enter your name</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full border px-3 py-2 rounded mb-4"
        />
        <button
          onClick={() => {
            if (name.trim()) onNameSubmit(name.trim());
          }}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
