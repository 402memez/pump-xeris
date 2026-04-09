#!/bin/bash
echo "🚀 Booting Xeris Oracle..."
node backend/oracle.js &

echo "🚀 Booting Python Game Server on Port $PORT..."
# We force the python server to use the port Railway gives us
python3 backend/server.py --port $PORT
