import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { XerisDApp } from 'xeris-sdk';
import { Rocket, Coins, MessageSquare, Menu, X, RefreshCw, Download, Database, Settings, LogOut, Shield } from 'lucide-react';

const SOCKET_URL = process.env.REACT_APP_BACKEND_URL;
const HOUSE_WALLET = "8kRk2h36YmeTAM9kTn4BCSShVEBBUwCxh3ckATqGUveL";

const dapp = new XerisDApp();

export default function CrashGame() {
  const [multiplier, setMultiplier] = useState(1.00);
  const multiplierRef = useRef(1.00);
  const [gameState, setGameState] = useState('waiting'); 
  const [walletConnected, setWalletConnected] = useState(false);
  const [pubKey, setPubKey] = useState('');
  const [betAmount, setBetAmount] = useState(10);
  const [balance, setBalance] = useState(0.00);
  const [history, setHistory] = useState([]);
  const [hasBet, setHasBet] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [activeTab, setActiveTab] = useState('CRASH');
  const [autoEject, setAutoEject] = useState(2.00);

  // --- SECURE BACKEND FETCH ---
  const syncBalance = async () => {
    const currentKey = pubKey || (dapp.publicKey ? dapp.publicKey.toString() : '');
    if (!currentKey) return;

    try {
      setIsRefreshing(true);
      
      // Use SDK's built-in getBalance method
      const lamports = await dapp.getBalance(currentKey);
      const xrs = lamports / 1_000_000_000; // Convert lamports to XRS
      setBalance(xrs);
    } catch (err) {
      console.error("Balance fetch error:", err);
      // Fallback to backend proxy if SDK fails
      try {
        const response = await fetch(`${SOCKET_URL}/api/xeris/balance/${currentKey}`);
        if (response.ok) {
          const data = await response.json();
          if (data.balance !== undefined) {
            setBalance(data.balance);
          }
        }
      } catch (fallbackErr) {
        console.error("Fallback balance fetch failed:", fallbackErr);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const connectWallet = async () => {
    try {
      const provider = await XerisDApp.waitForProvider(3000);
      if (!provider) return;
      
      await dapp.connect();
      setWalletConnected(true);
      setPubKey(dapp.publicKey?.toString() || '');
      setTimeout(syncBalance, 500);
      
      dapp.on("accountChanged", async (newKey) => {
        setPubKey(newKey?.toString() || '');
        setTimeout(syncBalance, 200);
      });

      dapp.on("disconnect", () => {
        setWalletConnected(false);
        setPubKey('');
        setBalance(0.00);
      });
    } catch (err) {
      console.error("Connection failed:", err);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (dapp.disconnect) await dapp.disconnect();
      setWalletConnected(false);
      setPubKey('');
      setBalance(0.00);
      setIsMenuOpen(false); 
    } catch (err) {
      console.error("Disconnect failed:", err);
    }
  };

  const requestFaucet = async () => {
    if (!walletConnected) return;
    
    try {
      const currentKey = pubKey || (dapp.publicKey ? dapp.publicKey.toString() : '');
      
      // Request 10 XRS = 10,000,000,000 lamports
      const response = await fetch(`${SOCKET_URL}/api/xeris/faucet/${currentKey}`);
      
      if (!response.ok) {
        throw new Error(`Faucet request failed: HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      alert("✅ Airdrop successful! 10 XRS sent to your wallet.\nRefreshing balance in 5 seconds...");
      setTimeout(syncBalance, 5000); 
    } catch (err) {
      alert("Faucet Error:\n\n" + err.message);
    }
  };

  const handleSignMessage = async () => {
    if (!walletConnected) return alert("Connect wallet first!");
    try {
      const msg = `Authenticate to Xeris Crash\nTimestamp: ${new Date().toISOString()}`;
      const { signature } = await dapp.signMessage(msg);
      alert(`Message Signed Successfully!\nSignature: ${signature.substring(0, 20)}...`);
    } catch(err) { alert("Signing failed: " + err.message); }
  };

  const handleGetTokens = async () => {
    if (!walletConnected) return;
    try {
      const accounts = await dapp.getTokenAccounts();
      if(accounts && accounts.token_accounts) {
        alert(`Found ${accounts.token_accounts.length} custom tokens. Check console for details!`);
        console.log("Token Portfolio:", accounts);
      } else {
        alert("No custom tokens found.");
      }
    } catch(err) { alert("Fetch failed: " + err.message); }
  };

  useEffect(() => {
    connectWallet();
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    
    socket.on('multiplier_update', (data) => {
      const val = typeof data === 'object' ? data.multiplier : data;
      multiplierRef.current = val;
      setMultiplier(val);
      setGameState('running');
    });

    socket.on('game_state', (data) => {
      const status = typeof data === 'object' ? data.status : data;
      if (status === 'crashed' || status === 'crash') {
        setGameState('crashed');
        setHistory(prev => [multiplierRef.current, ...prev].slice(0, 5));
        setTimeout(() => {
          setMultiplier(1.00);
          multiplierRef.current = 1.00;
          setGameState('waiting');
          setHasBet(false);
          setCashedOut(false);
          setWinAmount(0);
          syncBalance();
        }, 3000);
      }
    });
    return () => socket.disconnect();
  }, [pubKey]);

  const handleAction = async () => {
    if (!walletConnected) {
      connectWallet();
      return;
    }
    if (gameState === 'waiting' && !hasBet) {
      if (balance >= betAmount) { 
        try {
          await dapp.transferXrs(HOUSE_WALLET, betAmount);
          setHasBet(true);
        } catch (err) {
          alert("Stake Failed: " + err.message);
        }
      } else {
        alert("Insufficient Balance!");
      }
    } else if (gameState === 'running' && hasBet && !cashedOut) {
      const win = betAmount * multiplierRef.current;
      setWinAmount(win);
      setCashedOut(true);
    }
  };

  const mockLedger = [
    { id: '0x8f...4ca', multi: 2.30, wager: 10, payout: 23.00, result: 'WIN' },
    { id: '0x1a...9b3', multi: 1.12, wager: 20, payout: 0.00, result: 'LOSS' },
    { id: '0x7c...2af', multi: 15.40, wager: 5, payout: 77.00, result: 'WIN' },
  ];

  const actionBtn = { backgroundColor: '#131823', border: 'none', color: '#94a3b8', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', minWidth: '44px' };
  const menuBtnStyle = { display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '16px 20px', backgroundColor: '#131823', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' };

  return (
    <div style={{ backgroundColor: '#070a13', minHeight: '100dvh', color: '#ffffff', fontFamily: 'system-ui, sans-serif', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', height: '100dvh', position: 'relative', overflow: 'hidden' }}>
        
        {isMenuOpen && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#070a13', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #131823' }}>
               <span style={{ fontSize: '20px', fontWeight: '900', fontStyle: 'italic' }}>SYSTEM MENU</span>
               <X size={28} color="#94a3b8" onClick={() => setIsMenuOpen(false)} style={{ cursor: 'pointer' }} />
            </div>
            <div style={{ padding: '24px', overflowY: 'auto' }}>
               <div style={{ backgroundColor: '#131823', padding: '20px', borderRadius: '20px', marginBottom: '24px' }}>
                 <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '10px' }}>Connected Wallet</p>
                 <div style={{ backgroundColor: '#070a13', padding: '12px', borderRadius: '12px', fontSize: '12px', color: '#3b82f6', wordBreak: 'break-all', marginBottom: '15px' }}>{pubKey || 'NOT CONNECTED'}</div>
                 
                 {walletConnected && (
                   <>
                     <button onClick={requestFaucet} style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid #22c55e', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px', cursor: 'pointer' }}>
                       <Download size={16} /> GET TESTNET XRS
                     </button>
                     <button onClick={disconnectWallet} style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                       <LogOut size={16} /> DISCONNECT WALLET
                     </button>
                   </>
                 )}
                 {!walletConnected && (
                   <button onClick={() => { setIsMenuOpen(false); connectWallet(); }} style={{ width: '100%', padding: '12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                     CONNECT WALLET
                   </button>
                 )}
               </div>
               <button onClick={() => { setIsMenuOpen(false); setShowChat(true); }} style={menuBtnStyle}><MessageSquare size={20} color="#3b82f6"/> Global Chat</button>
               <button onClick={() => alert("Under Construction")} style={menuBtnStyle}><Coins size={20} color="#3b82f6"/> Coinflip</button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Rocket size={28} color="#3b82f6" />
            <div style={{ fontWeight: 'bold', fontStyle: 'italic', fontSize: '20px' }}>XERIS <span style={{ color: '#3b82f6' }}>CRASH</span></div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div onClick={walletConnected ? syncBalance : connectWallet} style={{ backgroundColor: walletConnected ? '#2563eb' : 'rgba(239, 68, 68, 0.1)', border: walletConnected ? 'none' : '1px solid #ef4444', padding: '8px 16px', borderRadius: '10px', display: 'flex', gap: '6px', alignItems: 'center', cursor: 'pointer' }}>
              {walletConnected ? (
                <>
                  <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{balance.toFixed(2)}</span>
                  <span style={{ fontSize: '12px', color: '#bfdbfe', fontWeight: 'bold' }}>XRS</span>
                  <RefreshCw size={14} style={{ marginLeft: '4px', transform: isRefreshing ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s' }} />
                </>
              ) : (
                <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '12px', letterSpacing: '1px' }}>CONNECT</span>
              )}
            </div>
            <Menu size={28} onClick={() => setIsMenuOpen(true)} style={{ cursor: 'pointer', color: '#94a3b8' }} />
          </div>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid #131823', backgroundColor: '#070a13', flexShrink: 0 }}>
          {['CRASH', 'LEDGER', 'CONFIG'].map(tab => (
            <div key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, textAlign: 'center', padding: '12px 0', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', color: activeTab === tab ? '#3b82f6' : '#475569', borderBottom: activeTab === tab ? `2px solid #3b82f6` : '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}>
              {tab}
            </div>
          ))}
        </div>

        {activeTab === 'CRASH' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>
              {history.length === 0 ? (
                <div style={{ color: '#475569', fontSize: '12px', fontWeight: 'bold', fontStyle: 'italic', padding: '8px' }}>AWAITING LIVE DATA...</div>
              ) : (
                history.map((val, i) => (
                  <div key={i} style={{ padding: '8px 14px', backgroundColor: '#131823', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', color: val >= 2.0 ? '#3b82f6' : '#22c55e', flexShrink: 0 }}>{val.toFixed(2)}x</div>
                ))
              )}
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
              <div style={{ color: '#94a3b8', fontSize: '12px', letterSpacing: '2px' }}>CURRENT PAYOUT</div>
              <div style={{ fontSize: 'clamp(60px, 18vw, 84px)', fontWeight: '900', fontStyle: 'italic', color: gameState === 'crashed' ? '#ef4444' : '#fff' }}>{multiplier.toFixed(2)}x</div>
              {cashedOut && <div style={{ color: '#22c55e', fontWeight: 'bold', backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '5px 15px', borderRadius: '20px', marginTop: '10px' }}>+{winAmount.toFixed(2)} XRS</div>}
              <div style={{ marginTop: '30px', filter: 'drop-shadow(0 0 25px rgba(59, 130, 246, 0.6))', opacity: gameState === 'crashed' ? 0 : 1, transition: 'opacity 0.2s' }}>
                <Rocket size={48} color="#3b82f6" style={{ transform: 'rotate(45deg)' }} />
              </div>
            </div>

            <div style={{ backgroundColor: '#131823', padding: '24px', borderTopLeftRadius: '30px', borderTopRightRadius: '30px', paddingBottom: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 'bold' }}>Bet Amount</span>
                <span style={{ color: '#3b82f6', fontSize: '14px', fontWeight: 'bold' }}>Max: {balance.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#070a13', borderRadius: '20px', padding: '8px', marginBottom: '24px' }}>
                <div style={{ padding: '0 16px', color: '#3b82f6', fontWeight: '900', fontSize: '20px', fontStyle: 'italic' }}>X</div>
                <input type="number" inputMode="decimal" value={betAmount} onChange={e => setBetAmount(Number(e.target.value))} style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: '#fff', fontSize: '24px', fontWeight: 'bold', outline: 'none', minWidth: '0' }} />
                <div style={{ display: 'flex', gap: '8px', paddingRight: '8px' }}>
                  <button onClick={() => setBetAmount(p => Math.max(1, p/2))} style={actionBtn}>1/2</button>
                  <button onClick={() => setBetAmount(p => p*2)} style={actionBtn}>2x</button>
                </div>
              </div>
              <button onClick={handleAction} style={{ width: '100%', padding: '22px', borderRadius: '18px', backgroundColor: cashedOut ? '#22c55e' : (hasBet ? '#f59e0b' : '#2563eb'), color: '#fff', fontWeight: '900', fontSize: '20px', border: 'none', cursor: 'pointer' }}>
                {cashedOut ? 'CASHED OUT' : (hasBet ? 'CASH OUT' : 'PLACE BET')}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'LEDGER' && (
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '16px', fontWeight: 'bold', marginBottom: '20px' }}>
              <Database size={20} color="#3b82f6" /> Recent Transactions
            </div>
            <div style={{ backgroundColor: '#131823', borderRadius: '20px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '10px', fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>
                <span style={{ flex: 1 }}>TX HASH</span>
                <span style={{ width: '60px', textAlign: 'center' }}>CRASH</span>
                <span style={{ width: '80px', textAlign: 'right' }}>PAYOUT</span>
              </div>
              {mockLedger.map((tx, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', padding: '16px 0', fontSize: '14px', fontWeight: 'bold' }}>
                  <span style={{ flex: 1, color: '#64748b' }}>{tx.id}</span>
                  <span style={{ width: '60px', textAlign: 'center', color: tx.result === 'WIN' ? '#3b82f6' : '#ef4444' }}>{tx.multi.toFixed(2)}x</span>
                  <span style={{ width: '80px', textAlign: 'right', color: tx.result === 'WIN' ? '#22c55e' : '#64748b' }}>{tx.result === 'WIN' ? `+${tx.payout.toFixed(2)}` : '0.00'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'CONFIG' && (
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '16px', fontWeight: 'bold', marginBottom: '20px' }}>
              <Settings size={20} color="#3b82f6" /> Game Settings
            </div>
            
            <div style={{ backgroundColor: '#131823', borderRadius: '20px', padding: '20px', marginBottom: '24px' }}>
              <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>SOCKET ENDPOINT</div>
              <div style={{ backgroundColor: '#070a13', padding: '12px', borderRadius: '12px', fontSize: '12px', color: '#3b82f6', wordBreak: 'break-all' }}>{SOCKET_URL}</div>
            </div>

            <div style={{ backgroundColor: '#131823', borderRadius: '20px', padding: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>Auto-Eject Multiplier</div>
                <div style={{ color: '#94a3b8', fontSize: '12px' }}>Automatically cash out at target</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#070a13', padding: '8px 12px', borderRadius: '12px' }}>
                <input type="number" inputMode="decimal" value={autoEject} onChange={(e) => setAutoEject(e.target.value)} style={{ width: '60px', backgroundColor: 'transparent', border: 'none', color: '#fff', fontSize: '16px', fontWeight: 'bold', outline: 'none', textAlign: 'right' }} />
                <span style={{ color: '#3b82f6', marginLeft: '4px', fontWeight: 'bold' }}>x</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', marginTop: '16px' }}>
              <Shield size={20} color="#3b82f6" /> dApp Tools
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={handleSignMessage} style={{ ...menuBtnStyle, marginBottom: '0' }}>
                <Shield size={20} color="#3b82f6"/> Sign Auth Message
              </button>
              <button onClick={handleGetTokens} style={{ ...menuBtnStyle, marginBottom: '0' }}>
                <Database size={20} color="#3b82f6"/> Fetch Token Accounts
              </button>
            </div>

          </div>
        )}

        {/* Chat Modal */}
        {showChat && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 110, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ backgroundColor: '#131823', height: '60vh', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: '18px' }}>Global Chat</span>
                <X size={24} color="#94a3b8" onClick={() => setShowChat(false)} style={{ cursor: 'pointer' }} />
              </div>
              <div style={{ flex: 1, padding: '20px', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontStyle: 'italic' }}>
                Chat server currently offline...
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
