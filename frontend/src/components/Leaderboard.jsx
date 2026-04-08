import React from "react";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Trophy, Medal, Award } from "lucide-react";

const Leaderboard = ({ leaders }) => {
  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-600" />;
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-400">
            {rank}
          </div>
        );
    }
  };

  const getRankBg = (rank) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-700/50";
      case 2:
        return "bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-gray-600/50";
      case 3:
        return "bg-gradient-to-r from-orange-900/30 to-red-900/30 border-orange-700/50";
      default:
        return "bg-gray-800/30 border-gray-700";
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800 h-full">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-bold text-white">Leaderboard</h3>
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="p-4 space-y-2">
          {leaders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No leaderboard data</p>
            </div>
          ) : (
            leaders.map((leader) => (
              <div
                key={leader.rank}
                className={`${getRankBg(
                  leader.rank
                )} hover:bg-gray-800 p-3 rounded-lg border transition-all duration-300`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {getRankIcon(leader.rank)}
                    <div>
                      <div className="font-bold text-white">
                        {leader.username}
                      </div>
                      <div className="text-xs text-gray-500">
                        Rank #{leader.rank}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-400">{leader.totalWins.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Total Wins</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-700/50">
                  <div className="text-xs">
                    <span className="text-gray-500">Win Rate: </span>
                    <span className="text-cyan-400 font-semibold">
                      {leader.winRate}%
                    </span>
                  </div>
                  <div className="text-xs text-right">
                    <span className="text-gray-500">Biggest: </span>
                    <span className="text-orange-400 font-semibold">{leader.biggestWin.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default Leaderboard;
