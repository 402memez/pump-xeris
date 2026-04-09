# 1. Bulletproof the GameHistory UI variables
with open('src/components/GameHistory.jsx', 'r') as f:
    gh = f.read()

# Tell the UI to accept either 'multiplier' or 'crash_point' from the server
gh = gh.replace('game.multiplier', '(game.multiplier || game.crash_point || 1.0)')

with open('src/components/GameHistory.jsx', 'w') as f:
    f.write(gh)

# 2. Inject LocalStorage Memory into the main game page
with open('src/pages/RocketGamePage.jsx', 'r') as f:
    rg = f.read()

# Add the local storage loader
old_state = 'const [gameHistory, setGameHistory] = useState([]);'
new_state = '''const [gameHistory, setGameHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("xeris_history");
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  // Save to memory whenever history updates
  useEffect(() => {
    localStorage.setItem("xeris_history", JSON.stringify(gameHistory));
  }, [gameHistory]);'''

rg = rg.replace(old_state, new_state)

# Stop the backend from wiping the memory when Railway reboots
old_fetch = 'setGameHistory(data.history || []);'
new_fetch = '''if (data.history && data.history.length > 0) {
          setGameHistory(prev => {
            const merged = [...data.history, ...prev];
            // Filter duplicates to prevent weird glitching
            const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
            return unique.slice(0, 20);
          });
        }'''
        
rg = rg.replace(old_fetch, new_fetch)

with open('src/pages/RocketGamePage.jsx', 'w') as f:
    f.write(rg)
