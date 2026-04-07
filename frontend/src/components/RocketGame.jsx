import React, { useState, useEffect, useRef } from "react";
import { TrendingUp, Zap } from "lucide-react";
import { Card } from "./ui/card";

const RocketGame = ({ gameState, currentMultiplier, onCashOut }) => {
  const [rocketPosition, setRocketPosition] = useState({ x: 5, y: 90 });
  const [cashedOutPlayers, setCashedOutPlayers] = useState([]);
  const [particles, setParticles] = useState([]);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (gameState === "flying") {
      const progress = Math.min(currentMultiplier / 15, 1);
      
      // Smooth exponential curve
      const x = 5 + progress * 90;
      const y = 90 - (Math.pow(progress, 0.5) * 85);
      
      setRocketPosition({ x, y });

      // Generate trail particles
      if (Math.random() < 0.3) {
        const newParticle = {
          id: Date.now() + Math.random(),
          x,
          y,
          opacity: 1,
          size: Math.random() * 3 + 2,
        };
        setParticles(prev => [...prev.slice(-20), newParticle]);
      }

      // Cash out demo
      if (Math.random() < 0.03 && cashedOutPlayers.length < 2) {
        const newPlayer = {
          id: Date.now(),
          x: x + (Math.random() - 0.5) * 15,
          y: y + 5,
          multiplier: currentMultiplier.toFixed(2),
        };
        setCashedOutPlayers(prev => [...prev, newPlayer]);
        setTimeout(() => {
          setCashedOutPlayers(prev => prev.filter(p => p.id !== newPlayer.id));
        }, 2500);
      }
    } else if (gameState === "waiting") {
      setRocketPosition({ x: 5, y: 90 });
      setParticles([]);
      setCashedOutPlayers([]);
    } else if (gameState === "crashed") {
      setParticles([]);
      setCashedOutPlayers([]);
    }
  }, [currentMultiplier, gameState, cashedOutPlayers.length]);

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
        ctx.shadowBlur = 20;
        ctx.shadowColor = "rgba(52, 211, 153, 0.5)";

        ctx.beginPath();
        ctx.moveTo(width * 0.05, height * 0.9);
        
        // Create smooth curve
        const steps = 50;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const progress = t * Math.min(currentMultiplier / 15, 1);
          const px = 5 + progress * 90;
          const py = 90 - (Math.pow(progress, 0.5) * 85);
          ctx.lineTo((px / 100) * width, (py / 100) * height);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw particles
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
  }, [gameState, rocketPosition, currentMultiplier, particles]);

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

        {/* Modern Rocket */}
        <div
          className="absolute transition-all duration-75 ease-out z-20"
          style={{
            left: `${rocketPosition.x}%`,
            top: `${rocketPosition.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {gameState === "flying" && (
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 blur-xl opacity-60">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 animate-pulse"></div>
              </div>
              
              {/* Modern rocket shape */}
              <div className="relative">
                <svg className="w-10 h-10 sm:w-14 sm:h-14" viewBox="0 0 40 40" style={{
                  filter: "drop-shadow(0 0 15px rgba(52, 211, 153, 0.8))",
                }}>
                  <defs>
                    <linearGradient id="rocketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{stopColor: "#34d399"}} />
                      <stop offset="100%" style={{stopColor: "#14b8a6"}} />
                    </linearGradient>
                  </defs>
                  {/* Arrow/Triangle rocket */}
                  <path d="M 20 2 L 35 38 L 20 32 L 5 38 Z" fill="url(#rocketGrad)" stroke="#10b981" strokeWidth="1.5" />
                  <circle cx="20" cy="18" r="4" fill="#fff" opacity="0.9" />
                  <path d="M 20 32 L 25 38 L 20 35 L 15 38 Z" fill="#fbbf24" opacity="0.8" />
                </svg>
              </div>
              
              {/* Energy rings */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-emerald-400/30 rounded-full animate-ping"></div>
              </div>
            </div>
          )}
        </div>

        {/* Cashed Out Players */}
        {cashedOutPlayers.map(player => (
          <div
            key={player.id}
            className="absolute z-30 animate-cash-out-jump"
            style={{
              left: `${player.x}%`,
              top: `${player.y}%`,
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full shadow-lg"
                style={{
                  boxShadow: "0 0 20px rgba(52, 211, 153, 0.6)",
                }}
              >
                +{player.multiplier}×
              </div>
              <Zap className="w-4 h-4 text-yellow-400" />
            </div>
          </div>
        ))}

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

export default RocketGame;
