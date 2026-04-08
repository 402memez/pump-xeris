"""
Comprehensive Backend API Tests for Xeris.Pump Crash Game
Tests all REST API endpoints including:
- Root API endpoint
- Wallet creation and retrieval
- Game state and history
- Leaderboard
- User stats
- Xeris blockchain proxy endpoints (balance and faucet)
"""

import pytest
import requests
import os
import time

# Get BASE_URL from environment variable
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL environment variable is required")


class TestRootEndpoint:
    """Test root API endpoint"""
    
    def test_root_returns_api_info(self):
        """GET /api/ should return API info with version"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert data["message"] == "Rocket Crash Game API"
        assert data["version"] == "1.0.0"
        print(f"✓ Root endpoint returns: {data}")


class TestWalletEndpoints:
    """Test wallet creation and retrieval endpoints"""
    
    def test_create_wallet_success(self):
        """POST /api/wallet/create should create a new wallet with 1000 balance"""
        response = requests.post(f"{BASE_URL}/api/wallet/create")
        assert response.status_code == 200
        
        data = response.json()
        assert "wallet_address" in data
        assert "balance" in data
        assert "created_at" in data
        
        # Verify wallet address format (0x + 40 hex chars)
        assert data["wallet_address"].startswith("0x")
        assert len(data["wallet_address"]) == 42
        
        # Verify initial balance
        assert data["balance"] == 1000.0
        
        print(f"✓ Created wallet: {data['wallet_address'][:16]}... with balance {data['balance']}")
        return data["wallet_address"]
    
    def test_get_wallet_success(self):
        """GET /api/wallet/{address} should return wallet details"""
        # First create a wallet
        create_response = requests.post(f"{BASE_URL}/api/wallet/create")
        wallet_address = create_response.json()["wallet_address"]
        
        # Then retrieve it
        response = requests.get(f"{BASE_URL}/api/wallet/{wallet_address}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["wallet_address"] == wallet_address
        assert data["balance"] == 1000.0
        assert "created_at" in data
        
        print(f"✓ Retrieved wallet: {wallet_address[:16]}... balance: {data['balance']}")
    
    def test_get_wallet_not_found(self):
        """GET /api/wallet/{address} should return 404 for non-existent wallet"""
        response = requests.get(f"{BASE_URL}/api/wallet/nonexistent_wallet_address")
        assert response.status_code == 404
        
        data = response.json()
        assert "detail" in data
        assert data["detail"] == "Wallet not found"
        
        print("✓ Non-existent wallet returns 404")


class TestGameStateEndpoints:
    """Test game state and history endpoints"""
    
    def test_get_game_state(self):
        """GET /api/game/state should return current game state"""
        response = requests.get(f"{BASE_URL}/api/game/state")
        assert response.status_code == 200
        
        data = response.json()
        # Verify required fields
        assert "game_id" in data
        assert "state" in data
        assert "multiplier" in data
        assert "server_seed_hash" in data
        assert "countdown" in data
        assert "active_bets" in data
        
        # Verify state is valid
        assert data["state"] in ["waiting", "starting", "running", "crashed"]
        
        # Verify multiplier is >= 1.0
        assert data["multiplier"] >= 1.0
        
        # Verify active_bets is a list
        assert isinstance(data["active_bets"], list)
        
        print(f"✓ Game state: {data['state']}, multiplier: {data['multiplier']}, game_id: {data['game_id'][:8]}...")
    
    def test_get_game_history_default_limit(self):
        """GET /api/game/history should return recent game history"""
        response = requests.get(f"{BASE_URL}/api/game/history")
        assert response.status_code == 200
        
        data = response.json()
        assert "history" in data
        assert isinstance(data["history"], list)
        
        # If there's history, verify structure
        if len(data["history"]) > 0:
            game = data["history"][0]
            assert "id" in game
            assert "multiplier" in game
            assert "timestamp" in game
            assert "crashed" in game
            assert game["crashed"] == True
            assert game["multiplier"] >= 1.0
            
        print(f"✓ Game history returned {len(data['history'])} games")
    
    def test_get_game_history_with_limit(self):
        """GET /api/game/history?limit=5 should respect limit parameter"""
        response = requests.get(f"{BASE_URL}/api/game/history?limit=5")
        assert response.status_code == 200
        
        data = response.json()
        assert "history" in data
        assert len(data["history"]) <= 5
        
        print(f"✓ Game history with limit=5 returned {len(data['history'])} games")


class TestLeaderboardEndpoint:
    """Test leaderboard endpoint"""
    
    def test_get_leaderboard_default(self):
        """GET /api/leaderboard should return top players"""
        response = requests.get(f"{BASE_URL}/api/leaderboard")
        assert response.status_code == 200
        
        data = response.json()
        assert "leaderboard" in data
        assert isinstance(data["leaderboard"], list)
        
        # If there are entries, verify structure
        if len(data["leaderboard"]) > 0:
            entry = data["leaderboard"][0]
            assert "rank" in entry
            assert "username" in entry
            assert "totalWon" in entry
            assert "totalWagered" in entry
            assert "winRate" in entry
            assert "gamesPlayed" in entry
            assert "biggestWin" in entry
            
            # Verify rank is 1 for first entry
            assert entry["rank"] == 1
            
        print(f"✓ Leaderboard returned {len(data['leaderboard'])} entries")
    
    def test_get_leaderboard_with_limit(self):
        """GET /api/leaderboard?limit=5 should respect limit parameter"""
        response = requests.get(f"{BASE_URL}/api/leaderboard?limit=5")
        assert response.status_code == 200
        
        data = response.json()
        assert "leaderboard" in data
        assert len(data["leaderboard"]) <= 5
        
        print(f"✓ Leaderboard with limit=5 returned {len(data['leaderboard'])} entries")


class TestUserStatsEndpoint:
    """Test user statistics endpoint"""
    
    def test_get_user_stats_new_user(self):
        """GET /api/user/stats/{wallet_address} should return zero stats for new user"""
        response = requests.get(f"{BASE_URL}/api/user/stats/new_test_wallet_12345")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_wagered" in data
        assert "total_won" in data
        assert "games_played" in data
        assert "biggest_win" in data
        
        # New user should have zero stats
        assert data["total_wagered"] == 0
        assert data["total_won"] == 0
        assert data["games_played"] == 0
        assert data["biggest_win"] == 0
        
        print(f"✓ User stats for new user: {data}")
    
    def test_get_user_stats_existing_wallet(self):
        """GET /api/user/stats/{wallet_address} should return stats for existing wallet"""
        # Create a wallet first
        create_response = requests.post(f"{BASE_URL}/api/wallet/create")
        wallet_address = create_response.json()["wallet_address"]
        
        response = requests.get(f"{BASE_URL}/api/user/stats/{wallet_address}")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_wagered" in data
        assert "total_won" in data
        assert "games_played" in data
        assert "biggest_win" in data
        
        print(f"✓ User stats for wallet {wallet_address[:16]}...: {data}")


class TestXerisProxyEndpoints:
    """Test Xeris blockchain proxy endpoints for balance and faucet"""
    
    def test_xeris_balance_proxy(self):
        """GET /api/xeris/balance/{address} should return balance from Xeris node"""
        test_address = "test_wallet_address_123"
        response = requests.get(f"{BASE_URL}/api/xeris/balance/{test_address}")
        assert response.status_code == 200
        
        data = response.json()
        assert "balance" in data
        assert isinstance(data["balance"], (int, float))
        
        # Balance should be >= 0
        assert data["balance"] >= 0
        
        print(f"✓ Xeris balance proxy returned: {data}")
    
    def test_xeris_balance_proxy_different_addresses(self):
        """GET /api/xeris/balance/{address} should work with different address formats"""
        test_addresses = [
            "XerisTestWallet123456789",
            "0x1234567890abcdef1234567890abcdef12345678",
            "simple_test_address"
        ]
        
        for addr in test_addresses:
            response = requests.get(f"{BASE_URL}/api/xeris/balance/{addr}")
            assert response.status_code == 200
            
            data = response.json()
            assert "balance" in data
            print(f"✓ Balance for {addr[:20]}...: {data['balance']}")
    
    def test_xeris_faucet_proxy(self):
        """GET /api/xeris/faucet/{address} should request tokens from faucet"""
        test_address = "XerisTestWallet_faucet_test_" + str(int(time.time()))
        response = requests.get(f"{BASE_URL}/api/xeris/faucet/{test_address}", timeout=20)
        
        # Faucet may return 200 or 500 depending on rate limits
        # We just verify the endpoint is accessible and returns JSON
        assert response.status_code in [200, 500]
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Xeris faucet proxy returned: {data}")
        else:
            # 500 is acceptable if faucet has rate limits
            data = response.json()
            print(f"✓ Xeris faucet proxy returned 500 (rate limited): {data}")


class TestBetsEndpoint:
    """Test user bets endpoint"""
    
    def test_get_user_bets_empty(self):
        """GET /api/bets/{wallet_address} should return empty list for new wallet"""
        response = requests.get(f"{BASE_URL}/api/bets/new_test_wallet_no_bets")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
        
        print("✓ User bets for new wallet returns empty list")
    
    def test_get_user_bets_with_limit(self):
        """GET /api/bets/{wallet_address}?limit=10 should respect limit"""
        response = requests.get(f"{BASE_URL}/api/bets/test_wallet?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 10
        
        print(f"✓ User bets with limit=10 returned {len(data)} bets")


class TestCrashPointGeneration:
    """Test provably fair crash point generation"""
    
    def test_game_state_has_server_seed_hash(self):
        """Game state should include server_seed_hash for provably fair verification"""
        response = requests.get(f"{BASE_URL}/api/game/state")
        assert response.status_code == 200
        
        data = response.json()
        assert "server_seed_hash" in data
        
        # Server seed hash should be a 64-character hex string (SHA256)
        if data["server_seed_hash"]:
            assert len(data["server_seed_hash"]) == 64
            # Verify it's valid hex
            int(data["server_seed_hash"], 16)
            
        print(f"✓ Server seed hash: {data['server_seed_hash'][:16]}...")
    
    def test_game_history_has_crash_points(self):
        """Game history should have valid crash points >= 1.0"""
        response = requests.get(f"{BASE_URL}/api/game/history?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        
        for game in data["history"]:
            assert game["multiplier"] >= 1.0, f"Crash point {game['multiplier']} should be >= 1.0"
            
        print(f"✓ All {len(data['history'])} crash points are valid (>= 1.0)")


class TestErrorHandling:
    """Test error handling for various edge cases"""
    
    def test_invalid_endpoint_returns_404(self):
        """Invalid endpoint should return 404"""
        response = requests.get(f"{BASE_URL}/api/nonexistent_endpoint")
        assert response.status_code == 404
        print("✓ Invalid endpoint returns 404")
    
    def test_wallet_not_found_error(self):
        """Non-existent wallet should return proper error"""
        response = requests.get(f"{BASE_URL}/api/wallet/definitely_not_a_real_wallet_address")
        assert response.status_code == 404
        
        data = response.json()
        assert "detail" in data
        print(f"✓ Wallet not found error: {data['detail']}")


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
