from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import socketio
import os
import logging
import hashlib
import hmac
import random
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timedelta
from bson import ObjectId
import urllib.request
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'crash_game')]

# Create Socket.IO server
sio = socketio.AsyncServer(cors_allowed_origins="*", async_mode='asgi', logger=True, engineio_logger=True)

# Create the main FastAPI app
app = FastAPI(title="Rocket Crash Game API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class WalletCreate(BaseModel):
    pass

class WalletResponse(BaseModel):
    wallet_address: str
    balance: float
    created_at: datetime

class PlaceBetRequest(BaseModel):
    wallet_address: str
    amount: float
    auto_cashout: Optional[float] = None

class CashOutRequest(BaseModel):
    wallet_address: str
    game_id: str

class GameHistoryItem(BaseModel):
    game_id: str
    crash_point: float
    server_seed_hash: str
    timestamp: datetime

# ============== GAME ENGINE ==============

class CrashGameEngine:
    def __init__(self):
        self.current_game_id: Optional[str] = None
        self.server_seed: Optional[str] = None
        self.server_seed_hash: Optional[str] = None
        self.crash_point: Optional[float] = None
        self.game_state: str = "waiting"
        self.current_multiplier: float = 1.0
        self.start_time: Optional[datetime] = None
        self.active_bets: Dict[str, dict] = {}
        self.cashed_out: Dict[str, dict] = {}
        self.countdown: int = 10

    def generate_crash_point(self, server_seed: str, game_id: str) -> float:
        h = hmac.new(server_seed.encode(), game_id.encode(), hashlib.sha256)
        hash_hex = h.hexdigest()
        hash_int = int(hash_hex[:13], 16)
        house_edge = 0.04
        e = 2 ** 52
        result = (100 * e - hash_int) / (e - hash_int)
        crash_point = max(1.0, result * (1 - house_edge))
        return round(crash_point, 2)

    def new_game(self) -> dict:
        self.current_game_id = str(uuid.uuid4())
        self.server_seed = hashlib.sha256(os.urandom(32)).hexdigest()
        self.server_seed_hash = hashlib.sha256(self.server_seed.encode()).hexdigest()
        self.crash_point = self.generate_crash_point(self.server_seed, self.current_game_id)
        self.game_state = "waiting"
        self.current_multiplier = 1.0
        self.start_time = None
        self.active_bets = {}
        self.cashed_out = {}
        self.countdown = 10
        logger.info(f"New game: {self.current_game_id}, Crash point: {self.crash_point}")
        return {
            "game_id": self.current_game_id,
            "server_seed_hash": self.server_seed_hash,
            "state": self.game_state
        }

    def calculate_multiplier(self, elapsed_ms: int) -> float:
        import math
        multiplier = math.exp(0.00006 * elapsed_ms)
        return round(multiplier, 2)

    def place_bet(self, wallet_address: str, amount: float, auto_cashout: Optional[float] = None) -> bool:
        if self.game_state != "waiting":
            return False
        self.active_bets[wallet_address] = {
            "amount": amount,
            "auto_cashout": auto_cashout,
            "placed_at": datetime.utcnow()
        }
        return True

    def cash_out(self, wallet_address: str) -> Optional[dict]:
        if self.game_state != "running":
            return None
        if wallet_address not in self.active_bets:
            return None
        if wallet_address in self.cashed_out:
            return None
        bet = self.active_bets[wallet_address]
        winnings = bet["amount"] * self.current_multiplier
        self.cashed_out[wallet_address] = {
            "multiplier": self.current_multiplier,
            "winnings": round(winnings, 2),
            "cashed_at": datetime.utcnow()
        }
        return self.cashed_out[wallet_address]

    def get_state(self) -> dict:
        return {
            "game_id": self.current_game_id,
            "state": self.game_state,
            "multiplier": self.current_multiplier,
            "server_seed_hash": self.server_seed_hash,
            "countdown": self.countdown,
            "active_bets": [
                {
                    "wallet": addr[:8] + "..." + addr[-4:],
                    "amount": bet["amount"],
                    "cashed_out": addr in self.cashed_out,
                    "cashout_multiplier": self.cashed_out.get(addr, {}).get("multiplier")
                }
                for addr, bet in self.active_bets.items()
            ]
        }

game_engine = CrashGameEngine()

# ============== SOCKET.IO EVENTS ==============

@sio.event
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")
    await sio.emit('game_state', game_engine.get_state(), room=sid)

@sio.event
async def disconnect(sid):
    logger.info(f"Client disconnected: {sid}")

@sio.event
async def place_bet(sid, data):
    wallet_address = data.get('wallet_address')
    amount = data.get('amount', 0)
    auto_cashout = data.get('auto_cashout')

    if not wallet_address or amount <= 0:
        await sio.emit('bet_error', {'error': 'Invalid bet'}, room=sid)
        return

    wallet = await db.wallets.find_one({"address": wallet_address})
    if not wallet or wallet['balance'] < amount:
        await sio.emit('bet_error', {'error': 'Insufficient balance'}, room=sid)
        return

    await db.wallets.update_one(
        {"address": wallet_address},
        {"$inc": {"balance": -amount}}
    )

    success = game_engine.place_bet(wallet_address, amount, auto_cashout)
    if success:
        await db.bets.insert_one({
            "game_id": game_engine.current_game_id,
            "wallet_address": wallet_address,
            "amount": amount,
            "auto_cashout": auto_cashout,
            "status": "active",
            "placed_at": datetime.utcnow()
        })
        await sio.emit('bet_placed', {
            'wallet_address': wallet_address,
            'amount': amount,
            'auto_cashout': auto_cashout
        })
        await sio.emit('game_state', game_engine.get_state())
    else:
        await db.wallets.update_one(
            {"address": wallet_address},
            {"$inc": {"balance": amount}}
        )
        await sio.emit('bet_error', {'error': 'Cannot place bet now'}, room=sid)

@sio.event
async def cash_out(sid, data):
    wallet_address = data.get('wallet_address')
    if not wallet_address:
        await sio.emit('cashout_error', {'error': 'Invalid request'}, room=sid)
        return

    result = game_engine.cash_out(wallet_address)
    if result:
        await db.wallets.update_one(
            {"address": wallet_address},
            {"$inc": {"balance": result['winnings']}}
        )
        await db.bets.update_one(
            {"game_id": game_engine.current_game_id, "wallet_address": wallet_address},
            {"$set": {
                "status": "won",
                "cashout_multiplier": result['multiplier'],
                "winnings": result['winnings']
            }}
        )
        await sio.emit('cashed_out', {
            'wallet_address': wallet_address,
            'multiplier': result['multiplier'],
            'winnings': result['winnings']
        })
        await sio.emit('game_state', game_engine.get_state())
    else:
        await sio.emit('cashout_error', {'error': 'Cannot cash out'}, room=sid)

@sio.event
async def send_message(sid, data):
    """Handle chat messages from clients"""
    username = data.get('username', 'Anonymous')
    text = data.get('text', '')
    
    if not text.strip():
        return
    
    # Broadcast message to all connected clients
    message = {
        'username': username,
        'text': text,
        'timestamp': data.get('timestamp', datetime.utcnow().isoformat()),
        'type': data.get('type', 'chat')
    }
    
    # Store chat message in database (optional)
    await db.chat_messages.insert_one({
        **message,
        'created_at': datetime.utcnow()
    })
    
    # Broadcast to all clients
    await sio.emit('chat_message', message)

# ============== GAME LOOP ==============

async def game_loop():
    await asyncio.sleep(3)
    while True:
        try:
            game_engine.new_game()
            await sio.emit('new_game', game_engine.get_state())

            game_engine.game_state = "waiting"
            for i in range(10, 0, -1):
                game_engine.countdown = i
                await sio.emit('countdown', {'seconds': i})
                await sio.emit('game_state', game_engine.get_state())
                await asyncio.sleep(1)

            game_engine.game_state = "starting"
            await sio.emit('game_starting', game_engine.get_state())
            await asyncio.sleep(1)

            game_engine.game_state = "running"
            game_engine.start_time = datetime.utcnow()

            while game_engine.current_multiplier < game_engine.crash_point:
                elapsed = (datetime.utcnow() - game_engine.start_time).total_seconds() * 1000
                game_engine.current_multiplier = game_engine.calculate_multiplier(int(elapsed))

                for wallet_address, bet in list(game_engine.active_bets.items()):
                    if wallet_address not in game_engine.cashed_out:
                        if bet.get('auto_cashout') and game_engine.current_multiplier >= bet['auto_cashout']:
                            result = game_engine.cash_out(wallet_address)
                            if result:
                                await db.wallets.update_one(
                                    {"address": wallet_address},
                                    {"$inc": {"balance": result['winnings']}}
                                )
                                await db.bets.update_one(
                                    {"game_id": game_engine.current_game_id, "wallet_address": wallet_address},
                                    {"$set": {
                                        "status": "cashed_out",
                                        "cashout_multiplier": result['multiplier'],
                                        "winnings": result['winnings']
                                    }}
                                )
                                await sio.emit('auto_cashed_out', {
                                    'wallet_address': wallet_address,
                                    'multiplier': result['multiplier'],
                                    'winnings': result['winnings']
                                })

                await sio.emit('multiplier_update', {
                    'multiplier': game_engine.current_multiplier,
                    'game_id': game_engine.current_game_id
                })
                await sio.emit('game_state', game_engine.get_state())
                
                # Broadcast live bets
                live_bets = [
                    {
                        'wallet': addr[:8] + '...' + addr[-4:],
                        'amount': bet['amount'],
                        'auto_cashout': bet.get('auto_cashout'),
                        'current_multiplier': game_engine.current_multiplier,
                        'potential_win': bet['amount'] * game_engine.current_multiplier
                    }
                    for addr, bet in game_engine.active_bets.items()
                    if addr not in game_engine.cashed_out
                ]
                await sio.emit('live_bets', {'bets': live_bets})
                
                await asyncio.sleep(0.05)

            game_engine.game_state = "crashed"
            game_engine.current_multiplier = game_engine.crash_point

            for wallet_address in game_engine.active_bets:
                if wallet_address not in game_engine.cashed_out:
                    await db.bets.update_one(
                        {"game_id": game_engine.current_game_id, "wallet_address": wallet_address},
                        {"$set": {"status": "lost"}}
                    )

            await db.game_history.insert_one({
                "game_id": game_engine.current_game_id,
                "crash_point": game_engine.crash_point,
                "server_seed": game_engine.server_seed,
                "server_seed_hash": game_engine.server_seed_hash,
                "total_bets": len(game_engine.active_bets),
                "total_cashed_out": len(game_engine.cashed_out),
                "created_at": datetime.utcnow()
            })

            await sio.emit('game_crashed', {
                'crash_point': game_engine.crash_point,
                'server_seed': game_engine.server_seed,
                'game_id': game_engine.current_game_id
            })
            await sio.emit('game_state', {'status': 'crashed'})
            await asyncio.sleep(5)

        except Exception as e:
            logger.error(f"Game loop error: {e}")
            await asyncio.sleep(5)

# ============== REST API ENDPOINTS ==============

@api_router.get("/")
async def root():
    return {"message": "Rocket Crash Game API", "version": "1.0.0"}

@api_router.post("/wallet/create", response_model=WalletResponse)
async def create_wallet():
    wallet_address = "0x" + hashlib.sha256(os.urandom(32)).hexdigest()[:40]
    wallet_doc = {
        "address": wallet_address,
        "balance": 1000.0,
        "created_at": datetime.utcnow()
    }
    await db.wallets.insert_one(wallet_doc)
    return WalletResponse(
        wallet_address=wallet_address,
        balance=1000.0,
        created_at=wallet_doc["created_at"]
    )

@api_router.get("/wallet/{address}")
async def get_wallet(address: str):
    wallet = await db.wallets.find_one({"address": address})
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    return {
        "wallet_address": wallet["address"],
        "balance": wallet["balance"],
        "created_at": wallet["created_at"]
    }

@api_router.get("/game/state")
async def get_game_state():
    return game_engine.get_state()

@api_router.get("/game/history")
async def get_game_history(limit: int = 20):
    """Get recent game history"""
    history = await db.game_history.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return {
        "history": [
            {
                "id": h.get("game_id", str(h.get("_id", ""))),
                "multiplier": h["crash_point"],
                "timestamp": h["created_at"].isoformat() if isinstance(h["created_at"], datetime) else h["created_at"],
                "crashed": True
            }
            for h in history
        ]
    }

@api_router.get("/bets/{wallet_address}")
async def get_user_bets(wallet_address: str, limit: int = 50):
    bets = await db.bets.find({"wallet_address": wallet_address}).sort("placed_at", -1).limit(limit).to_list(limit)
    return [
        {
            "game_id": b["game_id"],
            "amount": b["amount"],
            "status": b["status"],
            "cashout_multiplier": b.get("cashout_multiplier"),
            "winnings": b.get("winnings"),
            "placed_at": b["placed_at"]
        }
        for b in bets
    ]

@api_router.get("/leaderboard")
async def get_leaderboard(limit: int = 10):
    """Get top players by total winnings"""
    pipeline = [
        {
            "$match": {"status": "won"}
        },
        {
            "$group": {
                "_id": "$wallet_address",
                "total_won": {"$sum": "$winnings"},
                "total_wagered": {"$sum": "$amount"},
                "games_played": {"$sum": 1},
                "biggest_win": {"$max": {"$multiply": ["$amount", "$cashout_multiplier"]}}
            }
        },
        {
            "$sort": {"total_won": -1}
        },
        {
            "$limit": limit
        }
    ]
    
    leaderboard = await db.bets.aggregate(pipeline).to_list(limit)
    
    return {
        "leaderboard": [
            {
                "rank": idx + 1,
                "username": lb["_id"][:8] + "..." + lb["_id"][-4:],
                "totalWon": round(lb["total_won"], 2),
                "totalWagered": round(lb["total_wagered"], 2),
                "winRate": round((lb["total_won"] / lb["total_wagered"] * 100) if lb["total_wagered"] > 0 else 0, 1),
                "gamesPlayed": lb["games_played"],
                "biggestWin": round(lb["biggest_win"], 2)
            }
            for idx, lb in enumerate(leaderboard)
        ]
    }

@api_router.get("/user/stats/{wallet_address}")
async def get_user_stats(wallet_address: str):
    """Get user statistics"""
    pipeline = [
        {
            "$match": {"wallet_address": wallet_address}
        },
        {
            "$group": {
                "_id": None,
                "total_wagered": {"$sum": "$amount"},
                "total_won": {
                    "$sum": {
                        "$cond": [
                            {"$eq": ["$status", "won"]},
                            "$winnings",
                            0
                        ]
                    }
                },
                "games_played": {"$sum": 1},
                "biggest_win": {
                    "$max": {
                        "$cond": [
                            {"$eq": ["$status", "won"]},
                            {"$multiply": ["$amount", "$cashout_multiplier"]},
                            0
                        ]
                    }
                }
            }
        }
    ]
    
    result = await db.bets.aggregate(pipeline).to_list(1)
    
    if result:
        stats = result[0]
        return {
            "total_wagered": round(stats["total_wagered"], 2),
            "total_won": round(stats["total_won"], 2),
            "games_played": stats["games_played"],
            "biggest_win": round(stats.get("biggest_win", 0), 2)
        }
    
    return {
        "total_wagered": 0,
        "total_won": 0,
        "games_played": 0,
        "biggest_win": 0
    }

# --- NEW SECURE XERIS PROXY ROUTES ---

@api_router.get("/xeris/balance/{address}")
def get_xeris_balance(address: str):
    """Proxy balance fetch to bypass Mixed Content blocks"""
    url = "http://138.197.116.81:50008/"
    payload = {"jsonrpc": "2.0", "id": 1, "method": "getBalance", "params": [address]}
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode())
            if 'result' in result and 'value' in result['result']:
                return {"balance": result['result']['value'] / 1_000_000_000}
            return {"balance": 0.00}
    except Exception as e:
        logger.error(f"Xeris balance proxy error: {e}")
        return {"balance": 0.00, "error": str(e)}

@api_router.get("/xeris/faucet/{address}")
def request_xeris_faucet(address: str):
    """Proxy faucet request to bypass Mixed Content blocks"""
    # 10 XRS = 10,000,000,000 lamports
    url = f"http://138.197.116.81:56001/airdrop/{address}/10000000000"
    req = urllib.request.Request(url, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        logger.error(f"Xeris faucet proxy error: {e}")
        raise HTTPException(status_code=500, detail="Faucet request failed")

# ------------------------------------

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

socket_asgi_app = socketio.ASGIApp(sio, other_asgi_app=app, socketio_path='socket.io')

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(game_loop())
    logger.info("Game loop started")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(socket_asgi_app, host="0.0.0.0", port=8001)
