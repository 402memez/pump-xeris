import React, { useState, useEffect, useRef, useCallback } from "react";
import { Rocket, Menu, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import RocketGame from "../components/RocketGame";
import BettingPanel from "../components/BettingPanel";
import LiveBets from "../components/LiveBets";
import GameHistory from "../components/GameHistory";
import Leaderboard from "../components/Leaderboard";
import UserStats from "../components/UserStats";
import Chat from "../components/Chat";
import {
  mockGameHistory,
  mockLiveBets,
  mockLeaderboard,
  mockUserStats,
  mockChatMessages,
  generateRandomMultiplier,
  updateLiveBetsMultiplier,
} from "../mock/gameData";

const RocketGamePage = () => {
  const [gameState, setGameState] = useState("waiting"); // waiting, flying, crashed
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [balance, setBalance] = useState(mockUserStats.balance);
  const [activeBet, setActiveBet] = useState(null);
  const [liveBets, setLiveBets] = useState(mockLiveBets);
  const [gameHistory, setGameHistory] = useState(mockGameHistory);
  const [countdown, setCountdown] = useState(5);
  const [chatMessages, setChatMessages] = useState(mockChatMessages);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Memoized handlers to avoid dependency issues
  const handleCashOut = useCallback((multiplier = currentMultiplier) => {
    if (!activeBet) return;

    const winAmount = activeBet.betAmount * multiplier;
    setBalance((prev) => prev + winAmount);
    
    // Add chat message for cash out
    const newChatMessage = {
      id: Date.now(),
      username: "You",
      text: `Cashed out at ${multiplier.toFixed(2)}x for $${winAmount.toFixed(2)}! 💰`,
      timestamp: new Date(),
      type: "win",
    };
    setChatMessages((prev) => [...prev, newChatMessage]);
    
    setActiveBet(null);
  }, [activeBet, currentMultiplier]);

  // Game loop
  useEffect(() => {
    let interval;

    if (gameState === "waiting") {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setGameState("flying");
            setCurrentMultiplier(1.0);
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (gameState === "flying") {
      interval = setInterval(() => {
        setCurrentMultiplier((prev) => {
          const newMultiplier = prev + 0.01;

          // Random crash logic
          const crashChance = Math.random();
          const shouldCrash =
            (newMultiplier > 2 && crashChance < 0.02) ||
            (newMultiplier > 5 && crashChance < 0.05) ||
            (newMultiplier > 10 && crashChance < 0.1) ||
            newMultiplier > 20;

          if (shouldCrash) {
            setGameState("crashed");
            
            // Add to history
            const newHistory = [
              {
                id: Date.now(),
                multiplier: newMultiplier,
                timestamp: new Date(),
                crashed: true,
              },
              ...gameHistory,
            ].slice(0, 20);
            setGameHistory(newHistory);

            // Reset active bet if player didn't cash out
            if (activeBet) {
              setActiveBet(null);
            }

            // Reset to waiting after crash
            setTimeout(() => {
              setGameState("waiting");
              setCountdown(5);
            }, 3000);

            return newMultiplier;
          }

          // Update active bet multiplier
          if (activeBet) {
            setActiveBet({
              ...activeBet,
              currentMultiplier: newMultiplier,
            });

            // Auto cashout check
            if (
              activeBet.autoCashout &&
              newMultiplier >= activeBet.autoCashout
            ) {
              handleCashOut(newMultiplier);
            }
          }

          // Update live bets
          setLiveBets((prev) =>
            updateLiveBetsMultiplier(prev, newMultiplier)
          );

          return newMultiplier;
        });
      }, 50);
    }

    return () => clearInterval(interval);
  }, [gameState, activeBet, gameHistory, handleCashOut]);

  const handlePlaceBet = (betAmount, autoCashoutValue) => {
    if (betAmount > balance) return;

    setBalance((prev) => prev - betAmount);
    setActiveBet({
      betAmount,
      currentMultiplier: 1.0,
      autoCashout: autoCashoutValue,
    });
  };

  const handleSendChatMessage = (message) => {
    const newMessage = {
      id: Date.now(),
      username: "You",
      text: message,
      timestamp: new Date(),
      type: "chat",
    };
    setChatMessages((prev) => [...prev, newMessage]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-gradient-to-br from-orange-500 to-rose-600 p-1.5 sm:p-2 rounded-lg">
                <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-white">Rocket Crash</h1>
                <p className="text-[10px] sm:text-xs text-gray-400 hidden sm:block">Bet. Watch. Cash Out!</p>
              </div>
            </div>

            {/* Mobile Balance Display */}
            <div className="flex items-center space-x-2 sm:hidden">
              <div className="bg-gray-800/50 px-3 py-1.5 rounded-lg">
                <div className="text-xs text-gray-400">Balance</div>
                <div className="text-sm font-bold text-cyan-400">{balance.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Mobile: Tabs Layout */}
        <div className="lg:hidden space-y-4">
          {/* Countdown */}
          {gameState === "waiting" && (
            <div className="text-center py-3 bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-800">
              <div className="text-xs text-gray-400 mb-1">Next round in</div>
              <div className="text-3xl font-bold text-cyan-400 animate-pulse">
                {countdown}s
              </div>
            </div>
          )}

          {/* Game Canvas */}
          <RocketGame
            gameState={gameState}
            currentMultiplier={currentMultiplier}
            onCashOut={handleCashOut}
          />

          {/* Betting Panel */}
          <BettingPanel
            balance={balance}
            gameState={gameState}
            onPlaceBet={handlePlaceBet}
            onCashOut={handleCashOut}
            activeBet={activeBet}
          />

          {/* Tabs for Mobile */}
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-900 border border-gray-800">
              <TabsTrigger value="stats" className="text-xs">Stats</TabsTrigger>
              <TabsTrigger value="live" className="text-xs">Live</TabsTrigger>
              <TabsTrigger value="chat" className="text-xs">Chat</TabsTrigger>
              <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
            </TabsList>
            <TabsContent value="stats" className="mt-4">
              <UserStats stats={mockUserStats} />
            </TabsContent>
            <TabsContent value="live" className="mt-4">
              <LiveBets bets={liveBets} currentMultiplier={currentMultiplier} />
            </TabsContent>
            <TabsContent value="chat" className="mt-4">
              <Chat 
                messages={chatMessages} 
                onSendMessage={handleSendChatMessage}
                currentUser="You"
              />
            </TabsContent>
            <TabsContent value="history" className="mt-4 space-y-4">
              <GameHistory history={gameHistory} />
              <Leaderboard leaders={mockLeaderboard} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop: Grid Layout */}
        <div className="hidden lg:grid grid-cols-12 gap-6">
          {/* Left Sidebar - User Stats */}
          <div className="col-span-3 space-y-6">
            <UserStats stats={mockUserStats} />
          </div>

          {/* Center - Game Area */}
          <div className="col-span-6 space-y-6">
            {/* Countdown */}
            {gameState === "waiting" && (
              <div className="text-center py-4 bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-800">
                <div className="text-sm text-gray-400 mb-1">Next round in</div>
                <div className="text-4xl font-bold text-cyan-400 animate-pulse">
                  {countdown}s
                </div>
              </div>
            )}

            <RocketGame
              gameState={gameState}
              currentMultiplier={currentMultiplier}
              onCashOut={handleCashOut}
            />

            <BettingPanel
              balance={balance}
              gameState={gameState}
              onPlaceBet={handlePlaceBet}
              onCashOut={handleCashOut}
              activeBet={activeBet}
            />
          </div>

          {/* Right Sidebar */}
          <div className="col-span-3 space-y-6">
            <LiveBets bets={liveBets} currentMultiplier={currentMultiplier} />
            <Chat 
              messages={chatMessages} 
              onSendMessage={handleSendChatMessage}
              currentUser="You"
            />
          </div>
        </div>

        {/* Bottom Section - Desktop Only */}
        <div className="hidden lg:grid grid-cols-2 gap-6 mt-6">
          <GameHistory history={gameHistory} />
          <Leaderboard leaders={mockLeaderboard} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900/50 backdrop-blur-lg mt-8 sm:mt-12">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="text-center text-gray-500 text-xs sm:text-sm">
            <p>© 2025 Rocket Crash. Play responsibly.</p>
            <p className="text-[10px] sm:text-xs mt-1">
              This is a demonstration game. No real money involved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RocketGamePage;
