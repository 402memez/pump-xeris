#!/bin/bash
echo "🚀 Booting Xeris Oracle..."
node backend/oracle.js &

echo "🚀 Booting Python Game Server..."
python3 backend/server.py
