"""
Socket.IO Game Loop Tests for Xeris.Pump Crash Game
Tests real-time game events including:
- Connection to Socket.IO server
- Game state events
- Multiplier updates
- Game crash events
"""

import socketio
import time
import os
import sys

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL environment variable is required")

# Track received events
events_received = {
    'game_state': [],
    'multiplier_update': [],
    'countdown': [],
    'new_game': [],
    'game_crashed': [],
    'game_starting': [],
    'live_bets': []
}

# Create Socket.IO client
sio = socketio.Client(logger=False, engineio_logger=False)

@sio.event
def connect():
    print("✓ Connected to Socket.IO server")

@sio.event
def disconnect():
    print("✓ Disconnected from Socket.IO server")

@sio.event
def game_state(data):
    events_received['game_state'].append(data)
    state = data.get('state', data.get('status', 'unknown'))
    multiplier = data.get('multiplier', 'N/A')
    print(f"  → game_state: state={state}, multiplier={multiplier}")

@sio.event
def multiplier_update(data):
    events_received['multiplier_update'].append(data)
    if len(events_received['multiplier_update']) <= 5:  # Only print first 5
        print(f"  → multiplier_update: {data.get('multiplier', 'N/A')}")

@sio.event
def countdown(data):
    events_received['countdown'].append(data)
    print(f"  → countdown: {data.get('seconds', 'N/A')} seconds")

@sio.event
def new_game(data):
    events_received['new_game'].append(data)
    print(f"  → new_game: game_id={data.get('game_id', 'N/A')[:8]}...")

@sio.event
def game_crashed(data):
    events_received['game_crashed'].append(data)
    print(f"  → game_crashed: crash_point={data.get('crash_point', 'N/A')}")

@sio.event
def game_starting(data):
    events_received['game_starting'].append(data)
    print(f"  → game_starting")

@sio.event
def live_bets(data):
    events_received['live_bets'].append(data)
    if len(events_received['live_bets']) <= 2:  # Only print first 2
        print(f"  → live_bets: {len(data.get('bets', []))} active bets")

def test_socketio_connection():
    """Test Socket.IO connection and event reception"""
    print(f"\n{'='*60}")
    print("Socket.IO Game Loop Test")
    print(f"{'='*60}")
    print(f"Connecting to: {BASE_URL}")
    
    try:
        # Connect to Socket.IO server
        sio.connect(BASE_URL, transports=['websocket', 'polling'])
        
        # Wait for events (15 seconds should capture at least one game cycle)
        print("\nListening for events (15 seconds)...")
        time.sleep(15)
        
        # Disconnect
        sio.disconnect()
        
        # Print summary
        print(f"\n{'='*60}")
        print("Event Summary:")
        print(f"{'='*60}")
        
        for event_name, events in events_received.items():
            count = len(events)
            status = "✓" if count > 0 else "✗"
            print(f"  {status} {event_name}: {count} events received")
        
        # Verify critical events were received
        print(f"\n{'='*60}")
        print("Test Results:")
        print(f"{'='*60}")
        
        tests_passed = 0
        tests_total = 4
        
        # Test 1: game_state events
        if len(events_received['game_state']) > 0:
            print("✓ PASS: game_state events received")
            tests_passed += 1
        else:
            print("✗ FAIL: No game_state events received")
        
        # Test 2: multiplier_update events
        if len(events_received['multiplier_update']) > 0:
            print("✓ PASS: multiplier_update events received")
            tests_passed += 1
        else:
            print("✗ FAIL: No multiplier_update events received")
        
        # Test 3: Either countdown or game_crashed (depends on game phase)
        if len(events_received['countdown']) > 0 or len(events_received['game_crashed']) > 0:
            print("✓ PASS: Game cycle events received (countdown or crash)")
            tests_passed += 1
        else:
            print("✗ FAIL: No game cycle events received")
        
        # Test 4: Verify multiplier values are valid
        if len(events_received['multiplier_update']) > 0:
            multipliers = [e.get('multiplier', 0) for e in events_received['multiplier_update']]
            if all(m >= 1.0 for m in multipliers):
                print("✓ PASS: All multiplier values >= 1.0")
                tests_passed += 1
            else:
                print(f"✗ FAIL: Invalid multiplier values found: {[m for m in multipliers if m < 1.0]}")
        else:
            print("✗ FAIL: Cannot verify multipliers (no events)")
        
        print(f"\n{'='*60}")
        print(f"Socket.IO Tests: {tests_passed}/{tests_total} passed")
        print(f"{'='*60}")
        
        return tests_passed == tests_total
        
    except Exception as e:
        print(f"✗ ERROR: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_socketio_connection()
    sys.exit(0 if success else 1)
