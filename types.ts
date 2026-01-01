export enum Suit {
  HEARTS = '♥',
  DIAMONDS = '♦',
  CLUBS = '♣',
  SPADES = '♠',
  NONE = '' // For Jokers
}

export enum Rank {
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  EIGHT = '8',
  NINE = '9',
  TEN = '10',
  JACK = 'J',
  QUEEN = 'Q',
  KING = 'K',
  ACE = 'A',
  TWO = '2',
  BLACK_JOKER = 'BJ',
  RED_JOKER = 'RJ'
}

export interface Card {
  id: string; // unique ID for React keys
  suit: Suit;
  rank: Rank;
  value: number; // For sorting and logic (3=3, ..., 2=15, BJ=16, RJ=17)
  color: 'red' | 'black';
}

export interface Player {
  id: number;
  name: string;
  isUser: boolean; // True if it's "Me"
  isLandlord: boolean;
  hand: Card[];
  avatarUrl: string; // Blob URL or default
}

export interface HandRecord {
  cards: Card[];
  playerId: number;
  timestamp: number;
}

export type RemainingCounts = Record<Rank, number>;