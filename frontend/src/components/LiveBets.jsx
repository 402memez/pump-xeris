import React from "react";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Users, TrendingUp } from "lucide-react";

const LiveBets = ({ bets, currentMultiplier }) => {
  return (
    <Card className="bg-gray-900 border-gray-800 h-full">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">Live Bets</h3>
          </div>
          <div className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-sm font-semibold">
            {bets.length} Active
          </div>
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="p-4 space-y-2">
          {bets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No active bets</p>
            </div>
          ) : (
            bets.map((bet) => (
              <div
                key={bet.id}
                className="bg-gray-800/50 hover:bg-gray-800 p-3 rounded-lg border border-gray-700 hover:border-cyan-500/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                      {bet.username.charAt(0)}
                    </div>
                    <span className="font-medium text-white text-sm">
                      {bet.username}
                    </span>
                  </div>
                  {bet.status === "active" && (
                    <div className="flex items-center space-x-1 text-emerald-400 text-xs">
                      <TrendingUp className="w-3 h-3 animate-pulse" />
                      <span className="font-medium">Active</span>
                    </div>
                  )}
                  {bet.status === "cashed" && (
                    <div className="text-emerald-400 text-xs font-bold">
                      CASHED OUT
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-gray-400">Bet: </span>
                    <span className="text-white font-semibold">
                      ${bet.betAmount}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">@ </span>
                    <span className="text-cyan-400 font-bold">
                      {bet.multiplier ? bet.multiplier.toFixed(2) : currentMultiplier.toFixed(2)}x
                    </span>
                  </div>
                </div>

                {bet.potentialWin && (
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Potential Win</span>
                      <span className="text-emerald-400 font-bold">
                        ${bet.potentialWin}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default LiveBets;
