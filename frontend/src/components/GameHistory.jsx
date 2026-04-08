import React from "react";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { History, TrendingDown } from "lucide-react";

const GameHistory = ({ history }) => {
  const getMultiplierColor = (multiplier) => {
    if (multiplier < 2) return "text-gray-400";
    if (multiplier < 5) return "text-cyan-400";
    if (multiplier < 10) return "text-emerald-400";
    return "text-orange-400";
  };

  const getMultiplierBg = (multiplier) => {
    if (multiplier < 2) return "bg-gray-800/50";
    if (multiplier < 5) return "bg-cyan-900/30";
    if (multiplier < 10) return "bg-emerald-900/30";
    return "bg-orange-900/30";
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Card className="bg-gray-900 border-gray-800 h-full">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-white">Game History</h3>
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="p-4">
          <div className="space-y-2">
            {history.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No game history</p>
              </div>
            ) : (
              history.map((game) => (
                <div
                  key={game.id}
                  className={`${getMultiplierBg(
                    (game.multiplier || game.crash_point || 1.0)
                  )} hover:bg-gray-800 p-3 rounded-lg border border-gray-700 hover:border-cyan-500/50 transition-all duration-300`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-800 rounded-lg p-2">
                        <TrendingDown className="w-5 h-5 text-rose-500" />
                      </div>
                      <div>
                        <div
                          className={`text-xl font-bold ${getMultiplierColor(
                            (game.multiplier || game.crash_point || 1.0)
                          )}`}
                        >
                          {(game.multiplier || game.crash_point || 1.0).toFixed(2)}x
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(game.timestamp)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-rose-400 font-semibold uppercase">
                        Crashed
                      </div>
                      <div className="text-xs text-gray-500">
                        Round #{game.id}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
};

export default GameHistory;
