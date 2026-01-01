import { Card, Rank, Suit, Player } from '../types';

const RANK_VALUES: Record<Rank, number> = {
  [Rank.THREE]: 3,
  [Rank.FOUR]: 4,
  [Rank.FIVE]: 5,
  [Rank.SIX]: 6,
  [Rank.SEVEN]: 7,
  [Rank.EIGHT]: 8,
  [Rank.NINE]: 9,
  [Rank.TEN]: 10,
  [Rank.JACK]: 11,
  [Rank.QUEEN]: 12,
  [Rank.KING]: 13,
  [Rank.ACE]: 14,
  [Rank.TWO]: 15,
  [Rank.BLACK_JOKER]: 16,
  [Rank.RED_JOKER]: 17,
};

export enum HandType {
  SINGLE = 'SINGLE',
  PAIR = 'PAIR',
  TRIPLE = 'TRIPLE', // Simplified: Triple only (aircraft/kicker logic omitted for brevity in training app)
  BOMB = 'BOMB',
  ROCKET = 'ROCKET', // King Bomb
  INVALID = 'INVALID'
}

interface AnalyzedHand {
  type: HandType;
  value: number; // The value used to compare (e.g., value of the pair)
  length: number;
}

export const generateDeck = (): Card[] => {
  const deck: Card[] = [];
  const suits = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];
  const ranks = [
    Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX, Rank.SEVEN, Rank.EIGHT, Rank.NINE,
    Rank.TEN, Rank.JACK, Rank.QUEEN, Rank.KING, Rank.ACE, Rank.TWO
  ];

  let idCounter = 0;
  ranks.forEach(rank => {
    suits.forEach(suit => {
      deck.push({
        id: `card-${idCounter++}`,
        rank,
        suit,
        value: RANK_VALUES[rank],
        color: (suit === Suit.HEARTS || suit === Suit.DIAMONDS) ? 'red' : 'black'
      });
    });
  });

  deck.push({ id: `card-${idCounter++}`, rank: Rank.BLACK_JOKER, suit: Suit.NONE, value: RANK_VALUES[Rank.BLACK_JOKER], color: 'black' });
  deck.push({ id: `card-${idCounter++}`, rank: Rank.RED_JOKER, suit: Suit.NONE, value: RANK_VALUES[Rank.RED_JOKER], color: 'red' });

  return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

export const sortHand = (hand: Card[]): Card[] => {
    return [...hand].sort((a, b) => b.value - a.value); // High to low
};

export const dealCards = (): { hands: Card[][], landlordIndex: number } => {
    const deck = shuffleDeck(generateDeck());
    const landlordIndex = Math.floor(Math.random() * 3); // Random landlord
    
    const p1: Card[] = [];
    const p2: Card[] = [];
    const p3: Card[] = [];
    const holeCards: Card[] = []; 

    for (let i = 0; i < 51; i++) {
        if (i % 3 === 0) p1.push(deck[i]);
        if (i % 3 === 1) p2.push(deck[i]);
        if (i % 3 === 2) p3.push(deck[i]);
    }
    holeCards.push(deck[51], deck[52], deck[53]);

    const hands = [p1, p2, p3];
    hands[landlordIndex] = [...hands[landlordIndex], ...holeCards];
    
    return {
        hands: hands.map(h => sortHand(h)),
        landlordIndex
    };
};

export const getInitialCounts = (): Record<Rank, number> => {
  const counts = {} as Record<Rank, number>;
  Object.values(Rank).forEach(r => {
    if (r === Rank.BLACK_JOKER || r === Rank.RED_JOKER) {
      counts[r] = 1;
    } else {
      counts[r] = 4;
    }
  });
  return counts;
};

// --- RULES ENGINE ---

const analyzeHand = (cards: Card[]): AnalyzedHand => {
    if (cards.length === 0) return { type: HandType.INVALID, value: 0, length: 0 };
    
    const sorted = [...cards].sort((a, b) => a.value - b.value); // Low to High
    
    // Single
    if (cards.length === 1) {
        return { type: HandType.SINGLE, value: sorted[0].value, length: 1 };
    }

    // Rocket (King Bomb)
    if (cards.length === 2 && sorted[0].rank === Rank.BLACK_JOKER && sorted[1].rank === Rank.RED_JOKER) {
        return { type: HandType.ROCKET, value: 999, length: 2 };
    }

    // Pair
    if (cards.length === 2 && sorted[0].value === sorted[1].value) {
        return { type: HandType.PAIR, value: sorted[0].value, length: 2 };
    }

    // Triple
    if (cards.length === 3 && sorted[0].value === sorted[2].value) {
         return { type: HandType.TRIPLE, value: sorted[0].value, length: 3 };
    }

    // Bomb
    if (cards.length === 4 && sorted[0].value === sorted[3].value) {
        return { type: HandType.BOMB, value: sorted[0].value, length: 4 };
    }

    // Simplified: We treat other complex hands as INVALID for this auto-player to keep logic simple
    // A real engine would support straights, airplanes, etc.
    return { type: HandType.INVALID, value: 0, length: 0 };
}

