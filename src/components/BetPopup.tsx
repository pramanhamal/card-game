import React from "react";

interface Props {
  onSelect: (bid: number) => void;
}

export const BetPopup: React.FC<Props> = ({ onSelect }) => {
  const bids = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded p-6 shadow w-full max-w-sm">
        <h2 className="text-lg font-bold mb-2">Place Your Bid</h2>
        <div className="grid grid-cols-4 gap-2">
          {bids.map((b) => (
            <button
              key={b}
              onClick={() => onSelect(b)}
              className="border rounded px-3 py-2 hover:bg-gray-100"
            >
              {b}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
