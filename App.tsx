import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Player, RemainingCounts, Rank } from './types';
import { dealCards, getInitialCounts, pickHandFromPlayer, sortHand, extractCards, getHandSpeakText } from './utils/cardLogic';
import { speakText } from './utils/soundUtils';
import PlayingCard from './components/PlayingCard';
import RecorderTrain from './components/RecorderTrain';
import PlayerSpot from './components/PlayerSpot';
import QuizModal from './components/QuizModal';
import { Eye, EyeOff, Play, RotateCcw, Brain, Trophy, Pause, Zap } from 'lucide-react';

// Family Avatars (Photos from photo directory)
import xiaoyingImg from './photo/xiaoying.png';
import laoyingImg from './photo/laoying.png';
import laoshuImg from './photo/laoshu.png';

// Family Avatars (Photos from photo directory) — imported so Vite bundles them
const AVATAR_CONFIGS = [
    // 小赢 (Xiao Ying - Me)
    xiaoyingImg,

    // 老赢 (Lao Ying - Dad)
    laoyingImg,

    // 老输 (Lao Shu - Mom)
    laoshuImg
];

const App: React.FC = () => {
    // --- Game State ---
    const [players, setPlayers] = useState<Player[]>([]);
    const [turnIndex, setTurnIndex] = useState<number>(0);
    const [lastPlayerId, setLastPlayerId] = useState<number>(0); // Who played the last cards on table
    const [currentTableHand, setCurrentTableHand] = useState<Card[]>([]);
    const [remainingCounts, setRemainingCounts] = useState<RemainingCounts>(getInitialCounts());

    // Track WHO played which rank. Key: Rank, Value: Array of Player IDs who played it.
    const [playedCardHistory, setPlayedCardHistory] = useState<Record<Rank, number[]>>({} as any);

    // --- History & Stats ---
    const [playedHistoryCount, setPlayedHistoryCount] = useState(0);

    // --- UI State ---
    const [showRecorder, setShowRecorder] = useState(false);
    const [showMyHandInRecorder, setShowMyHandInRecorder] = useState(false); // Toggle to show my hand in recorder
    const [isQuizOpen, setIsQuizOpen] = useState(false);
    const [score, setScore] = useState(0);
    const [quizStreak, setQuizStreak] = useState(0);
    const [message, setMessage] = useState("点击开始游戏");

    // --- Auto Play State ---
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);
    const [autoPlaySpeed, setAutoPlaySpeed] = useState(1500);
    const timerRef = useRef<number | null>(null);

    // Initialize Game
    const startNewGame = useCallback(() => {
        const { hands, landlordIndex } = dealCards();

        // Define Family Players
        const newPlayers: Player[] = [
            {
                id: 0, name: '小赢 (我)', isUser: true, isLandlord: landlordIndex === 0,
                hand: hands[0], avatarUrl: AVATAR_CONFIGS[0]
            },
            {
                id: 1, name: '老赢 (爸)', isUser: false, isLandlord: landlordIndex === 1,
                hand: hands[1], avatarUrl: AVATAR_CONFIGS[1]
            },
            {
                id: 2, name: '老输 (妈)', isUser: false, isLandlord: landlordIndex === 2,
                hand: hands[2], avatarUrl: AVATAR_CONFIGS[2]
            },
        ];

        setPlayers(newPlayers);
        setTurnIndex(landlordIndex);
        setLastPlayerId(landlordIndex);
        setCurrentTableHand([]);
        setRemainingCounts(getInitialCounts());
        setPlayedCardHistory({} as any); // Reset history
        setPlayedHistoryCount(0);
        setIsAutoPlaying(false);
        setMessage(`游戏开始！地主是 ${newPlayers[landlordIndex].name}`);
    }, []);

    useEffect(() => {
        startNewGame();
    }, []);

    // Action: Play Turn
    const playNext = useCallback(() => {
        if (players.length === 0) return;

        // Check game over
        if (players.some(p => p.hand.length === 0)) {
            setIsAutoPlaying(false);
            setMessage("游戏结束！");
            return;
        }

        const currentPlayer = players[turnIndex];
        let cardsToPlay: Card[] = [];

        // Is it a new round?
        const isFreePlay = currentTableHand.length === 0 || lastPlayerId === currentPlayer.id;

        // Logic to pick cards
        const tableCards = isFreePlay ? [] : currentTableHand;
        cardsToPlay = pickHandFromPlayer(currentPlayer.hand, tableCards);

        if (cardsToPlay.length > 0) {
            // Player Plays Cards
            const newHand = extractCards(currentPlayer.hand, cardsToPlay);

            // 1. Speak the hand (TTS)
            const speechText = getHandSpeakText(cardsToPlay);
            speakText(speechText, currentPlayer.id);

            setPlayers(prev => prev.map(p =>
                p.id === currentPlayer.id ? { ...p, hand: newHand } : p
            ));

            setCurrentTableHand(cardsToPlay);
            setLastPlayerId(currentPlayer.id);

            // Update counts AND History
            setRemainingCounts(prev => {
                const newCounts = { ...prev };
                cardsToPlay.forEach(card => {
                    newCounts[card.rank] = Math.max(0, newCounts[card.rank] - 1);
                });
                return newCounts;
            });

            setPlayedCardHistory(prev => {
                const newHistory = { ...prev };
                cardsToPlay.forEach(card => {
                    if (!newHistory[card.rank]) newHistory[card.rank] = [];
                    newHistory[card.rank].push(currentPlayer.id);
                });
                return newHistory;
            });

            setMessage(`${currentPlayer.name} 出牌`);
            setPlayedHistoryCount(c => c + 1);
        } else {
            // Player Passes
            speakText("不要", currentPlayer.id);
            setMessage(`${currentPlayer.name} 不要`);
        }

        // Move to next player
        setTurnIndex((turnIndex + 1) % 3);

        // Quiz Trigger
        if (playedHistoryCount > 0 && playedHistoryCount % 8 === 0 && Math.random() < 0.3 && !isQuizOpen) {
            setIsAutoPlaying(false);
            setIsQuizOpen(true);
        }

    }, [players, turnIndex, lastPlayerId, currentTableHand, isQuizOpen, playedHistoryCount]);

    useEffect(() => {
        if (isAutoPlaying && !isQuizOpen && !players.some(p => p.hand.length === 0)) {
            timerRef.current = window.setInterval(() => {
                playNext();
            }, autoPlaySpeed);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isAutoPlaying, isQuizOpen, playNext, autoPlaySpeed, players]);

    const handleAvatarChange = (id: number, file: File) => {
        const url = URL.createObjectURL(file);
        setPlayers(prev => prev.map(p => p.id === id ? { ...p, avatarUrl: url } : p));
    };

    const handleQuizComplete = (correct: boolean) => {
        if (correct) {
            setScore(s => s + 10);
            setQuizStreak(s => s + 1);
        } else {
            setQuizStreak(0);
        }
        setIsQuizOpen(false);
    };

    const remainingCountTotal = Object.values(remainingCounts).reduce((a: number, b: number) => a + b, 0);

    // Helper to get animation class based on who played
    const getPlayAnimationClass = () => {
        if (lastPlayerId === 0) return 'animate-fly-from-bottom'; // User
        if (lastPlayerId === 1) return 'animate-fly-from-right';  // Right Bot
        if (lastPlayerId === 2) return 'animate-fly-from-left';   // Left Bot
        return 'animate-in zoom-in'; // Default
    };

    if (players.length === 0) return <div className="text-white">Loading...</div>;

    const myHand = players[0].hand;

    return (
        <div className="min-h-screen flex flex-col items-center p-2 text-white overflow-hidden relative bg-[#1a472a]">
            <style>{`
        @keyframes flyFromBottom {
          0% { transform: translateY(150%) scale(0.6); opacity: 0; }
          60% { transform: translateY(-10%) scale(1.05); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes flyFromRight {
          0% { transform: translate(150%, -150%) scale(0.6); opacity: 0; }
          60% { transform: translate(-10%, 10%) scale(1.05); opacity: 1; }
          100% { transform: translate(0, 0) scale(1); opacity: 1; }
        }
        @keyframes flyFromLeft {
          0% { transform: translate(-150%, -150%) scale(0.6); opacity: 0; }
          60% { transform: translate(10%, 10%) scale(1.05); opacity: 1; }
          100% { transform: translate(0, 0) scale(1); opacity: 1; }
        }
        .animate-fly-from-bottom { animation: flyFromBottom 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .animate-fly-from-right { animation: flyFromRight 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .animate-fly-from-left { animation: flyFromLeft 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
      `}</style>

            {/* --- Game Board --- */}
            <div className="relative w-full max-w-6xl h-[90vh] flex flex-col items-center">

                {/* Header */}
                <div className="absolute top-2 left-2 z-20 bg-black/40 backdrop-blur px-4 py-2 rounded-xl border border-white/10 shadow-lg">
                    <h1 className="text-sm sm:text-lg font-bold flex items-center gap-2">
                        <span>🚄</span> 斗地主记牌
                    </h1>
                    <div className="flex gap-4 text-xs sm:text-sm text-yellow-300 mt-1 font-mono">
                        <span>积分: {score}</span>
                        <span>剩余: {remainingCountTotal}</span>
                    </div>
                </div>

<<<<<<< HEAD
                {/* --- Players --- */}
                <div className="absolute top-20 left-4 sm:left-12 z-10 transition-all duration-300">
                    <PlayerSpot
                        player={players[2]}
                        isActive={turnIndex === 2}
                        onAvatarChange={handleAvatarChange}
                        className={turnIndex === 2 ? 'scale-110 opacity-100' : 'opacity-80 scale-90'}
                    />
                    {lastPlayerId === 2 && turnIndex !== 2 && (
                        <div className="absolute top-10 -right-20 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded animate-bounce">大！</div>
                    )}
                </div>

                <div className="absolute top-20 right-4 sm:right-12 z-10 transition-all duration-300">
                    <PlayerSpot
                        player={players[1]}
                        isActive={turnIndex === 1}
                        onAvatarChange={handleAvatarChange}
                        className={turnIndex === 1 ? 'scale-110 opacity-100' : 'opacity-80 scale-90'}
                    />
                    {lastPlayerId === 1 && turnIndex !== 1 && (
                        <div className="absolute top-10 -left-20 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded animate-bounce">大！</div>
                    )}
                </div>

                {/* --- Center Table --- */}
                <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 w-[95%] sm:w-[60%] h-[220px] flex flex-col items-center justify-center">
                    <div className="absolute inset-0 bg-green-800/60 rounded-[3rem] border-8 border-yellow-900/40 shadow-inner"></div>
                    <div className="absolute -top-6 bg-yellow-100 text-yellow-900 px-6 py-1 rounded-full text-sm font-bold shadow-lg z-20 border-2 border-yellow-400 transition-all">
                        {message}
                    </div>
                    <div className="relative z-10 h-36 flex items-center justify-center">
                        {currentTableHand.length > 0 ? (
                            <div
                                key={`${lastPlayerId}-${playedHistoryCount}`}
                                className={`flex justify-center -space-x-4 sm:-space-x-5 pl-4 ${getPlayAnimationClass()}`}
                            >
                                {currentTableHand.map((card, index) => (
                                    <PlayingCard
                                        key={card.id}
                                        card={card}
                                        size="md"
                                        className="transform shadow-[0_5px_15px_rgba(0,0,0,0.5)] origin-bottom"
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-white/20 font-bold text-2xl uppercase tracking-widest border-2 border-dashed border-white/10 p-4 rounded-xl">
                                空
                            </div>
                        )}
                    </div>
                </div>

                {/* --- Bottom: My Player --- */}
                <div className="absolute bottom-[18%] sm:bottom-[15%] left-1/2 -translate-x-1/2 z-20 w-full px-2">
                    <div className="flex flex-col items-center">
                        {/* Updated My Hand Container: Larger Cards (lg) and Adjusted Spacing */}
                        <div className="flex justify-center -space-x-8 sm:-space-x-12 py-4 min-h-[140px] sm:min-h-[160px] overflow-visible w-full px-4">
                            {sortHand(players[0].hand).map((card, idx) => (
                                <div key={card.id}
                                    className="transform hover:-translate-y-6 transition-transform duration-200 cursor-pointer origin-bottom"
                                    style={{ zIndex: idx }}
                                >
                                    <PlayingCard card={card} size="lg" className="shadow-lg border-gray-300" />
                                </div>
                            ))}
                        </div>
                        <div className="mt-1 flex items-center gap-4 bg-black/50 px-6 py-2 rounded-full border border-white/10 backdrop-blur shadow-xl">
                            <PlayerSpot
                                player={players[0]}
                                isActive={turnIndex === 0}
                                onAvatarChange={handleAvatarChange}
                                className="scale-90"
                            />
                            <div className="text-left">
                                <div className="text-yellow-400 font-bold text-sm sm:text-base">我的手牌</div>
                                {lastPlayerId === 0 && turnIndex !== 0 && (
                                    <span className="text-xs bg-red-500 px-2 py-0.5 rounded text-white font-bold ml-2">我最大</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Controls --- */}
                <div className="absolute bottom-4 w-full flex flex-col items-center gap-3 z-30 pointer-events-none">
                    <div className="pointer-events-auto flex flex-col items-center gap-2 w-full max-w-lg">
                        <div className="flex gap-3 bg-gray-900/80 p-2 rounded-2xl backdrop-blur-md border border-white/20 shadow-2xl w-full justify-center">
                            <button
                                onClick={playNext}
                                className="flex-1 flex justify-center items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-yellow-950 px-4 py-3 rounded-xl font-black text-lg shadow-lg active:scale-95 transition-all"
                            >
                                <Play size={20} fill="currentColor" /> 下一步
                            </button>

                            <button
                                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                                className={`flex-1 flex justify-center items-center gap-2 px-4 py-3 rounded-xl font-black text-lg shadow-lg active:scale-95 transition-all ${isAutoPlaying ? 'bg-red-500 text-white' : 'bg-green-600 text-white'}`}
                            >
                                {isAutoPlaying ? <Pause size={20} fill="currentColor" /> : <Zap size={20} fill="currentColor" />}
                                {isAutoPlaying ? '暂停' : '自动'}
                            </button>

                            <button
                                onClick={startNewGame}
                                className="w-14 flex justify-center items-center bg-white hover:bg-gray-200 text-gray-800 rounded-xl shadow-lg active:scale-95 transition-all"
                            >
                                <RotateCcw size={20} />
                            </button>
                        </div>

                        <button
                            onClick={() => setShowRecorder(!showRecorder)}
                            className="pointer-events-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 text-sm transition-all"
                        >
                            {showRecorder ? <EyeOff size={16} /> : <Eye size={16} />}
                            {showRecorder ? '记牌器' : '打开记牌器'}
                        </button>
                    </div>
                </div>

            </div>

            {/* --- Train Recorder Overlay --- */}
            <div className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${showRecorder ? 'translate-y-0' : 'translate-y-[110%]'}`}>
                <div className="bg-gray-900/95 backdrop-blur-xl border-t-4 border-blue-500 pb-6 pt-2 rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.7)]">
                    <div className="w-16 h-1.5 bg-gray-600 rounded-full mx-auto mb-4 opacity-50" />
                    <RecorderTrain
                        counts={remainingCounts}
                        visible={true}
                        onClose={() => setShowRecorder(false)}
                        playedHistory={playedCardHistory}
                        userHand={myHand}
                        showMyHand={showMyHandInRecorder}
                        onToggleMyHand={() => setShowMyHandInRecorder(!showMyHandInRecorder)}
                    />
                </div>
            </div>

            {/* --- Quiz Modal --- */}
            <QuizModal
                isOpen={isQuizOpen}
                actualCounts={remainingCounts}
                onComplete={handleQuizComplete}
                onClose={() => { setIsQuizOpen(false); setIsAutoPlaying(false); }}
            />

=======
                <button 
                    onClick={() => setShowRecorder(!showRecorder)}
                    className="pointer-events-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 text-sm transition-all"
                >
                    {showRecorder ? <EyeOff size={16}/> : <Eye size={16}/>} 
                    {showRecorder ? '记牌器'}
                </button>
             </div>
>>>>>>> 51b5e41b4cc7801c5e694c6dad2e6e069ec80e92
        </div>
    );
};

export default App;