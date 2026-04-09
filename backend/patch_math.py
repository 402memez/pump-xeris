with open('server.py', 'r') as f:
    code = f.read()

old_math = """    def generate_crash_point(self, server_seed: str, game_id: str) -> float:
        h = hmac.new(server_seed.encode(), game_id.encode(), hashlib.sha256)
        hash_hex = h.hexdigest()
        hash_int = int(hash_hex[:13], 16)
        house_edge = 0.04
        e = 2 ** 52
        result = (100 * e - hash_int) / (e - hash_int)
        crash_point = max(1.0, result * (1 - house_edge))
        return round(crash_point, 2)"""

new_math = """    def generate_crash_point(self, server_seed: str, game_id: str) -> float:
        h = hmac.new(server_seed.encode(), game_id.encode(), hashlib.sha256)
        hash_hex = h.hexdigest()
        hash_int = int(hash_hex[:13], 16)
        e = 2 ** 52
        
        # 4% House Edge: 1 in 25 games instantly crash at 1.00x
        if hash_int % 25 == 0:
            return 1.00
            
        # Standard provably fair crash math
        crash_point = max(1.0, e / (e - hash_int))
        return round(crash_point, 2)"""

if old_math in code:
    code = code.replace(old_math, new_math)
    with open('server.py', 'w') as f:
        f.write(code)
    print("Backend math successfully patched!")
else:
    print("Could not find the exact old math. Let me know if this prints!")
