import React, { useState, useEffect, useRef } from "react";
import { TrendingUp } from "lucide-react";
import { Card } from "./ui/card";

const RocketGame = ({ gameState, currentMultiplier, onCashOut }) => {
  const [rocketPosition, setRocketPosition] = useState({ x: 5, y: 95 });
  const [rocketRotation, setRocketRotation] = useState(0);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const lastMultiplierRef = useRef(1.0);

  useEffect(() => {
    // ULTRA-OPTIMIZED: Only update if multiplier changed significantly
    if (Math.abs(currentMultiplier - lastMultiplierRef.current) < 0.01 && gameState === "flying") {
      return;
    }
    lastMultiplierRef.current = currentMultiplier;
    
    if (gameState === "flying") {
      const progress = Math.min(currentMultiplier / 15, 1);
      const x = 5 + progress * 90;
      
      let y;
      if (progress < 0.5) {
        y = 95 - progress * 10;
      } else {
        const adjustedProgress = (progress - 0.5) * 2;
        y = 90 - Math.pow(adjustedProgress, 0.6) * 85;
      }
      
      let rotation;
      if (progress < 0.5) {
        rotation = -(progress * 30);
      } else {
        const adjustedProgress = (progress - 0.5) * 2;
        rotation = -15 - (adjustedProgress * 60);
      }
      
      setRocketPosition({ x, y });
      setRocketRotation(rotation);
    } else if (gameState === "waiting") {
      setRocketPosition({ x: 5, y: 95 });
      setRocketRotation(0);
    }
  }, [currentMultiplier, gameState]);

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Gradient background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, "rgba(6, 78, 59, 0.1)");
      bgGradient.addColorStop(1, "rgba(17, 24, 39, 0.3)");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = "rgba(52, 211, 153, 0.08)";
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 60) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let i = 0; i < height; i += 60) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }

      // Draw trail line
      if (gameState === "flying") {
        const gradient = ctx.createLinearGradient(
          0, height,
          (rocketPosition.x / 100) * width,
          (rocketPosition.y / 100) * height
        );
        gradient.addColorStop(0, "rgba(52, 211, 153, 0.2)");
        gradient.addColorStop(0.5, "rgba(16, 185, 129, 0.6)");
        gradient.addColorStop(1, "rgba(5, 150, 105, 0.9)");

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.shadowBlur = 0; // GPU Hack
        ctx.shadowColor = "rgba(52, 211, 153, 0.5)";

        ctx.beginPath();
        ctx.moveTo(width * 0.05, height * 0.95);
        
        // Create smooth curve matching the trajectory
        const steps = 50;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const progress = t * Math.min(currentMultiplier / 15, 1);
          const px = 5 + progress * 90;
          
          let py;
          if (progress < 0.5) {
            py = 95 - progress * 10;
          } else {
            const adjustedProgress = (progress - 0.5) * 2;
            py = 90 - Math.pow(adjustedProgress, 0.6) * 85;
          }
          
          ctx.lineTo((px / 100) * width, (py / 100) * height);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        var particles = []; // Draw particles
        particles.forEach((particle, index) => {
          const opacity = 1 - (index / particles.length) * 0.7;
          ctx.fillStyle = `rgba(52, 211, 153, ${opacity})`;
          ctx.beginPath();
          ctx.arc(
            (particle.x / 100) * width,
            (particle.y / 100) * height,
            particle.size,
            0,
            Math.PI * 2
          );
          ctx.fill();
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, rocketPosition, currentMultiplier]);

  const getMultiplierColor = () => {
    if (currentMultiplier < 2) return "from-emerald-400 to-teal-400";
    if (currentMultiplier < 5) return "from-cyan-400 to-blue-400";
    if (currentMultiplier < 10) return "from-violet-400 to-purple-400";
    return "from-rose-400 to-pink-400";
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 border-emerald-900/30 shadow-2xl">
      <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] w-full">
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={1000}
          height={600}
          className="absolute inset-0 w-full h-full"
        />

        {/* Futuristic Rocket */}
        <div
          className="absolute transition-all duration-75 ease-out z-20"
          style={{
            left: `${rocketPosition.x}%`,
            top: `${rocketPosition.y}%`,
            transform: `translate(-50%, -50%) rotate(${rocketRotation}deg) translateZ(0)`, willChange: "transform, left, top",
          }}
        >
          {gameState === "flying" && (
            <div className="relative">
              {/* Outer glow ring */}
              <div className="absolute inset-0 blur-2xl opacity-50 -z-10">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-cyan-400 via-emerald-400 to-teal-500 animate-pulse"></div>
              </div>
              
              {/* Inner glow */}
              <div className="absolute inset-0 blur-lg opacity-70 -z-10">
                <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-emerald-300 to-cyan-400"></div>
              </div>
              
              {/* Futuristic rocket shape */}
              <div className="relative">
                <svg className="w-12 h-12 sm:w-16 sm:h-16" viewBox="0 0 50 50" style={{
                  
                }}>
                  <defs>
                    <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{stopColor: "#06b6d4"}} />
                      <stop offset="50%" style={{stopColor: "#10b981"}} />
                      <stop offset="100%" style={{stopColor: "#34d399"}} />
                    </linearGradient>
                    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{stopColor: "#fbbf24"}} />
                      <stop offset="100%" style={{stopColor: "#f59e0b"}} />
                    </linearGradient>
                    <radialGradient id="glowGrad">
                      <stop offset="0%" style={{stopColor: "#fff", stopOpacity: 1}} />
                      <stop offset="100%" style={{stopColor: "#06b6d4", stopOpacity: 0.5}} />
                    </radialGradient>
                  </defs>
                  
                  {/* Main body */}
                  <path d="M 25 5 L 35 25 L 35 35 L 30 45 L 20 45 L 15 35 L 15 25 Z" 
                    fill="url(#bodyGrad)" 
                    stroke="#0891b2" 
                    strokeWidth="1.5"
                    opacity="0.95"
                  />
                  
                  {/* Cockpit window */}
                  <ellipse cx="25" cy="18" rx="5" ry="6" fill="url(#glowGrad)" opacity="0.9" />
                  <ellipse cx="25" cy="18" rx="3" ry="4" fill="#fff" opacity="0.7" />
                  
                  {/* Tech lines */}
                  <line x1="20" y1="28" x2="30" y2="28" stroke="#0891b2" strokeWidth="1" opacity="0.6" />
                  <line x1="20" y1="32" x2="30" y2="32" stroke="#0891b2" strokeWidth="1" opacity="0.6" />
                  
                  {/* Wing panels */}
                  <path d="M 15 25 L 8 30 L 10 35 L 15 32 Z" fill="url(#bodyGrad)" stroke="#059669" strokeWidth="1" opacity="0.9" />
                  <path d="M 35 25 L 42 30 L 40 35 L 35 32 Z" fill="url(#bodyGrad)" stroke="#059669" strokeWidth="1" opacity="0.9" />
                  
                  {/* Thruster ports */}
                  <rect x="20" y="42" width="3" height="6" rx="1" fill="#1e293b" />
                  <rect x="27" y="42" width="3" height="6" rx="1" fill="#1e293b" />
                  <circle cx="21.5" cy="46" r="1.5" fill="url(#accentGrad)" />
                  <circle cx="28.5" cy="46" r="1.5" fill="url(#accentGrad)" />
                  
                  {/* Energy core */}
                  <circle cx="25" cy="30" r="2" fill="#fbbf24" opacity="0.8" />
                </svg>
              </div>
              
              {/* Energy rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-cyan-400/40 rounded-full animate-ping"></div>
                <div className="absolute w-16 h-16 sm:w-20 sm:h-20 border border-emerald-400/30 rounded-full animate-pulse"></div>
              </div>
              
              {/* Speed lines */}
              <div className="absolute right-full top-1/2 transform -translate-y-1/2 flex gap-1 opacity-60">
                <div className="w-8 h-0.5 bg-gradient-to-r from-cyan-400 to-transparent animate-pulse"></div>
                <div className="w-6 h-0.5 bg-gradient-to-r from-emerald-400 to-transparent animate-pulse" style={{animationDelay: "0.1s"}}></div>
                <div className="w-4 h-0.5 bg-gradient-to-r from-teal-400 to-transparent animate-pulse" style={{animationDelay: "0.2s"}}></div>
              </div>
            </div>
          )}
        </div>

        {/* Multiplier Display */}
        <div className="absolute top-6 sm:top-10 left-1/2 transform -translate-x-1/2 z-10">
          {gameState === "flying" && (
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <div className={`text-5xl sm:text-7xl lg:text-8xl font-black bg-gradient-to-r ${getMultiplierColor()} bg-clip-text text-transparent`}
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  textShadow: "0 0 60px rgba(52, 211, 153, 0.3)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {currentMultiplier.toFixed(2)}×
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm px-4 py-2 rounded-full border border-emerald-400/30">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-emerald-300 text-sm font-semibold tracking-wider">ACTIVE</span>
              </div>
            </div>
          )}
          {gameState === "waiting" && (
            <div className="text-2xl sm:text-3xl font-bold text-gray-400 animate-pulse tracking-wider">
              PREPARE...
            </div>
          )}
          {gameState === "crashed" && (
            <div className="text-4xl sm:text-6xl font-black text-rose-500 animate-bounce">
              CRASHED {currentMultiplier.toFixed(2)}×
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
          <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 sm:px-4 py-2 rounded-xl border border-slate-700/50 shadow-lg">
            <div className={`w-2 h-2 rounded-full ${
              gameState === "flying" ? "bg-emerald-400 animate-pulse shadow-emerald-400/50 shadow-lg" :
              gameState === "waiting" ? "bg-yellow-400 animate-pulse" :
              "bg-rose-400"
            }`}></div>
            <span className="text-xs sm:text-sm font-bold text-gray-200 tracking-wide">
              {gameState === "flying" ? "LIVE" : gameState === "waiting" ? "LOADING" : "ENDED"}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

// OPTIMIZED: Memoize component to prevent unnecessary re-renders
const MemoizedRocketGame = React.memo(RocketGame, (prevProps, nextProps) => {
  // Only re-render if these props change significantly
  return (
    prevProps.gameState === nextProps.gameState &&
    Math.abs(prevProps.currentMultiplier - nextProps.currentMultiplier) < 0.01
  );
});

export default MemoizedRocketGame;
