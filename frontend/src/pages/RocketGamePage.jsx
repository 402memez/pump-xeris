import React, { useState, useEffect, useRef, useCallback } from "react";
import { Rocket, Menu, X, Wallet, RefreshCw, Download, Settings, LogOut, Shield, Database, Info } from "lucide-react";
import { io } from 'socket.io-client';
import { XerisDApp } from 'xeris-sdk';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import RocketGame from "../components/RocketGame";
import BettingPanel from "../components/BettingPanel";
import LiveBets from "../components/LiveBets";
import GameHistory from "../components/GameHistory";
import Leaderboard from "../components/Leaderboard";
import UserStats from "../components/UserStats";
import Chat from "../components/Chat";

const SOCKET_URL = process.env.REACT_APP_BACKEND_URL;
const dapp = new XerisDApp();

const RocketGamePage = () => {
  const [gameState, setGameState] = useState("waiting"); // waiting, flying, crashed
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const multiplierRef = useRef(1.0);
  const [balance, setBalance] = useState(0);
  const [activeBet, setActiveBet] = useState(null);
  const [liveBets, setLiveBets] = useState([]);
  const [gameHistory, setGameHistory] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [countdown, setCountdown] = useState(5);
  const [chatMessages, setChatMessages] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [totalWagered, setTotalWagered] = useState(0);
  const [totalWon, setTotalWon] = useState(0);
  
  // Xeris wallet states
  const [walletConnected, setWalletConnected] = useState(false);
  const [pubKey, setPubKey] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [autoEject, setAutoEject] = useState(2.0);
  const socketRef = useRef(null);

  // User stats for display
  const userStats = {
    balance: balance,
    totalWagered: totalWagered,
    totalWon: totalWon,
    biggestWin: gameHistory.length > 0 ? Math.max(...gameHistory.map(h => h.multiplier * (h.bet_amount || 0))) : 0,
    gamesPlayed: gameHistory.length,
  };

  // Fetch real game history from backend
  const fetchGameHistory = useCallback(async () => {
    try {
      const response = await fetch(`${SOCKET_URL}/api/game/history`);
      if (response.ok) {
        const data = await response.json();
        setGameHistory(data.history || []);
      }
    } catch (err) {
      console.error("Failed to fetch game history:", err);
    }
  }, []);

  // Fetch real leaderboard from backend
  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await fetch(`${SOCKET_URL}/api/leaderboard`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
    }
  }, []);

  // Fetch user stats from backend
  const fetchUserStats = useCallback(async () => {
    if (!walletConnected || !pubKey) return;
    
    try {
      const response = await fetch(`${SOCKET_URL}/api/user/stats/${pubKey}`);
      if (response.ok) {
        const data = await response.json();
        setTotalWagered(data.total_wagered || 0);
        setTotalWon(data.total_won || 0);
      }
    } catch (err) {
      console.error("Failed to fetch user stats:", err);
    }
  }, [walletConnected, pubKey]);

  // Sync balance from blockchain
  const syncBalance = useCallback(async () => {
    const currentKey = pubKey || (dapp.publicKey ? dapp.publicKey.toString() : '');
    if (!currentKey) {
      console.log('❌ No wallet key available for balance sync');
      return;
    }

    try {
      setIsRefreshing(true);
      console.log('🔄 Syncing balance for:', currentKey);
      
      // Use SDK's built-in getBalance method
      const lamports = await dapp.getBalance(currentKey);
      console.log('✅ Got lamports:', lamports);
      const xrs = lamports / 1_000_000_000; // Convert lamports to XRS
      console.log('✅ Converted to XRS:', xrs);
      setBalance(xrs);
    } catch (err) {
      console.error("❌ SDK Balance fetch error:", err);
      // Fallback to backend proxy if SDK fails
      try {
        console.log('🔄 Trying backend proxy...');
        const response = await fetch(`${SOCKET_URL}/api/xeris/balance/${currentKey}`);
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Backend proxy response:', data);
          if (data.balance !== undefined) {
            setBalance(data.balance);
          }
        } else {
          console.error('❌ Backend proxy failed:', response.status);
        }
      } catch (fallbackErr) {
        console.error("❌ Fallback balance fetch failed:", fallbackErr);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [pubKey]);

  // Connect to Xeris wallet
  const connectWallet = useCallback(async () => {
    try {
      console.log('🔌 Attempting to connect wallet...');
      const provider = await XerisDApp.waitForProvider(3000);
      if (!provider) {
        console.log("❌ No Xeris wallet found - install Xeris wallet extension");
        alert("Please install the Xeris wallet extension to connect");
        return;
      }
      
      console.log('✅ Xeris provider found');
      await dapp.connect();
      console.log('✅ Wallet connected');
      
      const walletKey = dapp.publicKey?.toString() || '';
      setWalletConnected(true);
      setPubKey(walletKey);
      console.log('✅ Wallet address:', walletKey);
      
      // Initial balance sync with delay
      console.log('⏳ Waiting 1 second before syncing balance...');
      setTimeout(() => {
        console.log('🔄 Starting balance sync...');
        syncBalance();
      }, 1000);
      
      dapp.on("accountChanged", async (newKey) => {
        console.log('🔄 Account changed to:', newKey?.toString());
        setPubKey(newKey?.toString() || '');
        setTimeout(() => syncBalance(), 500);
      });

      dapp.on("disconnect", () => {
        console.log('❌ Wallet disconnected');
        setWalletConnected(false);
        setPubKey('');
        setBalance(0);
      });
    } catch (err) {
      console.error("❌ Wallet connection failed:", err);
      alert("Failed to connect wallet: " + err.message);
    }
  }, [syncBalance]);

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      if (dapp.disconnect) await dapp.disconnect();
      setWalletConnected(false);
      setPubKey('');
      setBalance(0);
      setShowWalletMenu(false);
    } catch (err) {
      console.error("Disconnect failed:", err);
    }
  }, []);

  // Request testnet tokens from faucet
  const requestFaucet = useCallback(async () => {
    if (!walletConnected) return;
    
    try {
      const currentKey = pubKey || (dapp.publicKey ? dapp.publicKey.toString() : '');
      
      // Request 10 XRS = 10,000,000,000 lamports
      const response = await fetch(`${SOCKET_URL}/api/xeris/faucet/${currentKey}`);
      
      if (!response.ok) {
        throw new Error(`Faucet request failed: HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      alert("✅ Airdrop successful! 10 XRS sent to your wallet.\nRefreshing balance in 5 seconds...");
      setTimeout(() => syncBalance(), 5000);
    } catch (err) {
      alert("Faucet Error:\n\n" + err.message);
    }
  }, [walletConnected, pubKey, syncBalance]);

  // Sign authentication message
  const handleSignMessage = useCallback(async () => {
    if (!walletConnected) {
      alert("Connect wallet first!");
      return;
    }
    try {
      const msg = `Authenticate to Xeris Crash\nTimestamp: ${new Date().toISOString()}`;
      const { signature } = await dapp.signMessage(msg);
      alert(`✅ Message Signed Successfully!\n\nSignature: ${signature.substring(0, 40)}...`);
    } catch(err) { 
      alert("Signing failed: " + err.message); 
    }
  }, [walletConnected]);

  // Get token accounts
  const handleGetTokens = useCallback(async () => {
    if (!walletConnected) return;
    try {
      const accounts = await dapp.getTokenAccounts();
      if(accounts && accounts.token_accounts) {
        alert(`Found ${accounts.token_accounts.length} custom tokens. Check console for details!`);
        console.log("Token Portfolio:", accounts);
      } else {
        alert("No custom tokens found.");
      }
    } catch(err) { 
      alert("Fetch failed: " + err.message); 
    }
  }, [walletConnected]);

  // Memoized handlers to avoid dependency issues
  const handleCashOut = useCallback((multiplier = currentMultiplier) => {
    if (!activeBet) return;

    const winAmount = activeBet.betAmount * multiplier;
    setBalance((prev) => prev + winAmount);
    
    // Add chat message for cash out
    const newChatMessage = {
      id: Date.now(),
      username: "You",
      text: `Cashed out at ${multiplier.toFixed(2)}x for ${winAmount.toFixed(2)} XRS! 💰`,
      timestamp: new Date(),
      type: "win",
    };
    setChatMessages((prev) => [...prev, newChatMessage]);
    
    setActiveBet(null);
  }, [activeBet, currentMultiplier]);

  // Socket.io connection
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    
    socket.on('connect', () => {
      console.log('Connected to game server');
    });

    socket.on('multiplier_update', (data) => {
      const val = typeof data === 'object' ? data.multiplier : data;
      multiplierRef.current = val;
      setCurrentMultiplier(val);
      setGameState('flying');
      
      // Update active bet
      if (activeBet) {
        setActiveBet(prev => ({
          ...prev,
          currentMultiplier: val,
        }));

        // Auto cashout check
        if (activeBet.autoCashout && val >= activeBet.autoCashout) {
          handleCashOut(val);
        }
      }
    });

    socket.on('game_state', (data) => {
      const status = typeof data === 'object' ? data.status || data.state : data;
      
      if (status === 'crashed' || status === 'crash') {
        setGameState('crashed');
        
        // Add to history
        const newHistory = {
          id: Date.now(),
          multiplier: multiplierRef.current,
          timestamp: new Date(),
          crashed: true,
        };
        setGameHistory(prev => [newHistory, ...prev].slice(0, 20));

        // Reset active bet if player didn't cash out
        if (activeBet) {
          setActiveBet(null);
        }

        // Reset to waiting after crash
        setTimeout(() => {
          setCurrentMultiplier(1.0);
          multiplierRef.current = 1.0;
          setGameState('waiting');
        }, 3000);
      } else if (status === 'waiting') {
        setGameState('waiting');
        setCurrentMultiplier(1.0);
        multiplierRef.current = 1.0;
      }
    });

    socket.on('countdown', (data) => {
      setCountdown(data.seconds || data);
    });

    socket.on('live_bets', (data) => {
      // Update live bets from server
      setLiveBets(data.bets || []);
    });

    socket.on('chat_message', (data) => {
      // Add new chat message from server
      const newMessage = {
        id: Date.now(),
        username: data.username || 'Anonymous',
        text: data.text,
        timestamp: new Date(data.timestamp || Date.now()),
        type: data.type || 'chat',
      };
      setChatMessages((prev) => [...prev, newMessage].slice(-50)); // Keep last 50 messages
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from game server');
    });

    // Fetch initial data
    fetchGameHistory();
    fetchLeaderboard();

    return () => {
      if (socket) socket.disconnect();
    };
  }, [activeBet, handleCashOut, fetchGameHistory, fetchLeaderboard]);

  // Fetch user stats when wallet connects
  useEffect(() => {
    if (walletConnected && pubKey) {
      fetchUserStats();
    }
  }, [walletConnected, pubKey, fetchUserStats]);

  const handlePlaceBet = (betAmount, autoCashoutValue) => {
    if (betAmount > balance) return;

    setBalance((prev) => prev - betAmount);
    setActiveBet({
      betAmount,
      currentMultiplier: 1.0,
      autoCashout: autoCashoutValue,
    });
    
    // Add chat message
    const newChatMessage = {
      id: Date.now(),
      username: "You",
      text: `Placed bet: ${betAmount} XRS${autoCashoutValue ? ` (Auto @ ${autoCashoutValue}x)` : ''}`,
      timestamp: new Date(),
      type: "bet",
    };
    setChatMessages((prev) => [...prev, newChatMessage]);
  };

  const handleSendChatMessage = (message) => {
    if (!message.trim()) return;
    
    // Send message to server via Socket.io
    if (socketRef.current) {
      socketRef.current.emit('send_message', {
        username: walletConnected ? pubKey.substring(0, 8) + '...' : 'Anonymous',
        text: message,
        timestamp: new Date().toISOString(),
        type: 'chat',
      });
    }
    
    // Add to local state immediately for instant feedback
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
      {/* Wallet Settings Menu */}
      {showWalletMenu && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                <span>Wallet Settings</span>
              </h2>
              <button 
                onClick={() => setShowWalletMenu(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Wallet Info */}
              <div className="bg-gray-800/50 rounded-xl p-4 space-y-3">
                <div className="text-xs text-gray-400 uppercase tracking-wider">Connected Wallet</div>
                <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs text-cyan-400 break-all">
                  {pubKey || 'NOT CONNECTED'}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Balance</span>
                  <span className="text-lg font-bold text-white">{balance.toFixed(2)} XRS</span>
                </div>
              </div>

              {/* Actions */}
              {walletConnected ? (
                <div className="space-y-3">
                  <button
                    onClick={syncBalance}
                    disabled={isRefreshing}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>{isRefreshing ? 'Refreshing...' : 'Refresh Balance'}</span>
                  </button>

                  <button
                    onClick={requestFaucet}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Get 10 Testnet XRS</span>
                  </button>

                  <button
                    onClick={disconnectWallet}
                    className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/50 py-3 px-4 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Disconnect Wallet</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-3 px-4 rounded-xl font-semibold transition-all"
                >
                  Connect Wallet
                </button>
              )}

              {/* dApp Tools */}
              {walletConnected && (
                <div className="pt-4 border-t border-gray-800 space-y-3">
                  <div className="text-xs text-gray-400 uppercase tracking-wider flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>dApp Tools</span>
                  </div>
                  
                  <button
                    onClick={handleSignMessage}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center space-x-2 transition-all"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Sign Auth Message</span>
                  </button>

                  <button
                    onClick={handleGetTokens}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center space-x-2 transition-all"
                  >
                    <Database className="w-4 h-4" />
                    <span>View Token Accounts</span>
                  </button>
                </div>
              )}

              {/* Game Settings */}
              <div className="pt-4 border-t border-gray-800 space-y-3">
                <div className="text-xs text-gray-400 uppercase tracking-wider">Game Settings</div>
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium text-white">Auto Cash-Out</div>
                      <div className="text-xs text-gray-400">Automatically cash out at target multiplier</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-3">
                    <input
                      type="number"
                      step="0.1"
                      min="1.1"
                      value={autoEject}
                      onChange={(e) => setAutoEject(parseFloat(e.target.value))}
                      className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    />
                    <span className="text-cyan-400 font-bold">x</span>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-300">
                    <p className="font-medium mb-1">Socket Endpoint</p>
                    <p className="text-blue-400/80 font-mono break-all">{SOCKET_URL}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

            {/* Wallet Connection & Balance */}
            <div className="flex items-center space-x-2">
              {walletConnected ? (
                <>
                  <button
                    onClick={syncBalance}
                    disabled={isRefreshing}
                    className="hidden sm:flex bg-gray-800/50 hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors items-center space-x-2"
                  >
                    <RefreshCw className={`w-4 h-4 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                  
                  <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 px-3 sm:px-4 py-2 rounded-lg">
                    <div className="text-[10px] text-cyan-300 uppercase tracking-wider hidden sm:block">Balance</div>
                    <div className="text-sm sm:text-base font-bold text-cyan-400">
                      {balance.toFixed(2)} <span className="text-xs text-cyan-300">XRS</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowWalletMenu(true)}
                    className="bg-gray-800 hover:bg-gray-700 p-2 rounded-lg transition-colors"
                  >
                    <Settings className="w-5 h-5 text-gray-400" />
                  </button>
                </>
              ) : (
                <button
                  onClick={connectWallet}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white flex items-center space-x-2 transition-all"
                >
                  <Wallet className="w-4 h-4" />
                  <span className="hidden sm:inline">Connect Wallet</span>
                  <span className="sm:hidden">Connect</span>
                </button>
              )}
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
              <UserStats stats={userStats} />
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
              <Leaderboard leaders={leaderboard} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop: Grid Layout */}
        <div className="hidden lg:grid grid-cols-12 gap-6">
          {/* Left Sidebar - User Stats */}
          <div className="col-span-3 space-y-6">
            <UserStats stats={userStats} />
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
          <Leaderboard leaders={leaderboard} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900/50 backdrop-blur-lg mt-8 sm:mt-12">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="text-center text-gray-500 text-xs sm:text-sm">
            <p>© 2025 Rocket Crash. Play responsibly.</p>
            <p className="text-[10px] sm:text-xs mt-1">
              Powered by Xeris Blockchain
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RocketGamePage;
