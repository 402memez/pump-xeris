#!/bin/bash
echo "🚀 Booting Xeris Oracle..."
node oracle.js &

echo "🚀 Booting Python Game Server..."
python3 server.py
