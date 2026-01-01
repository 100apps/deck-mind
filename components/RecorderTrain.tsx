import React from 'react';
import { Rank, RemainingCounts, Card } from '../types';
import { X, Eye, EyeOff } from 'lucide-react';

interface RecorderTrainProps {
  counts: RemainingCounts;
  visible: boolean;
  onClose: () => void;
  // History of who played what: Rank -> Array of Player IDs [0, 1, 2]
  playedHistory: Record<Rank, number[]>; 
  userHand: Card[]; // The current user's hand
  showMyHand: boolean;
  onToggleMyHand: () => void;
}

// Order from Big to Small
const RANK_ORDER = [
  Rank.TWO, Rank.ACE, Rank.KING, Rank.QUEEN, Rank.JACK, Rank.TEN, 
  Rank.NINE, Rank.EIGHT, Rank.SEVEN, Rank.SIX, Rank.FIVE, Rank.FOUR, Rank.THREE
];

const RecorderTrain: React.FC<RecorderTrainProps> = ({ 
    counts, visible, onClose, playedHistory, userHand, showMyHand, onToggleMyHand 
}) => {
  if (!visible) return null;

  // Helper to get player color class
  // UPDATED COLORS: Emerald (Me), Blue (Dad), Rose (Mom) for high contrast
  const getPlayerColorClass = (playerId: number) => {
      switch(playerId) {
          case 0: return 'bg-emerald-400 border-emerald-200 shadow-[0_0_10px_rgba(52,211,153,0.6)] text-black'; // Me: Bright Green
          case 1: return 'bg-blue-600 border-blue-400 shadow-blue-500/50 text-white'; // Dad: Deep Blue
          case 2: return 'bg-rose-500 border-rose-300 shadow-rose-500/50 text-white'; // Mom: Bright Pink/Red
          default: return 'bg-gray-500 border-gray-400';
      }
  };

  // Render a specific cell (Carriage or Empty Flatbed)
  const renderCell = (rank: Rank, trainId: number) => {
      // 1. Check if played
      const playedList = playedHistory[rank] || [];
      const isPlayed = trainId <= playedList.length;

      // 2. Check if in my hand (only if toggle is ON)
      let isInMyHand = false;
      if (!isPlayed && showMyHand) {
          const myCount = userHand.filter(c => c.rank === rank).length;
          // E.g., played=1. My hand has 2. 
          // Slots: 1(Played), 2(MyHand), 3(MyHand), 4(Empty)
          const startSlot = playedList.length + 1;
          const endSlot = playedList.length + myCount;
          if (trainId >= startSlot && trainId <= endSlot) {
              isInMyHand = true;
          }
      }

      if (!isPlayed && !isInMyHand) {
          // Empty Flatbed (Not Played Yet, Not in My Hand)
          return (
              <div key={rank} className="w-9 sm:w-11 h-10 sm:h-12 flex items-center justify-center relative px-0.5 opacity-40">
                  {/* Track / Flatbed */}
                  <div className="absolute bottom-2 w-full h-2 bg-gray-700 rounded-sm border border-gray-600"></div>
                  {/* Wheels */}
                  <div className="absolute bottom-1 left-1 w-2 h-2 bg-gray-800 rounded-full"></div>
                  <div className="absolute bottom-1 right-1 w-2 h-2 bg-gray-800 rounded-full"></div>
                  {/* Ghost Number */}
                  <span className="text-gray-600 text-[10px] font-mono mb-2">{rank}</span>
              </div>
          );
      }

      // Filled Carriage (Played OR In My Hand)
      let colorClass = '';
      let isDark = false;

      if (isPlayed) {
          // Get the specific player for this index (trainId 1-based, array 0-based)
          const playerId = playedList[trainId - 1];
          colorClass = getPlayerColorClass(playerId);
      } else if (isInMyHand) {
          // Dark style for "My Hand"
          colorClass = 'bg-indigo-900/80 border-indigo-500/50 text-indigo-200 shadow-none';
          isDark = true;
      }

      return (
        <div key={rank} className="relative w-9 sm:w-11 h-10 sm:h-12 flex items-center justify-center px-0.5 z-10 animate-in zoom-in duration-300">
            {/* Connector */}
            <div className="absolute top-1/2 -left-1 w-2 h-1 bg-black z-0"></div>

            {/* Carriage Body */}
            <div className={`
                w-full h-[85%] mb-1 rounded-sm border-2 flex flex-col items-center justify-center shadow-lg transition-all
                ${colorClass}
            `}>
                {/* Roof Detail (Only for played) */}
                {!isDark && <div className="w-full h-1 bg-white/20"></div>}

                {/* Window with Rank */}
                <div className={`
                    w-[80%] h-[60%] rounded-[2px] border flex items-center justify-center mt-0.5
                    ${isDark 
                        ? 'bg-black/50 border-indigo-400/30' // Dark window
                        : 'bg-white/90 border-black/10 shadow-inner' // Bright window
                    }
                `}>
                    <span className={`text-sm sm:text-base font-black font-mono leading-none tracking-tighter ${isDark ? 'text-indigo-300' : 'text-gray-900'}`}>
                        {rank}
                    </span>
                </div>
            </div>

            {/* Wheels */}
            <div className="absolute bottom-1 left-1.5 w-2.5 h-2.5 bg-black rounded-full border-2 border-gray-600 z-20"></div>
            <div className="absolute bottom-1 right-1.5 w-2.5 h-2.5 bg-black rounded-full border-2 border-gray-600 z-20"></div>
        </div>
      );
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-2 relative">
        
        {/* Close Button */}
        <button 
            onClick={onClose}
            className="absolute top-0 right-2 w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-full text-white/70 hover:text-white z-50 shadow-lg border border-white/10"
        >
            <X size={18} />
        </button>

      <div className="bg-gray-900/95 backdrop-blur-xl pt-3 pb-4 px-3 rounded-t-2xl border-t-4 border-blue-500 shadow-2xl">
        
        {/* Header Legend & Controls */}
        <div className="flex justify-between items-center px-2 mb-3 mr-10">
             <div className="flex items-center gap-3">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                        <span className="text-white font-bold text-xs">记</span>
                    </div>
                    <div className="text-white font-bold text-sm tracking-wide hidden sm:block">记录仪</div>
                 </div>

                 {/* My Hand Toggle */}
                 <button 
                    onClick={onToggleMyHand}
                    className={`
                        flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all
                        ${showMyHand 
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_10px_rgba(79,70,229,0.5)]' 
                            : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'
                        }
                    `}
                 >
                    {showMyHand ? <Eye size={12} /> : <EyeOff size={12} />}
                    {showMyHand ? '透视我牌' : '隐藏我牌'}
                 </button>
             </div>

             {/* Color Legend (Updated to match new colors) */}
             <div className="flex gap-2 sm:gap-3 text-[10px] sm:text-xs">
                 <div className="flex items-center gap-1">
                     <div className="w-3 h-3 rounded-sm bg-emerald-400 border border-white/50"></div>
                     <span className="text-gray-400">我 (绿)</span>
                 </div>
                 <div className="flex items-center gap-1">
                     <div className="w-3 h-3 rounded-sm bg-blue-600 border border-white/50"></div>
                     <span className="text-gray-400">爸 (蓝)</span>
                 </div>
                 <div className="flex items-center gap-1">
                     <div className="w-3 h-3 rounded-sm bg-rose-500 border border-white/50"></div>
                     <span className="text-gray-400">妈 (红)</span>
                 </div>
                 {showMyHand && (
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm bg-indigo-900 border border-indigo-500"></div>
                        <span className="text-indigo-300">手中</span>
                    </div>
                 )}
             </div>
        </div>

        <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 items-start scrollbar-hide">
            
            {/* Left Control Tower (Jokers) */}
            <div className="flex flex-col gap-2 min-w-[60px] bg-gray-800/50 p-2 rounded-lg border border-white/10 shrink-0">
                <div className="text-[10px] text-center text-gray-500">王炸</div>
                {[Rank.RED_JOKER, Rank.BLACK_JOKER].map(joker => {
                     const isRed = joker === Rank.RED_JOKER;
                     const playedList = playedHistory[joker] || [];
                     const isPlayed = playedList.length > 0;
                     
                     // Check my hand for Joker
                     const hasInMyHand = !isPlayed && showMyHand && userHand.some(c => c.rank === joker);

                     // Determine styles
                     let cardStyle = 'bg-black/40 border-gray-700 opacity-40'; // Default Empty
                     
                     if (isPlayed) {
                         const playerId = playedList[0];
                         const baseColor = getPlayerColorClass(playerId);
                         cardStyle = `${baseColor}`;
                     } else if (hasInMyHand) {
                         cardStyle = 'bg-indigo-900/80 border-indigo-500/50 text-indigo-300';
                     }

                     return (
                         <div key={joker} className={`
                            h-14 flex flex-col items-center justify-center rounded border-2 transition-all duration-500 relative
                            ${cardStyle}
                         `}>
                             <span className="text-xl leading-none mb-1">{isRed ? '🤡' : '👺'}</span>
                             <span className="text-[9px] font-bold">
                                 {isRed ? '大王' : '小王'}
                             </span>
                             {isPlayed && <div className="absolute w-full h-0.5 bg-black/30 top-1/2 -rotate-45"></div>}
                         </div>
                     )
                })}
            </div>

            {/* The 4 Tracks System */}
            <div className="flex-1 overflow-x-auto">
                <div className="flex flex-col min-w-max bg-gray-800/30 rounded-lg p-1 border border-white/5">
                    {[4, 3, 2, 1].map((trainId) => (
                        <div key={trainId} className="flex items-center h-12 border-b border-white/5 last:border-0">
                            {/* Locomotive Head */}
                            <div className="w-6 h-full flex items-center justify-center mr-1 opacity-60">
                                <span className="text-[10px] font-mono text-gray-500 transform -rotate-90 whitespace-nowrap">
                                    {trainId === 4 ? '炸弹位' : `No.${trainId}`}
                                </span>
                            </div>

                            {/* Carriages */}
                            {RANK_ORDER.map(rank => renderCell(rank, trainId))}
                        </div>
                    ))}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default RecorderTrain;