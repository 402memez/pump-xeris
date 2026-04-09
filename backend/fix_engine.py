with open('server.py', 'r') as f:
    code = f.read()

# 1. Update the Growth Curve to a snappier Casino standard
old_calc = """    def calculate_multiplier(self, elapsed_ms: int) -> float:
        import math
        multiplier = math.exp(0.00006 * elapsed_ms)
        return round(multiplier, 2)"""

new_calc = """    def calculate_multiplier(self, elapsed_ms: int) -> float:
        import math
        # Standard Casino Curve (0.00008) - Snappier takeoff, higher tension
        multiplier = math.exp(0.00008 * elapsed_ms)
        return round(multiplier, 2)"""

code = code.replace(old_calc, new_calc)

# 2. Decouple the Physics Engine from the Network Engine
old_loop = """                # ULTRA-OPTIMIZED: Only emit multiplier updates (30 FPS)
                # Remove all other emissions during game loop
                current_time = elapsed
                if current_time - last_multiplier_emit >= 33:
                    await sio.emit('multiplier_update', {
                        'multiplier': game_engine.current_multiplier,
                        'game_id': game_engine.current_game_id
                    })
                    last_multiplier_emit = current_time

                await asyncio.sleep(0.033)  # 33ms = 30 FPS (ultra smooth)"""

new_loop = """                # CASINO-OPTIMIZED: Network Tick Rate vs Physics Tick Rate
                current_time = elapsed
                
                # 1. NETWORK: Only broadcast 10 times a second to prevent choking the mobile browser
                if current_time - last_multiplier_emit >= 100:
                    await sio.emit('multiplier_update', {
                        'multiplier': game_engine.current_multiplier,
                        'game_id': game_engine.current_game_id
                    })
                    last_multiplier_emit = current_time

                # 2. PHYSICS: Engine sleeps for only 15ms to guarantee pixel-perfect auto-cashouts
                await asyncio.sleep(0.015)"""

code = code.replace(old_loop, new_loop)

with open('server.py', 'w') as f:
    f.write(code)
print("Engine successfully tuned!")
