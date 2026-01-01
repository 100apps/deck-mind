import React, { useRef, useState, useEffect } from 'react';
import { Player } from '../types';
import PlayingCard from './PlayingCard';
import { Upload, Eye, EyeOff } from 'lucide-react';

interface PlayerSpotProps {
  player: Player;
  isActive: boolean;
  onAvatarChange: (playerId: number, file: File) => void;
  className?: string;
}

const PlayerSpot: React.FC<PlayerSpotProps> = ({ player, isActive, onAvatarChange, className = '' }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imgSrc, setImgSrc] = useState(player.avatarUrl);
  const [showHand, setShowHand] = useState(false);

  // Sync state with props
  useEffect(() => {
    setImgSrc(player.avatarUrl);
  }, [player.avatarUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onAvatarChange(player.id, e.target.files[0]);
    }
  };

  const handleImageError = () => {
    // Fallback to initials if cartoon style fails
    setImgSrc(`https://api.dicebear.com/9.x/initials/svg?seed=${player.name}`);
  };

  return (
    <div className={`flex flex-col items-center gap-2 relative ${className}`}>
      
      {/* Avatar Circle */}
      <div className="relative group z-10">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`
            w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 overflow-hidden bg-gray-200 shadow-lg cursor-pointer transition-all
            ${isActive ? 'border-yellow-400 scale-110 shadow-yellow-500/50' : 'border-white/50'}
            ${player.isLandlord ? 'ring-2 ring-offset-2 ring-red-500' : ''}
          `}
        >
          <img 
            src={imgSrc} 
            alt={player.name} 
            className="w-full h-full object-cover" 
            onError={handleImageError}
          />
          
          {/* Hover Upload Icon */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Upload size={20} className="text-white" />
          </div>
        </div>
        
        {/* Role Badge */}
        {player.isLandlord && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm border border-white">
            地主
          </span>
        )}
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange}
        />
      </div>

      {/* Name & Count */}
      <div className="bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full text-center min-w-[80px] relative z-20">
        <div className="text-white text-xs font-bold truncate max-w-[80px]">{player.name}</div>
        <div className="text-yellow-300 text-xs font-mono">{player.hand.length} 张</div>
        
        {/* Reveal Hand Toggle Button (Only for opponents) */}
        {!player.isUser && (
             <button 
                onClick={(e) => { e.stopPropagation(); setShowHand(!showHand); }}
                className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center border border-white/20 shadow-lg z-20"
                title={showHand ? "隐藏手牌" : "查看手牌"}
             >
                {showHand ? <EyeOff size={12} /> : <Eye size={12} />}
             </button>
        )}
      </div>

      {/* Hand Display (Opponent) */}
      {!player.isUser && player.hand.length > 0 && (
         <div className="absolute top-full mt-2 z-50">
             {showHand ? (
                 // REVEALED HAND: Floating overlay, larger cards (sm), linear spread
                 <div className="bg-black/60 p-2 rounded-xl backdrop-blur-md shadow-2xl border border-white/10 min-w-max -translate-x-1/2 left-1/2">
                     <div className="flex -space-x-5">
                         {player.hand.map((card, idx) => (
                             <div key={card.id} className="hover:z-10 transition-transform hover:-translate-y-2 origin-bottom">
                                 <PlayingCard card={card} size="sm" className="shadow-lg" />
                             </div>
                         ))}
                     </div>
                 </div>
             ) : (
                 // HIDDEN HAND: Small icon showing count
                 <div className="relative w-8 h-10 animate-in zoom-in opacity-80 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setShowHand(true)}>
                     <PlayingCard isBack size="xs" className="absolute top-0 left-0 shadow-lg" />
                     <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm border border-white/20">
                         {player.hand.length}
                     </div>
                 </div>
             )}
         </div>
      )}
    </div>
  );
};

export default PlayerSpot;