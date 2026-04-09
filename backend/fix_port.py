import re

with open('server.py', 'r') as f:
    code = f.read()

# This replaces the hardcoded port with a flexible one from the command line
if 'import sys' not in code:
    code = "import sys\n" + code

port_fix = """
if __name__ == "__main__":
    port = 8000
    if "--port" in sys.argv:
        port = int(sys.argv[sys.argv.index("--port") + 1])
    
    print(f"🚀 Starting Game Server on port {port}")
    # Update your server run command below (e.g., socketio.run or app.run)
    # socketio.run(app, host='0.0.0.0', port=port)
"""

print("Patching server.py to handle the Railway port...")
# Note: You may need to manually update your 'if __name__ == "__main__":' 
# block in server.py to use this 'port' variable.
