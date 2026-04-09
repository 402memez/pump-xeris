import re

with open('server.py', 'r') as f:
    code = f.read()

new_math = """    def generate_crash_point(self, server_seed: str, game_id: str) -> float:
        h = hmac.new(server_seed.encode(), game_id.encode(), hashlib.sha256)
        hash_hex = h.hexdigest()
        hash_int = int(hash_hex[:13], 16)
        e = 2 ** 52

        # === REAL CASINO RISK MANAGEMENT ===
        
        # 1. "The Rug Pull" - 5% chance (1 in 20) of an instant 1.00x crash.
        if hash_int % 20 == 0:
            return 1.00

        # 2. "The Squeeze" - Apply a 6% house edge across the entire curve.
        # This artificially chokes high multipliers.
        raw_crash = (e / (e - hash_int)) * 0.94

        # 3. "The Ceiling" - Hard cap at 500x to protect casino liquidity.
        crash_point = min(raw_crash, 500.0)

        # 4. Enforce the absolute floor
        crash_point = max(1.00, crash_point)

        return round(crash_point, 2)"""

# Surgically replace the old function with the new casino engine
code = re.sub(r'    def generate_crash_point.*?return round\(crash_point, 2\)', new_math, code, flags=re.DOTALL)

with open('server.py', 'w') as f:
    f.write(code)
print("Casino Math Injected!")
