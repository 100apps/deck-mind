import React from 'react';
import { Card, Suit } from '../types';

interface PlayingCardProps {
  card?: Card; // Optional, if undefined, render back
  isBack?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const PlayingCard: React.FC<PlayingCardProps> = ({ card, isBack = false, size = 'md', className = '' }) => {
  
  // Re-calibrated sizes for better visibility
  const sizeClasses = {
    // Used for icons / small indicators
    xs: 'w-6 h-9 text-[0.5rem] rounded-[2px] border', 
    // Used for Opponent Revealed Hands (now larger)
    sm: 'w-12 h-16 text-xs sm:text-sm rounded border', 
    // Standard size
    md: 'w-16 h-22 sm:w-20 sm:h-28 text-base sm:text-xl rounded-md border', 
    // Used for Player's Hand (Main View) - Big & Clear
    lg: 'w-24 h-36 sm:w-28 sm:h-40 text-xl sm:text-2xl rounded-lg border',
    xl: 'w-32 h-48 text-3xl rounded-xl border-2',
  };

  if (isBack || !card) {
    return (
      <div className={`
        relative bg-blue-700 border-white/50 flex items-center justify-center select-none shadow-sm
        ${sizeClasses[size]} ${className}
      `}>
         <div className="w-full h-full border border-dashed border-white/20 rounded-[inherit] flex items-center justify-center">
            <span className="text-white/30 text-lg">🐲</span>
         </div>
      </div>
    );
  }

  const isRed = card.color === 'red';

  const getSuitIcon = (s: Suit) => {
      switch(s) {
          case Suit.CLUBS: return '♣';
          case Suit.DIAMONDS: return '♦';
          case Suit.HEARTS: return '♥';
          case Suit.SPADES: return '♠';
          default: return '';
      }
  };

  const isJoker = card.suit === Suit.NONE;
  // Use '大' (Big) and '小' (Small) for Jokers instead of 'J'
  const displayRank = isJoker ? (card.rank === 'BJ' ? '小' : '大') : card.rank;
  const displaySuit = getSuitIcon(card.suit);
  
  return (
    <div 
      className={`
        relative bg-white flex flex-col justify-between p-0.5 sm:p-1.5 select-none transition-transform
        shadow-[1px_1px_3px_rgba(0,0,0,0.3)]
        ${sizeClasses[size]} 
        ${isRed ? 'text-red-600 border-gray-300' : 'text-black border-gray-300'}
        ${className}
      `}
    >
      {/* Top Left */}
      <div className="flex flex-col items-center leading-none">
        {/* Adjusted font size: 1.0em for Chinese characters (Jokers) looks better than 0.8em */}
        <span className={`font-bold ${isJoker ? 'text-[1.0em]' : 'text-[1.1em]'}`}>{displayRank}</span>
        {!isJoker && <span className="text-[0.9em]">{displaySuit}</span>}
      </div>

      {/* Center Art */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
         <span className={`opacity-100 ${isJoker ? 'text-2xl sm:text-4xl' : 'text-2xl sm:text-4xl'}`}>
             {isJoker ? (card.rank === 'RJ' ? '🤡' : '🃏') : displaySuit}
         </span>
      </div>

      {/* Bottom Right (Rotated) - hidden on very small cards to save space */}
      {size !== 'xs' && (
        <div className="flex flex-col items-center leading-none rotate-180">
            <span className={`font-bold ${isJoker ? 'text-[1.0em]' : 'text-[1.1em]'}`}>{displayRank}</span>
            {!isJoker && <span className="text-[0.9em]">{displaySuit}</span>}
        </div>
      )}
    </div>
  );
};

export default PlayingCard;