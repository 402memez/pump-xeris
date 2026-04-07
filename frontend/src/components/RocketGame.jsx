import React, { useState, useEffect, useRef } from "react";
import { Rocket, TrendingUp } from "lucide-react";
import { Card } from "./ui/card";

const RocketGame = ({ gameState, currentMultiplier, onCashOut }) => {
  const [rocketPosition, setRocketPosition] = useState({ x: 10, y: 80 });
  const canvasRef = useRef(null);

  useEffect(() => {
    if (gameState === "flying") {
      const progress = Math.min(currentMultiplier / 10, 1);
      setRocketPosition({
        x: 10 + progress * 60,
        y: 80 - progress * 60,
      });
    } else if (gameState === "waiting") {
      setRocketPosition({ x: 10, y: 80 });
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
      ctx.strokeStyle = "rgba(6, 182, 212, 0.1)";
      ctx.lineWidth = 1;

      for (let i = 0; i < width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }

      for (let i = 0; i < height; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }

      // Draw trajectory
      if (gameState === "flying") {
        ctx.strokeStyle = "rgba(34, 211, 238, 0.6)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(width * 0.1, height * 0.8);
        ctx.quadraticCurveTo(
          width * 0.3,
          height * 0.6,
          width * (rocketPosition.x / 100),
          height * (rocketPosition.y / 100)
        );
        ctx.stroke();

        // Draw glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#22d3ee";
        ctx.strokeStyle = "rgba(34, 211, 238, 0.8)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    };

    drawBackground();
  }, [gameState, rocketPosition]);

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
      <div className="relative h-[500px] w-full">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="absolute inset-0 w-full h-full"
        />

        {/* Rocket */}
        <div
          className="absolute transition-all duration-100 ease-linear"
          style={{
            left: `${rocketPosition.x}%`,
            top: `${rocketPosition.y}%`,
            transform: `translate(-50%, -50%) rotate(-45deg)`,
          }}
        >
          <Rocket
            className={`w-16 h-16 ${
              gameState === "flying" ? "text-orange-500" : "text-gray-600"
            } transition-colors duration-300`}
            style={{
              filter: gameState === "flying" ? "drop-shadow(0 0 20px rgba(249, 115, 22, 0.8))" : "none",
            }}
          />
          {gameState === "flying" && (
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-br from-orange-500 via-red-500 to-yellow-500 rounded-full blur-xl opacity-70 animate-pulse"></div>
          )}
        </div>

        {/* Multiplier Display */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
          {gameState === "flying" && (
            <div className="flex flex-col items-center space-y-2">
              <div
                className={`text-7xl font-bold ${getMultiplierColor()} transition-colors duration-300`}
                style={{
                  textShadow: "0 0 40px currentColor",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {currentMultiplier.toFixed(2)}x
              </div>
              <div className="flex items-center space-x-2 text-cyan-400">
                <TrendingUp className="w-5 h-5 animate-pulse" />
                <span className="text-sm font-medium">LIVE</span>
              </div>
            </div>
          )}
          {gameState === "waiting" && (
            <div className="text-3xl font-bold text-gray-500 animate-pulse">
              {getGameStateText()}
            </div>
          )}
          {gameState === "crashed" && (
            <div className="text-5xl font-bold text-rose-500 animate-bounce">
              CRASHED AT {currentMultiplier.toFixed(2)}x
            </div>
          )}
        </div>

        {/* Game State Indicator */}
        <div className="absolute top-4 right-4">
          <div className="flex items-center space-x-2 bg-gray-900/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-800">
            <div
              className={`w-3 h-3 rounded-full ${
                gameState === "flying"
                  ? "bg-emerald-500 animate-pulse"
                  : gameState === "waiting"
                  ? "bg-yellow-500 animate-pulse"
                  : "bg-rose-500"
              }`}
            ></div>
            <span className="text-sm font-medium text-gray-300">
              {getGameStateText()}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RocketGame;