// Extract subsets from hand
const getPossibleHands = (hand: Card[], type: HandType): Card[][] => {
    const sorted = [...hand].sort((a, b) => a.value - b.value);
    const results: Card[][] = [];

    if (type === HandType.SINGLE) {
        // Return unique singles
        const seen = new Set();
        sorted.forEach(c => {
            if(!seen.has(c.value)) {
                results.push([c]);
                seen.add(c.value);
            }
        });
    } else if (type === HandType.PAIR) {
        for (let i = 0; i < sorted.length - 1; i++) {
            if (sorted[i].value === sorted[i+1].value) {
                // Check if already added this rank
                if (results.length === 0 || results[results.length-1][0].value !== sorted[i].value) {
                    results.push([sorted[i], sorted[i+1]]);
                }
            }
        }
    } else if (type === HandType.TRIPLE) {
        for (let i = 0; i < sorted.length - 2; i++) {
             if (sorted[i].value === sorted[i+2].value) {
                 if (results.length === 0 || results[results.length-1][0].value !== sorted[i].value) {
                    results.push([sorted[i], sorted[i+1], sorted[i+2]]);
                 }
             }
        }
    } else if (type === HandType.BOMB) {
        for (let i = 0; i < sorted.length - 3; i++) {
            if (sorted[i].value === sorted[i+3].value) {
                 results.push([sorted[i], sorted[i+1], sorted[i+2], sorted[i+3]]);
            }
        }
    } else if (type === HandType.ROCKET) {
        const bj = sorted.find(c => c.rank === Rank.BLACK_JOKER);
        const rj = sorted.find(c => c.rank === Rank.RED_JOKER);
        if (bj && rj) results.push([bj, rj]);
    }

    return results;
}


// Primary Logic Function
export const pickHandFromPlayer = (hand: Card[], tableCards: Card[]): Card[] => {
  if (hand.length === 0) return [];

  const tableAnalysis = analyzeHand(tableCards);

  // --- SITUATION 1: FREE PLAY (Table is empty or Invalid) ---
  if (tableCards.length === 0 || tableAnalysis.type === HandType.INVALID) {
      // Priority: Try to play Triple > Pair > Single (Smallest first)
      const triples = getPossibleHands(hand, HandType.TRIPLE);
      if (triples.length > 0) return triples[0];

      const pairs = getPossibleHands(hand, HandType.PAIR);
      if (pairs.length > 0) return pairs[0];

      // Play smallest single
      // Sort hand low to high
      const sorted = [...hand].sort((a,b) => a.value - b.value);
      return [sorted[0]];
  }

  // --- SITUATION 2: MUST BEAT TABLE ---
  
  // 1. Try to beat with same type
  if (tableAnalysis.type !== HandType.BOMB && tableAnalysis.type !== HandType.ROCKET) {
      const candidates = getPossibleHands(hand, tableAnalysis.type);
      const winner = candidates.find(c => analyzeHand(c).value > tableAnalysis.value);
      if (winner) return winner;
  }

  // 2. Try to beat with Bomb (if table is not Rocket)
  if (tableAnalysis.type !== HandType.ROCKET) {
      const bombs = getPossibleHands(hand, HandType.BOMB);
      if (tableAnalysis.type === HandType.BOMB) {
          // Must find higher bomb
          const higherBomb = bombs.find(b => analyzeHand(b).value > tableAnalysis.value);
          if (higherBomb) return higherBomb;
      } else {
          // Any bomb beats non-bomb
          if (bombs.length > 0) return bombs[0];
      }
  }

  // 3. Try to beat with Rocket
  const rocket = getPossibleHands(hand, HandType.ROCKET);
  if (rocket.length > 0) return rocket[0];

  // --- SITUATION 3: PASS ---
  return []; 
};

export const extractCards = (originalHand: Card[], cardsToRemove: Card[]): Card[] => {
    const idsToRemove = new Set(cardsToRemove.map(c => c.id));
    return originalHand.filter(c => !idsToRemove.has(c.id));
}

// --- SPEECH UTILS ---
export const getHandSpeakText = (cards: Card[]): string => {
  if (!cards || cards.length === 0) return "不要";

  const analysis = analyzeHand(cards);
  
  // Helper to speak rank
  const speakRank = (r: Rank) => {
    switch (r) {
      case Rank.TWO: return "二";
      case Rank.ACE: return "尖";
      case Rank.KING: return "K";
      case Rank.QUEEN: return "皮蛋";
      case Rank.JACK: return "钩";
      case Rank.TEN: return "十";
      case Rank.BLACK_JOKER: return "小王";
      case Rank.RED_JOKER: return "大王";
      default: return r; // 3-9
    }
  };

  const rankText = cards.length > 0 ? speakRank(cards[0].rank) : "";

  switch (analysis.type) {
    case HandType.SINGLE:
      return `${rankText}`; // "3", "2"
    case HandType.PAIR:
      return `对${rankText}`; // "对3"
    case HandType.TRIPLE:
      return `三个${rankText}`; // "三个3"
    case HandType.BOMB:
      return `四个${rankText} 炸弹`; // "四个3 炸弹"
    case HandType.ROCKET:
      return "王炸";
    default:
      return "一手牌";
  }
};