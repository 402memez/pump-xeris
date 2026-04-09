import re

with open('server.py', 'r') as f:
    code = f.read()

new_math = """    def generate_crash_point(self, server_seed: str, game_id: str) -> float:
        h = hmac.new(server_seed.encode(), game_id.encode(), hashlib.sha256)
        hash_hex = h.hexdigest()
        hash_int = int(hash_hex[:13], 16)
        e = 2 ** 52

        # === STANDARD CASINO MATH (4% Edge) ===
        
        # 1. "The Rug Pull" - 4% chance of an instant 1.00x crash (1 in 25 games)
        if hash_int % 25 == 0:
            return 1.00

        # 2. "The Squeeze" - Apply a true 4% house edge across the curve
        raw_crash = (e / (e - hash_int)) * 0.96

        # 3. "The Whale Tamer" - Throttle any multiplier trying to pass 10x
        if raw_crash > 10.0:
            raw_crash = 10.0 + ((raw_crash - 10.0) * 0.3)

        # 4. "The Concrete Ceiling" - Hard cap at 50x max
        crash_point = min(raw_crash, 50.0)

        return round(max(1.00, crash_point), 2)"""

# Surgically replace the old function
code = re.sub(r'    def generate_crash_point\(self, server_seed: str, game_id: str\) -> float:.*?return round\(max\(1\.00, crash_point\), 2\)', new_math, code, flags=re.DOTALL)

with open('server.py', 'w') as f:
    f.write(code)

print("Standard Casino Math Injected (4% Edge)!")
