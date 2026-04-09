import re

# --- 1. PATCH THE BRAIN (RocketGamePage) ---
with open('src/pages/RocketGamePage.jsx', 'r') as f:
    code = f.read()

# Stop the CashOut function from causing re-renders
old_cashout_regex = r'const handleCashOut = useCallback\(\(multiplier = currentMultiplier\) => \{[\s\S]*?setActiveBet\(null\);\s*\}, \[activeBet, currentMultiplier\]\);'

new_cashout = """const activeBetRef = useRef(activeBet);
  useEffect(() => { activeBetRef.current = activeBet; }, [activeBet]);

  const handleCashOut = useCallback((overrideMultiplier) => {
    const multiplier = typeof overrideMultiplier === 'number' ? overrideMultiplier : multiplierRef.current;
    const currentActiveBet = activeBetRef.current;
    
    if (!currentActiveBet) return;

    const winAmount = currentActiveBet.betAmount * multiplier;
    setBalance((prev) => prev + winAmount);

    const newChatMessage = {
      id: Date.now(),
      username: "You",
      text: `Cashed out at ${multiplier.toFixed(2)}x for ${winAmount.toFixed(2)} XRS! 💰`,
      timestamp: new Date(),
      type: "win",
    };
    setChatMessages((prev) => [...prev, newChatMessage]);

    setActiveBet(null);
  }, []);"""

code = re.sub(old_cashout_regex, new_cashout, code)

# Route the socket logic through our safe reference
code = code.replace('if (activeBet?.autoCashout && val >= activeBet.autoCashout)', 'if (activeBetRef.current?.autoCashout && val >= activeBetRef.current.autoCashout)')
code = re.sub(r'if \(activeBet\) \{\s*setActiveBet\(null\);\s*\}', 'if (activeBetRef.current) { setActiveBet(null); }', code)

# Kill the Infinite Reconnect Loop
code = code.replace('}, [activeBet, handleCashOut, fetchGameHistory, fetchLeaderboard]);', '}, [fetchGameHistory, fetchLeaderboard]);')

# Pass the live multiplier to the Betting Panel
code = code.replace('activeBet={activeBet}', 'activeBet={activeBet} currentMultiplier={currentMultiplier}')

with open('src/pages/RocketGamePage.jsx', 'w') as f:
    f.write(code)

# --- 2. PATCH THE UI (BettingPanel) ---
with open('src/components/BettingPanel.jsx', 'r') as f:
    bp_code = f.read()

# Receive the live multiplier prop
bp_code = bp_code.replace('const BettingPanel = ({ balance, gameState, onPlaceBet, onCashOut, activeBet }) => {', 'const BettingPanel = ({ balance, gameState, onPlaceBet, onCashOut, activeBet, currentMultiplier }) => {')

# Hook the multiplier up to the button and stats text
bp_code = bp_code.replace('CASH OUT {(activeBet.betAmount * activeBet.currentMultiplier).toFixed(2)}', 'CASH OUT {(activeBet.betAmount * (currentMultiplier || 1)).toFixed(2)}')
bp_code = bp_code.replace('{(activeBet.betAmount * activeBet.currentMultiplier).toFixed(2)}', '{(activeBet.betAmount * (currentMultiplier || 1)).toFixed(2)}')
bp_code = bp_code.replace('{activeBet.currentMultiplier.toFixed(2)}x', '{(currentMultiplier || 1).toFixed(2)}x')

with open('src/components/BettingPanel.jsx', 'w') as f:
    f.write(bp_code)

print("Cash out button and socket loop fixed!")
