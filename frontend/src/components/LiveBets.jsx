import React from "react";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Users, CheckCircle2 } from "lucide-react";

const LiveBets = ({ bets, currentMultiplier }) => {
  // Sort bets: highest amount first
  const sortedBets = [...(bets || [])].sort((a, b) => b.amount - a.amount);

  return (
    <Card className="bg-gray-900 border-gray-800 h-full flex flex-col shadow-2xl">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/80 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-black text-white tracking-wide">LIVE PLAYERS <span className="text-cyan-400 text-sm">({sortedBets.length})</span></h3>
        </div>
        <div className="text-sm font-bold text-gray-400">
          {sortedBets.reduce((acc, bet) => acc + bet.amount, 0).toLocaleString()} <span className="text-xs">XRS</span>
        </div>
      </div>

      <ScrollArea className="flex-1 h-[400px]">
        <div className="p-3 space-y-2">
          {sortedBets.length === 0 ? (
            <div className="text-center py-12 text-gray-600 font-medium animate-pulse">Waiting for bets...</div>
          ) : (
            sortedBets.map((bet, i) => {
              const isCashedOut = bet.cashed_out;
              const winAmount = isCashedOut ? bet.amount * bet.cashout_multiplier : 0;
              
              return (
                <div 
                  key={i} 
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                    isCashedOut 
                      ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]" 
                      : "bg-gray-800/40 border-gray-700/50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`text-sm font-mono ${isCashedOut ? 'text-emerald-100' : 'text-gray-300'}`}>
                      {bet.wallet}
                    </div>
                  </div>
                  
                  <div className="text-right flex items-center space-x-3">
                    {isCashedOut ? (
                      <>
                        <div className="text-xs font-black text-emerald-400 bg-emerald-900/40 px-2 py-1 rounded-lg border border-emerald-500/30">
                          {bet.cashout_multiplier.toFixed(2)}x
                        </div>
                        <div className="text-sm font-black text-emerald-400 flex items-center">
                          +{winAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          <CheckCircle2 className="w-4 h-4 ml-1.5 text-emerald-500" />
                        </div>
                      </>
                    ) : (
                      <div className="text-sm font-bold text-gray-300">
                        {bet.amount.toLocaleString()} <span className="text-xs text-gray-500 font-normal">XRS</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default LiveBets;