import re

# --- 1. PATCH THE BRAIN (RocketGamePage.jsx) ---
with open('src/pages/RocketGamePage.jsx', 'r') as f:
    code = f.read()

# Replace the old volatile stats with permanent LocalStorage memory
old_user_stats = r'const userStats = useMemo\(\(\) => \(\{[\s\S]*?\}\), \[.*?\]\);'
new_user_stats = """const [userStats, setUserStats] = useState(() => {
    try {
      const saved = localStorage.getItem("xeris_personal_stats");
      return saved ? JSON.parse(saved) : { totalBets: 0, totalWins: 0, totalLosses: 0, totalWagered: 0, biggestWin: 0 };
    } catch (e) { return { totalBets: 0, totalWins: 0, totalLosses: 0, totalWagered: 0, biggestWin: 0 }; }
  });

  useEffect(() => {
    localStorage.setItem("xeris_personal_stats", JSON.stringify(userStats));
  }, [userStats]);"""
code = re.sub(old_user_stats, new_user_stats, code)

# Hook into the "Place Bet" button to track bets and wager amounts
code = re.sub(
    r'(setActiveBet\(\{[\s\S]*?autoCashout: autoCashoutValue,?\s*\}\);)',
    r'\1\n    setUserStats(p => ({ ...p, totalBets: (p.totalBets || 0) + 1, totalWagered: (p.totalWagered || 0) + betAmount }));',
    code
)

# Hook into the "Cash Out" button to track wins and high scores
code = code.replace(
    'setBalance((prev) => prev + winAmount);',
    'setBalance((prev) => prev + winAmount);\n    setUserStats(p => ({ ...p, totalWins: (p.totalWins || 0) + 1, biggestWin: Math.max((p.biggestWin || 0), winAmount) }));'
)

# Hook into the crash event to track losses
code = re.sub(
    r'if \(activeBetRef\.current\) \{\s*setActiveBet\(null\);\s*\}',
    'if (activeBetRef.current) { setUserStats(p => ({ ...p, totalLosses: (p.totalLosses || 0) + 1 })); setActiveBet(null); }',
    code
)

with open('src/pages/RocketGamePage.jsx', 'w') as f:
    f.write(code)

# --- 2. PATCH THE UI (UserStats.jsx) ---
with open('src/components/UserStats.jsx', 'r') as f:
    stat_code = f.read()

# Protect against undefined variables and fix the Divide by Zero crash
stat_code = stat_code.replace('value: stats.totalBets,', 'value: stats.totalBets || 0,')
stat_code = stat_code.replace('value: stats.totalWins,', 'value: stats.totalWins || 0,')
stat_code = stat_code.replace('value: stats.totalLosses,', 'value: stats.totalLosses || 0,')
stat_code = stat_code.replace('value: `${stats.winRate}%`,', 'value: `${stats.totalBets > 0 ? Math.round(((stats.totalWins || 0) / stats.totalBets) * 100) : 0}%`,')
stat_code = stat_code.replace('stats.biggestWin.toLocaleString()', '(stats.biggestWin || 0).toLocaleString()')
stat_code = stat_code.replace('stats.totalWagered.toLocaleString()', '(stats.totalWagered || 0).toLocaleString()')

with open('src/components/UserStats.jsx', 'w') as f:
    f.write(stat_code)

print("Stats fixed and LocalStorage injected!")
