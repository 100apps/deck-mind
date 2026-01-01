import React from 'react';
import { Rank, RemainingCounts } from '../types';

interface RecorderGridProps {
  counts: RemainingCounts;
  visible: boolean;
}

const ORDERED_RANKS = [
  Rank.RED_JOKER, Rank.BLACK_JOKER, Rank.TWO, Rank.ACE, Rank.KING, Rank.QUEEN, 
  Rank.JACK, Rank.TEN, Rank.NINE, Rank.EIGHT, Rank.SEVEN, Rank.SIX, Rank.FIVE, Rank.FOUR, Rank.THREE
];

const RecorderGrid: React.FC<RecorderGridProps> = ({ counts, visible }) => {
  if (!visible) return null;

  return (
    <div className="bg-black/80 text-white p-3 rounded-lg shadow-xl backdrop-blur-sm w-full max-w-2xl mx-auto border border-white/20">
      <h3 className="text-xs text-gray-400 mb-2 uppercase tracking-widest text-center">记牌器 (还剩几张?)</h3>
      <div className="grid grid-cols-8 gap-2 sm:gap-4">
        {ORDERED_RANKS.map((rank) => {
          const count = counts[rank];
          // Heatmap coloring logic for counts
          let countColor = 'text-gray-500'; // 0
          if (count === 4) countColor = 'text-red-500 font-bold';
          if (count === 3) countColor = 'text-orange-400 font-bold';
          if (count === 2) countColor = 'text-yellow-300';
          if (count === 1) countColor = 'text-white';
          
          // Rank label cleanup
          const label = rank === Rank.RED_JOKER ? '大王' : rank === Rank.BLACK_JOKER ? '小王' : rank;

          return (
            <div key={rank} className="flex flex-col items-center p-1 bg-white/10 rounded">
              <span className="text-[10px] sm:text-xs text-gray-400 font-medium">{label}</span>
              <span className={`text-lg sm:text-2xl ${countColor}`}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecorderGrid;