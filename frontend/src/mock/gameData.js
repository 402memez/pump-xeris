// Mock data for rocket gambling game

export const mockGameHistory = [
  { id: 1, multiplier: 2.45, timestamp: new Date(Date.now() - 120000), crashed: true },
  { id: 2, multiplier: 1.23, timestamp: new Date(Date.now() - 90000), crashed: true },
  { id: 3, multiplier: 5.67, timestamp: new Date(Date.now() - 60000), crashed: true },
  { id: 4, multiplier: 1.05, timestamp: new Date(Date.now() - 30000), crashed: true },
  { id: 5, multiplier: 3.89, timestamp: new Date(Date.now() - 10000), crashed: true },
  { id: 6, multiplier: 8.92, timestamp: new Date(Date.now() - 5000), crashed: true },
  { id: 7, multiplier: 1.67, timestamp: new Date(Date.now() - 2000), crashed: true },
  { id: 8, multiplier: 4.32, timestamp: new Date(Date.now() - 1000), crashed: true },
];

export const mockLiveBets = [
  { id: 1, username: "Player_7845", betAmount: 50, multiplier: 1.45, status: "active" },
  { id: 2, username: "CryptoKing", betAmount: 120, multiplier: 1.45, status: "active" },
  { id: 3, username: "RocketMan", betAmount: 75, multiplier: 1.45, status: "active" },
  { id: 4, username: "LuckyStrike", betAmount: 200, multiplier: 1.45, status: "active" },
  { id: 5, username: "MoonShot", betAmount: 35, multiplier: 1.45, status: "active" },
];

export const mockLeaderboard = [
  { rank: 1, username: "RocketMaster", totalWins: 2450000, winRate: 67.5, biggestWin: 15000 },
  { rank: 2, username: "SkyHigher", totalWins: 1890000, winRate: 62.3, biggestWin: 12000 },
  { rank: 3, username: "CrashKing", totalWins: 1650000, winRate: 59.8, biggestWin: 18000 },
  { rank: 4, username: "GambleGod", totalWins: 1420000, winRate: 58.2, biggestWin: 9500 },
  { rank: 5, username: "SpaceAce", totalWins: 1180000, winRate: 56.7, biggestWin: 11000 },
  { rank: 6, username: "LunarLegend", totalWins: 985000, winRate: 54.1, biggestWin: 8200 },
  { rank: 7, username: "OrbitOG", totalWins: 876000, winRate: 52.9, biggestWin: 7800 },
  { rank: 8, username: "StarPlayer", totalWins: 754000, winRate: 51.3, biggestWin: 6500 },
];

export const mockUserStats = {
  balance: 5000,
  totalBets: 342,
  totalWins: 187,
  totalLosses: 155,
  winRate: 54.7,
  biggestWin: 3500,
  totalWagered: 125000,
};

// Simulate game rounds
export const generateRandomMultiplier = () => {
  const random = Math.random();
  if (random < 0.3) return (1 + Math.random() * 0.5).toFixed(2); // 30% chance: 1.00-1.50x
  if (random < 0.6) return (1.5 + Math.random() * 1.5).toFixed(2); // 30% chance: 1.50-3.00x
  if (random < 0.85) return (3 + Math.random() * 3).toFixed(2); // 25% chance: 3.00-6.00x
  return (6 + Math.random() * 14).toFixed(2); // 15% chance: 6.00-20.00x
};

export const updateLiveBetsMultiplier = (bets, currentMultiplier) => {
  return bets.map(bet => ({
    ...bet,
    multiplier: currentMultiplier,
    potentialWin: (bet.betAmount * currentMultiplier).toFixed(2)
  }));
};
