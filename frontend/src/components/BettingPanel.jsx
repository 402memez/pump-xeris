import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Minus, Plus, DollarSign } from "lucide-react";
import { toast } from "sonner";

const BettingPanel = ({ balance, gameState, onPlaceBet, onCashOut, activeBet, currentMultiplier }) => {
  const [betAmount, setBetAmount] = useState(100);
  const [autoCashout, setAutoCashout] = useState(false);
  const [autoCashoutValue, setAutoCashoutValue] = useState(2.0);

  const quickBetAmounts = [10, 50, 100, 500, 1000];

  const handleBetAmountChange = (value) => {
    const numValue = parseFloat(value) || 0;
    if (numValue <= balance) {
      setBetAmount(numValue);
    } else {
      toast.error("Insufficient balance!");
    }
  };

  const adjustBetAmount = (multiplier) => {
    const newAmount = Math.max(1, betAmount * multiplier);
    if (newAmount <= balance) {
      setBetAmount(Math.round(newAmount));
    } else {
      toast.error("Insufficient balance!");
    }
  };

  const handlePlaceBet = () => {
    if (betAmount < 1) {
      toast.error("Minimum bet is 1 XRS");
      return;
    }
    if (betAmount > balance) {
      toast.error("Insufficient balance!");
      return;
    }
    onPlaceBet(betAmount, autoCashout ? autoCashoutValue : null);
    toast.success(`Bet placed: ${betAmount} XRS`);
  };

  const handleCashOut = () => {
    if (activeBet) {
      onCashOut();
      toast.success(`Cashed out at ${(currentMultiplier || 1).toFixed(2)}x!`);
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800 p-6">
      <div className="space-y-6">
        {/* Balance Display */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-850 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Your Balance</div>
          <div className="text-3xl font-bold text-cyan-400 flex items-center">
            
            {balance.toLocaleString()} <span className="text-xl text-cyan-300 ml-2">XRS</span>
          </div>
        </div>

        {/* Bet Amount */}
        <div className="space-y-3">
          <Label className="text-gray-300 text-sm font-medium">Bet Amount</Label>
          <div className="flex items-center space-x-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => adjustBetAmount(0.5)}
              disabled={gameState === "flying" && activeBet}
              className="border-gray-700 hover:bg-gray-800 hover:border-cyan-500 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <div className="relative flex-1">
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm font-bold text-gray-500">XRS</span>
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => handleBetAmountChange(e.target.value)}
                disabled={gameState === "flying" && activeBet}
                className="px-12 bg-gray-800 border-gray-700 text-white text-center text-lg font-semibold focus:border-cyan-500 transition-colors"
              />
            </div>
            <Button
              size="icon"
              variant="outline"
              onClick={() => adjustBetAmount(2)}
              disabled={gameState === "flying" && activeBet}
              className="border-gray-700 hover:bg-gray-800 hover:border-cyan-500 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Quick Bet Buttons */}
          <div className="flex space-x-2">
            {quickBetAmounts.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => setBetAmount(amount)}
                disabled={gameState === "flying" && activeBet}
                className="flex-1 border-gray-700 hover:bg-gray-800 hover:border-cyan-500 transition-colors text-xs"
              >{amount}
              </Button>
            ))}
          </div>
        </div>

        {/* Auto Cashout */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-gray-300 text-sm font-medium">Auto Cashout</Label>
            <Switch
              checked={autoCashout}
              onCheckedChange={setAutoCashout}
              disabled={gameState === "flying" && activeBet}
            />
          </div>
          {autoCashout && (
            <div className="relative">
              <Input
                type="number"
                step="0.1"
                value={autoCashoutValue}
                onChange={(e) => setAutoCashoutValue(parseFloat(e.target.value) || 2.0)}
                disabled={gameState === "flying" && activeBet}
                className="bg-gray-800 border-gray-700 text-white text-center font-semibold focus:border-cyan-500 transition-colors"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">x</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {!activeBet && gameState !== "flying" && (
            <Button
              onClick={handlePlaceBet}
              disabled={gameState === "flying"}
              className="w-full h-14 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-lg shadow-lg hover:shadow-emerald-500/50 transition-all duration-300"
            >
              PLACE BET
            </Button>
          )}
          {activeBet && gameState === "flying" && (
            <Button
              onClick={handleCashOut}
              className="w-full h-14 bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 text-white font-bold text-lg shadow-lg hover:shadow-orange-500/50 transition-all duration-300 animate-pulse"
            >
              CASH OUT {(activeBet.betAmount * (currentMultiplier || 1)).toFixed(2)} XRS
            </Button>
          )}
          {activeBet && gameState === "waiting" && (
            <div className="w-full h-14 bg-gray-800 border-2 border-yellow-500 text-yellow-400 font-bold text-lg rounded-lg flex items-center justify-center">
              BET PLACED - WAITING FOR NEXT ROUND
            </div>
          )}
        </div>

        {/* Potential Win Display */}
        {activeBet && gameState === "flying" && (
          <div className="bg-gradient-to-r from-emerald-900/30 to-cyan-900/30 p-4 rounded-lg border border-emerald-700/50">
            <div className="text-sm text-gray-400 mb-1">Potential Win</div>
            <div className="text-2xl font-bold text-emerald-400">{(activeBet.betAmount * (currentMultiplier || 1)).toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Bet: {activeBet.betAmount} XRS × {(currentMultiplier || 1).toFixed(2)}x
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

// OPTIMIZED: Memoize to prevent unnecessary re-renders
export default React.memo(BettingPanel);
