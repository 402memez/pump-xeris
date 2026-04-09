import re

# --- 1. Fix the Canvas Memory Teardown Bug ---
with open('src/components/RocketGame.jsx', 'r') as f:
    rg = f.read()

# Inject mutable refs so the canvas can read live data without restarting
refs_code = """  const animationRef = useRef(null);
  const lastMultiplierRef = useRef(1.0);

  // PERFORMANCE FIX: Mutable refs to prevent canvas teardown
  const currentMultiplierRef = useRef(currentMultiplier);
  const rocketPositionRef = useRef(rocketPosition);
  
  useEffect(() => {
    currentMultiplierRef.current = currentMultiplier;
    rocketPositionRef.current = rocketPosition;
  }, [currentMultiplier, rocketPosition]);"""
  
rg = rg.replace('  const animationRef = useRef(null);\n  const lastMultiplierRef = useRef(1.0);', refs_code)

# Point the canvas variables to the new memory refs
rg = rg.replace('currentMultiplier / 15', 'currentMultiplierRef.current / 15')
rg = rg.replace('rocketPosition.x', 'rocketPositionRef.current.x')
rg = rg.replace('rocketPosition.y', 'rocketPositionRef.current.y')

# Remove the rapidly changing variables from the dependency array so it stops rebooting
rg = rg.replace('}, [gameState, rocketPosition, currentMultiplier]);', '}, [gameState]);')

with open('src/components/RocketGame.jsx', 'w') as f:
    f.write(rg)

# --- 2. Fix the Visual Interpolation Stutter ---
with open('src/pages/RocketGamePage.jsx', 'r') as f:
    page = f.read()

# Smooth the lerp factor to perfectly glide between the 100ms server ticks
page = page.replace('const newValue = current + (target - current) * 0.4;', 'const newValue = current + (target - current) * 0.15;')

with open('src/pages/RocketGamePage.jsx', 'w') as f:
    f.write(page)

print("Memory garbage collection spikes and interpolation stutter fixed!")
