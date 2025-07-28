// src/App.tsx
import React, { useState, useEffect } from 'react';
import { useGameState } from './hooks/useGameState';
import { Table } from './components/Table';
import { Scoreboard } from './components/Scoreboard';
import { BetPopup } from './components/BetPopup';
import { Dashboard } from './components/Dashboard';
import { GameOverPopup } from './components/GameOverPopup';

const App: React.FC = () => {
  const { state, isHandOver, isGameOver, gameHistory, totalScores, startGame, placeBid, playCard, evaluateAndAdvanceTrick, resetGame } = useGameState();
  const [betPopupOpen, setBetPopupOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  useEffect(() => {
    startGame();
    setBetPopupOpen(true);
  }, []);

  useEffect(() => {
    if (isHandOver && !isGameOver) {
      setTimeout(() => {
        startGame();
        setBetPopupOpen(true);
      }, 1500);
    }
  }, [isHandOver, isGameOver]);

  const handleBetSelect = (n: number) => {
    placeBid('south', n);
    setBetPopupOpen(false);
  };

  const handleNewGame = () => {
    resetGame();
    setBetPopupOpen(true);
  };

  const handlePlayAgain = () => {
    resetGame();
    setBetPopupOpen(true);
  };

  return (
    <div className="fixed inset-0 bg-teal-800 overflow-hidden">
      <Table state={state} playCard={playCard} you="south" onEvaluateTrick={evaluateAndAdvanceTrick} />

      {betPopupOpen && <BetPopup onSelect={handleBetSelect} />}
      {dashboardOpen && <Dashboard history={gameHistory} onClose={() => setDashboardOpen(false)} />}
      {isGameOver && <GameOverPopup totalScores={totalScores} onPlayAgain={handlePlayAgain} />}

      <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
        <button onClick={() => setDashboardOpen(true)} className="p-2 bg-gray-700 text-white rounded-full hover:bg-gray-600" aria-label="Show Game History">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 00-4-4H3V9h2a4 4 0 004-4V3l7 4-7 4zm6 0v-2a4 4 0 00-4-4h-2m-4 0H3m14 0h-2m-4 0h2" />
          </svg>
        </button>
        <button onClick={handleNewGame} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          New Game
        </button>
      </div>

      {!betPopupOpen && !isGameOver && (
        <>
          <div className="absolute top-4 left-4 z-20 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
            <span className="font-semibold">Your Bid:</span> {state.bids.south}
          </div>
          <div className="absolute bottom-4 right-4 z-20">
            <Scoreboard bids={state.bids} tricksWon={state.tricksWon} />
          </div>
        </>
      )}
    </div>
  );
};

export default App;