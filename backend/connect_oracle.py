import re

with open('server.py', 'r') as f:
    code = f.read()

# Make sure requests is imported at the top
if 'import requests' not in code:
    code = "import requests\n" + code

payout_logic = """    async def handle_cashout(self, player_wallet: str):
        # ... your existing cashout math ...
        # Assume win_amount_xrs is calculated here
        
        # === TRIGGER ORACLE PAYOUT ===
        try:
            print(f"Triggering Oracle for {player_wallet} -> {win_amount_xrs} XRS")
            response = requests.post(
                "http://127.0.0.1:3000/payout",
                json={
                    "winner_address": player_wallet,
                    "amount_xrs": win_amount_xrs,
                    "secret": "SUPER_SECRET_ORACLE_KEY_2026"
                },
                timeout=5
            )
            
            if response.status_code == 200:
                print(f"Oracle Payout Success: {response.json().get('signature')}")
            else:
                print(f"Oracle Payout Error: {response.text}")
        except Exception as e:
            print(f"Oracle Connection Failed: {e}")
            
        # ... rest of your cashout code ..."""

# Note: Because your server.py logic is custom, you will need to manually 
# drop that exact requests.post() block into wherever your specific 
# 'cashout' function lives in the Python code.

print("Oracle connection code ready! You just need to paste the trigger into your cashout function.")
