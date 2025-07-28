// src/components/BetPopup.tsx
import React, { useEffect, useState } from 'react';

interface BetPopupProps {
  onSelect: (bet: number) => void;
}

export const BetPopup: React.FC<BetPopupProps> = ({ onSelect }) => {
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onSelect(1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onSelect]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-24 px-4">
      <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-lg p-6 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Select Your Bet</h2>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[1,2,3,4,5,6,7,8].map(n => (
            <button
              key={n}
              onClick={() => onSelect(n)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {n}
            </button>
          ))}
        </div>
        <div className="h-2 bg-gray-200 rounded overflow-hidden mb-2">
          <div
            className="h-full bg-blue-500 transition-width duration-1000"
            style={{ width: `${(countdown / 15) * 100}%` }}
          />
        </div>
        <p className="text-gray-600">Auto-selecting <span className="font-semibold">1</span> in {countdown}s</p>
      </div>
    </div>
  );
};