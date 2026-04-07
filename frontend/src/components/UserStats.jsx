import React from "react";
import { Card } from "./ui/card";
import { TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";

const UserStats = ({ stats }) => {
  const statCards = [
    {
      label: "Total Bets",
      value: stats.totalBets,
      icon: Target,
      color: "text-cyan-400",
      bg: "bg-cyan-900/20",
    },
    {
      label: "Total Wins",
      value: stats.totalWins,
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-900/20",
    },
    {
      label: "Total Losses",
      value: stats.totalLosses,
      icon: TrendingDown,
      color: "text-rose-400",
      bg: "bg-rose-900/20",
    },
    {
      label: "Win Rate",
      value: `${stats.winRate}%`,
      icon: Target,
      color: "text-orange-400",
      bg: "bg-orange-900/20",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Main Stats Card */}
      <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Your Statistics</h3>
          <div className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-xs font-semibold">
            LIVE
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className={`${stat.bg} rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors`}
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                {stat.value}
              </div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Additional Stats */}
      <Card className="bg-gray-900 border-gray-800 p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span className="text-gray-300 text-sm">Biggest Win</span>
            </div>
            <span className="text-emerald-400 font-bold text-lg">
              ${stats.biggestWin.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-cyan-400" />
              <span className="text-gray-300 text-sm">Total Wagered</span>
            </div>
            <span className="text-cyan-400 font-bold text-lg">
              ${stats.totalWagered.toLocaleString()}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UserStats;
