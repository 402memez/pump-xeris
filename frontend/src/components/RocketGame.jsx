import React, { useState, useEffect, useRef } from "react";
import { TrendingUp, CircleDollarSign } from "lucide-react";
import { Card } from "./ui/card";

const RocketGame = ({ gameState, currentMultiplier, onCashOut }) => {
  const [rocketPosition, setRocketPosition] = useState({ x: 10, y: 80 });
  const [rocketRotation, setRocketRotation] = useState(-45);
  const [cashedOutPlayers, setCashedOutPlayers] = useState([]);
  const canvasRef = useRef(null);
  const trajectoryPoints = useRef([]);

  useEffect(() => {
    if (gameState === "flying") {
      const progress = Math.min(currentMultiplier / 10, 1);
      
      // Dramatic upward curve calculation
      const x = 10 + progress * 75;
      const y = 80 - Math.pow(progress, 0.6) * 75; // More aggressive upward curve
      
      // Calculate rotation based on actual trajectory slope (derivative)
      // dy/dx gives us the slope, and atan gives us the angle
      const dx = 0.01; // small step for derivative
      const prevProgress = Math.max(0, progress - 0.05);
      const prevX = 10 + prevProgress * 75;
      const prevY = 80 - Math.pow(prevProgress, 0.6) * 75;
      
      // Calculate angle from slope
      const deltaY = y - prevY;
      const deltaX = x - prevX;
      const angle = Math.atan2(-deltaY, deltaX) * (180 / Math.PI); // negative because y increases downward
      
      setRocketPosition({ x, y });
      setRocketRotation(angle); // Direct angle based on trajectory
      
      // Store trajectory points for drawing
      trajectoryPoints.current.push({ x, y });
      if (trajectoryPoints.current.length > 100) {
        trajectoryPoints.current.shift();
      }

      // Randomly add cashed out players for demo
      if (Math.random() < 0.05 && cashedOutPlayers.length < 3) {
        const newPlayer = {
          id: Date.now(),
          x: x + (Math.random() - 0.5) * 10,
          y: y,
          multiplier: currentMultiplier.toFixed(2),
        };
        setCashedOutPlayers(prev => [...prev, newPlayer]);
        
        // Remove after animation
        setTimeout(() => {
          setCashedOutPlayers(prev => prev.filter(p => p.id !== newPlayer.id));
        }, 3000);
      }
    } else if (gameState === "waiting") {
      setRocketPosition({ x: 10, y: 80 });
      setRocketRotation(-45); // Default angle pointing up-right
      trajectoryPoints.current = [];
      setCashedOutPlayers([]);
    } else if (gameState === "crashed") {
      trajectoryPoints.current = [];
      setCashedOutPlayers([]);
    }
  }, [currentMultiplier, gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    const drawBackground = () => {
      // Clear canvas
      ctx.fillStyle = "#0a0a0b";
      ctx.fillRect(0, 0, width, height);

      // Draw multi-layered data grid with depth
      const layers = [
        { color: "rgba(6, 182, 212, 0.03)", spacing: 80, lineWidth: 1 },
        { color: "rgba(6, 182, 212, 0.06)", spacing: 40, lineWidth: 0.5 },
        { color: "rgba(249, 115, 22, 0.02)", spacing: 120, lineWidth: 1.5 },
      ];

      layers.forEach(layer => {
        ctx.strokeStyle = layer.color;
        ctx.lineWidth = layer.lineWidth;

        // Vertical lines
        for (let i = 0; i < width; i += layer.spacing) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, height);
          ctx.stroke();
        }

        // Horizontal lines
        for (let i = 0; i < height; i += layer.spacing) {
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(width, i);
          ctx.stroke();
        }
      });

      // Draw luminous energy wake trajectory
      if (gameState === "flying" && trajectoryPoints.current.length > 1) {
        // Multi-colored energy wake
        const gradient = ctx.createLinearGradient(
          0, height,
          width, 0
        );
        gradient.addColorStop(0, "rgba(6, 182, 212, 0.4)");
        gradient.addColorStop(0.5, "rgba(249, 115, 22, 0.6)");
        gradient.addColorStop(1, "rgba(168, 85, 247, 0.4)");

        // Outer glow
        ctx.shadowBlur = 30;
        ctx.shadowColor = "#f97316";
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 12;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        
        trajectoryPoints.current.forEach((point, index) => {
          const x = (point.x / 100) * width;
          const y = (point.y / 100) * height;
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();
        
        // Inner luminous core
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#06b6d4";
        ctx.lineWidth = 4;
        ctx.beginPath();
        
        trajectoryPoints.current.forEach((point, index) => {
          const x = (point.x / 100) * width;
          const y = (point.y / 100) * height;
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();
        
        ctx.shadowBlur = 0;
      }
    };

    const animate = () => {
      drawBackground();
      requestAnimationFrame(animate);
    };
    
    animate();
  }, [gameState, rocketPosition, trajectoryPoints.current.length]);

  const getMultiplierColor = () => {
    if (currentMultiplier < 2) return "text-cyan-400";
    if (currentMultiplier < 5) return "text-emerald-400";
    if (currentMultiplier < 10) return "text-orange-400";
    return "text-rose-400";
  };

  const getGameStateText = () => {
    switch (gameState) {
      case "waiting":
        return "STARTING SOON...";
      case "flying":
        return "FLYING";
      case "crashed":
        return "CRASHED!";
      default:
        return "";
    }
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 border-gray-800">
      {/* Nebula Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-purple-900/30 to-orange-900/40" 
          style={{
            backgroundImage: `
              radial-gradient(ellipse at 20% 30%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 70%, rgba(249, 115, 22, 0.3) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(168, 85, 247, 0.2) 0%, transparent 60%)
            `,
            filter: "blur(60px)",
          }}
        />
      </div>

      <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] w-full">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="absolute inset-0 w-full h-full"
        />

        {/* Enhanced 3D-style Rocket */}
        <div
          className="absolute transition-all duration-100 ease-out z-20"
          style={{
            left: `${rocketPosition.x}%`,
            top: `${rocketPosition.y}%`,
            transform: `translate(-50%, -50%) rotate(${rocketRotation}deg)`,
          }}
        >
          {/* Volumetric Plasma Plume */}
          {gameState === "flying" && (
            <div className="absolute top-1/2 left-full">
              {/* Primary turbulent flame */}
              <div 
                className="absolute top-1/2 left-0 w-16 sm:w-24 lg:w-32 h-8 sm:h-12 lg:h-16 rocket-flame-primary"
                style={{
                  transform: "translateY(-50%)",
                }}
              />
              {/* Secondary flame layer */}
              <div 
                className="absolute top-1/2 left-0 w-12 sm:w-18 lg:w-24 h-6 sm:h-10 lg:h-12 rocket-flame-secondary"
                style={{
                  transform: "translateY(-50%)",
                }}
              />
              {/* Particle burst */}
              <div className="absolute top-1/2 left-0 w-20 sm:w-28 lg:w-36 h-10 sm:h-14 lg:h-18 rocket-particles"
                style={{
                  transform: "translateY(-50%)",
                }}
              />
              {/* Heat distortion shimmer */}
              <div className="absolute top-1/2 left-0 w-10 sm:w-14 lg:w-20 h-10 sm:h-14 lg:h-20 rocket-heat-distortion"
                style={{
                  transform: "translateY(-50%)",
                }}
              />
            </div>
          )}
          
          {/* 3D Rocket Body with textures */}
          <div className="relative rocket-body">
            {/* Rocket hull glow */}
            {gameState === "flying" && (
              <>
                <div className="absolute inset-0 rocket-glow" />
                <div className="absolute inset-0 rocket-pulse" />
              </>
            )}
            
            {/* Main rocket structure - SVG for detail */}
            <svg 
              className="relative w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20" 
              viewBox="0 0 100 100"
              style={{
                filter: gameState === "flying" 
                  ? "drop-shadow(0 0 12px rgba(249, 115, 22, 1)) drop-shadow(0 0 25px rgba(249, 115, 22, 0.6))" 
                  : "drop-shadow(0 0 4px rgba(100, 100, 100, 0.5))",
              }}
            >
              {/* Rocket body */}
              <defs>
                <linearGradient id="rocketGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor: gameState === "flying" ? "#f97316" : "#6b7280", stopOpacity: 1}} />
                  <stop offset="50%" style={{stopColor: gameState === "flying" ? "#ea580c" : "#4b5563", stopOpacity: 1}} />
                  <stop offset="100%" style={{stopColor: gameState === "flying" ? "#c2410c" : "#374151", stopOpacity: 1}} />
                </linearGradient>
                <linearGradient id="windowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor: "#06b6d4", stopOpacity: 0.8}} />
                  <stop offset="100%" style={{stopColor: "#0891b2", stopOpacity: 0.9}} />
                </linearGradient>
              </defs>
              
              {/* Main hull */}
              <path d="M 50 10 L 65 40 L 65 80 L 50 90 L 35 80 L 35 40 Z" 
                fill="url(#rocketGradient)" 
                stroke={gameState === "flying" ? "#fb923c" : "#9ca3af"} 
                strokeWidth="1.5"
              />
              
              {/* Panel lines for detail */}
              <line x1="50" y1="30" x2="50" y2="85" stroke="#1f2937" strokeWidth="1" opacity="0.6" />
              <line x1="42" y1="50" x2="58" y2="50" stroke="#1f2937" strokeWidth="1" opacity="0.4" />
              <line x1="42" y1="65" x2="58" y2="65" stroke="#1f2937" strokeWidth="1" opacity="0.4" />
              
              {/* Window */}
              <circle cx="50" cy="35" r="6" fill="url(#windowGradient)" stroke="#0e7490" strokeWidth="1" />
              <circle cx="50" cy="35" r="4" fill="#67e8f9" opacity="0.6" />
              
              {/* Fins */}
              <path d="M 35 70 L 25 80 L 35 75 Z" fill={gameState === "flying" ? "#dc2626" : "#4b5563"} stroke="#991b1b" strokeWidth="1" />
              <path d="M 65 70 L 75 80 L 65 75 Z" fill={gameState === "flying" ? "#dc2626" : "#4b5563"} stroke="#991b1b" strokeWidth="1" />
              
              {/* Thruster nozzles */}
              <rect x="44" y="85" width="5" height="8" fill="#1f2937" stroke="#374151" strokeWidth="0.5" />
              <rect x="51" y="85" width="5" height="8" fill="#1f2937" stroke="#374151" strokeWidth="0.5" />
              <circle cx="46.5" cy="90" r="1.5" fill={gameState === "flying" ? "#fbbf24" : "#6b7280"} />
              <circle cx="53.5" cy="90" r="1.5" fill={gameState === "flying" ? "#fbbf24" : "#6b7280"} />
            </svg>
          </div>
        </div>

        {/* Cashed Out Players with Icon */}
        {cashedOutPlayers.map(player => (
          <div
            key={player.id}
            className="absolute z-30 animate-cash-out-jump"
            style={{
              left: `${player.x}%`,
              top: `${player.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="flex flex-col items-center">
              <CircleDollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400 animate-parachute-float" 
                style={{
                  filter: "drop-shadow(0 0 8px rgba(52, 211, 153, 0.8))",
                }}
              />
              <div className="mt-1 bg-emerald-500/90 text-white text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap"
                style={{
                  textShadow: "0 0 10px rgba(16, 185, 129, 1)",
                }}
              >
                {player.multiplier}x
              </div>
            </div>
          </div>
        ))}

        {/* Premium Neon Multiplier Display */}
        <div className="absolute top-4 sm:top-8 left-1/2 transform -translate-x-1/2 z-10">
          {gameState === "flying" && (
            <div className="flex flex-col items-center space-y-1 sm:space-y-2">
              <div
                className={`premium-multiplier text-4xl sm:text-6xl lg:text-7xl font-bold ${getMultiplierColor()}`}
                style={{
                  fontVariantNumeric: "tabular-nums",
                  fontFamily: "'Orbitron', 'Rajdhani', monospace",
                  letterSpacing: "0.05em",
                }}
              >
                {currentMultiplier.toFixed(2)}x
              </div>
              <div className="flex items-center space-x-2 premium-live-badge">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                <span className="text-xs sm:text-sm font-bold tracking-wider">LIVE</span>
              </div>
            </div>
          )}
          {gameState === "waiting" && (
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-500 animate-pulse">
              {getGameStateText()}
            </div>
          )}
          {gameState === "crashed" && (
            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-rose-500 animate-bounce premium-crash-text">
              CRASHED AT {currentMultiplier.toFixed(2)}x
            </div>
          )}
        </div>

        {/* Premium Metal & Glass Status Badge */}
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
          <div className="premium-status-badge">
            <div
              className={`premium-indicator ${
                gameState === "flying"
                  ? "premium-indicator-flying"
                  : gameState === "waiting"
                  ? "premium-indicator-waiting"
                  : "premium-indicator-crashed"
              }`}
            ></div>
            <span className="text-[10px] sm:text-sm font-bold tracking-wider">
              {getGameStateText()}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RocketGame;
