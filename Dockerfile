# Use a pre-built image that has BOTH Python 3.11 and Node.js 20
FROM nikolaik/python-nodejs:python3.11-nodejs20

WORKDIR /app

# Copy your entire project into the container
COPY . .

# Install Python dependencies (Added python-dotenv!)
RUN pip install requests flask-socketio eventlet fastapi uvicorn python-dotenv

# Install Node.js dependencies for the Xeris Oracle
RUN cd backend && npm install xeris-sdk express

# Expose the Game port and Oracle port
EXPOSE 8000
EXPOSE 3000

# Run the boot script
CMD ["bash", "start.sh"]
