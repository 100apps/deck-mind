import React, { useState, useEffect } from 'react';
import { Rank, RemainingCounts } from '../types';

interface QuizModalProps {
  isOpen: boolean;
  actualCounts: RemainingCounts;
  onComplete: (correct: boolean) => void;
  onClose: () => void;
}

const QuizModal: React.FC<QuizModalProps> = ({ isOpen, actualCounts, onComplete, onClose }) => {
  const [targetRank, setTargetRank] = useState<Rank>(Rank.ACE);
  const [userGuess, setUserGuess] = useState<string>('');
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');

  useEffect(() => {
    if (isOpen) {
      // Pick a random rank to quiz on, focusing on "Important" cards more often
      const weightedRanks = [
        Rank.RED_JOKER, Rank.BLACK_JOKER, Rank.TWO, Rank.TWO, Rank.ACE, Rank.ACE,
        Rank.KING, Rank.SEVEN, Rank.TEN, Rank.JACK, Rank.QUEEN
      ];
      // Fallback to any random rank if math random hits high
      const allRanks = Object.values(Rank);
      const pool = Math.random() > 0.3 ? weightedRanks : allRanks;
      
      const randomRank = pool[Math.floor(Math.random() * pool.length)];
      setTargetRank(randomRank);
      setUserGuess('');
      setFeedback('none');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const actual = actualCounts[targetRank];
    const isCorrect = parseInt(userGuess) === actual;

    setFeedback(isCorrect ? 'correct' : 'wrong');
    
    setTimeout(() => {
      onComplete(isCorrect);
    }, 1500);
  };

  if (!isOpen) return null;

  const getChineseRankName = (r: Rank) => {
      if (r === Rank.RED_JOKER) return '大王';
      if (r === Rank.BLACK_JOKER) return '小王';
      return r;
  }

  const displayRank = getChineseRankName(targetRank);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border-4 border-yellow-500">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">⚡ 考考你的记忆力</h2>
          <p className="text-gray-600 mt-2">只有高手才能答对哦！</p>
        </div>

        {feedback === 'none' ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="text-center">
              <span className="block text-gray-500 text-sm uppercase font-bold tracking-wider">外面还剩几张</span>
              <span className="block text-5xl font-black text-indigo-600 my-2">{displayRank}</span>
              <span className="block text-gray-500 text-sm uppercase font-bold tracking-wider">没出？</span>
            </div>

            <div className="grid grid-cols-5 gap-2 mt-4">
              {[0, 1, 2, 3, 4].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setUserGuess(num.toString())}
                  className={`
                    py-3 text-xl font-bold rounded-lg transition-all
                    ${userGuess === num.toString() 
                      ? 'bg-indigo-600 text-white scale-110 shadow-lg' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                  `}
                >
                  {num}
                </button>
              ))}
            </div>

            <button 
              type="submit" 
              disabled={userGuess === ''}
              className="mt-4 w-full bg-indigo-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确定，检查答案！
            </button>
          </form>
        ) : (
          <div className="text-center py-8 animate-in zoom-in duration-200">
            {feedback === 'correct' ? (
              <>
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-green-600">答对啦！</h3>
                <p className="text-gray-600">你真是个记牌小天才！</p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">❌</div>
                <h3 className="text-2xl font-bold text-red-600">哎呀，记错了</h3>
                <p className="text-gray-800 text-lg mt-2">
                  其实还剩下 <span className="font-bold text-red-600">{actualCounts[targetRank]}</span> 张。
                </p>
                <p className="text-sm text-gray-500 mt-2">加油，下次一定行！</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizModal;