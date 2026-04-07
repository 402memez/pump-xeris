import React, { useState, useEffect, useRef } from "react";
import { Rocket, TrendingUp } from "lucide-react";
import { Card } from "./ui/card";

const RocketGame = ({ gameState, currentMultiplier, onCashOut }) => {
  const [rocketPosition, setRocketPosition] = useState({ x: 10, y: 80 });
  const [rocketRotation, setRocketRotation] = useState(-45);
  const canvasRef = useRef(null);
  const trajectoryPoints = useRef([]);

  useEffect(() => {
    if (gameState === "flying") {
      const progress = Math.min(currentMultiplier / 10, 1);
      
      // Better curve calculation for smoother upward trajectory
      const x = 10 + progress * 80;
      const y = 80 - Math.pow(progress, 0.7) * 70; // More natural curve
      
      // Calculate rotation based on trajectory slope
      const rotation = -45 - (progress * 30); // Rotates from -45 to -75 degrees
      
      setRocketPosition({ x, y });
      setRocketRotation(rotation);
      
      // Store trajectory points for drawing
      trajectoryPoints.current.push({ x, y });
      if (trajectoryPoints.current.length > 100) {
        trajectoryPoints.current.shift();
      }
    } else if (gameState === "waiting") {
      setRocketPosition({ x: 10, y: 80 });
      setRocketRotation(-45);
      trajectoryPoints.current = [];
    } else if (gameState === "crashed") {
      trajectoryPoints.current = [];
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

      // Draw grid
      ctx.strokeStyle = "rgba(6, 182, 212, 0.08)";
      ctx.lineWidth = 1;

      for (let i = 0; i < width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }

      for (let i = 0; i < height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }

      // Draw smooth trajectory curve
      if (gameState === "flying" && trajectoryPoints.current.length > 1) {
        // Draw glow layer
        ctx.shadowBlur = 25;
        ctx.shadowColor = "#22d3ee";
        ctx.strokeStyle = "rgba(34, 211, 238, 0.3)";
        ctx.lineWidth = 8;
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
        
        // Draw main line
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#06b6d4";
        ctx.strokeStyle = "rgba(6, 182, 212, 0.9)";
        ctx.lineWidth = 3;
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

    drawBackground();
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
      <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] w-full">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="absolute inset-0 w-full h-full"
        />

        {/* Enhanced Rocket */}
        <div
          className="absolute transition-all duration-100 ease-out z-10"
          style={{
            left: `${rocketPosition.x}%`,
            top: `${rocketPosition.y}%`,
            transform: `translate(-50%, -50%) rotate(${rocketRotation}deg)`,
          }}
        >
          {/* Flame Trail */}
          {gameState === "flying" && (
            <>
              {/* Main flame */}
              <div 
                className="absolute top-1/2 left-full w-12 sm:w-16 lg:w-20 h-6 sm:h-8 lg:h-10"
                style={{
                  background: "linear-gradient(90deg, rgba(249, 115, 22, 0.9) 0%, rgba(234, 88, 12, 0.6) 40%, rgba(239, 68, 68, 0.3) 70%, transparent 100%)",
                  filter: "blur(3px)",
                  transform: "translateY(-50%)",
                  animation: "flameFlicker 0.1s infinite alternate",
                }}
              />
              {/* Secondary flame */}
              <div 
                className="absolute top-1/2 left-full w-8 sm:w-12 lg:w-16 h-4 sm:h-6 lg:h-8"
                style={{
                  background: "linear-gradient(90deg, rgba(251, 191, 36, 0.8) 0%, rgba(249, 115, 22, 0.5) 50%, transparent 100%)",
                  filter: "blur(2px)",
                  transform: "translateY(-50%)",
                  animation: "flameFlicker 0.15s infinite alternate",
                }}
              />
              {/* Particle glow */}
              <div 
                className="absolute top-1/2 left-full w-6 sm:w-8 lg:w-10 h-6 sm:h-8 lg:h-10 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(251, 191, 36, 0.6) 0%, rgba(249, 115, 22, 0.3) 40%, transparent 70%)",
                  filter: "blur(4px)",
                  transform: "translateY(-50%)",
                  animation: "pulse 0.3s infinite alternate",
                }}
              />
            </>
          )}
          
          {/* Rocket Body */}
          <div className="relative">
            {/* Rocket glow when flying */}
            {gameState === "flying" && (
              <div 
                className="absolute inset-0 rounded-full blur-lg opacity-60"
                style={{
                  background: "radial-gradient(circle, rgba(249, 115, 22, 0.6) 0%, rgba(234, 88, 12, 0.4) 50%, transparent 100%)",
                  width: "120%",
                  height: "120%",
                  left: "-10%",
                  top: "-10%",
                }}
              />
            )}
            
            {/* Main rocket icon */}
            <Rocket
              className={`relative w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 ${
                gameState === "flying" ? "text-orange-500" : "text-gray-600"
              } transition-colors duration-300`}
              style={{
                filter: gameState === "flying" 
                  ? "drop-shadow(0 0 12px rgba(249, 115, 22, 1)) drop-shadow(0 0 20px rgba(249, 115, 22, 0.5))" 
                  : "none",
              }}
            />
          </div>
        </div>

        {/* Multiplier Display */}
        <div className="absolute top-4 sm:top-8 left-1/2 transform -translate-x-1/2 z-10">
          {gameState === "flying" && (
            <div className="flex flex-col items-center space-y-1 sm:space-y-2">
              <div
                className={`text-4xl sm:text-6xl lg:text-7xl font-bold ${getMultiplierColor()} transition-colors duration-300`}
                style={{
                  textShadow: "0 0 40px currentColor",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {currentMultiplier.toFixed(2)}x
              </div>
              <div className="flex items-center space-x-2 text-cyan-400">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                <span className="text-xs sm:text-sm font-medium">LIVE</span>
              </div>
            </div>
          )}
          {gameState === "waiting" && (
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-500 animate-pulse">
              {getGameStateText()}
            </div>
          )}
          {gameState === "crashed" && (
            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-rose-500 animate-bounce">
              CRASHED AT {currentMultiplier.toFixed(2)}x
            </div>
          )}
        </div>

        {/* Game State Indicator */}
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
          <div className="flex items-center space-x-1 sm:space-x-2 bg-gray-900/80 backdrop-blur-sm px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-gray-800">
            <div
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                gameState === "flying"
                  ? "bg-emerald-500 animate-pulse"
                  : gameState === "waiting"
                  ? "bg-yellow-500 animate-pulse"
                  : "bg-rose-500"
              }`}
            ></div>
            <span className="text-[10px] sm:text-sm font-medium text-gray-300">
              {getGameStateText()}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RocketGame;
