import * as PokerSolver from 'pokersolver';
import { Card } from './types';
import { cardToPokerSolver } from './card';

export interface HandResult {
  rank: number;
  name: string;
  cards: Card[];
  description: string;
  solverHand: PokerSolver.Hand;
}

const HAND_RANKS = [
  'High Card',
  'Pair',
  'Two Pair',
  'Three of a Kind',
  'Straight',
  'Flush',
  'Full House',
  'Four of a Kind',
  'Straight Flush',
  'Royal Flush'
];

export function evaluateHand(holeCards: Card[], communityCards: Card[]): HandResult {
  const allCards = [...holeCards, ...communityCards];
  
  if (allCards.length < 5) {
    return {
      rank: 0,
      name: 'Incomplete Hand',
      cards: allCards,
      description: 'Not enough cards',
      solverHand: null as unknown as PokerSolver.Hand
    };
  }

  const solverCards = allCards.map(cardToPokerSolver);
  const hand = PokerSolver.Hand.solve(solverCards);

  return {
    rank: hand.rank,
    name: hand.name,
    cards: hand.cards.map((c: PokerSolver.Card) => ({
      suit: mapSuitBack(c.suit),
      rank: mapRankBack(c.value)
    })),
    description: hand.descr,
    solverHand: hand
  };
}

function mapSuitBack(suit: string): 'hearts' | 'diamonds' | 'clubs' | 'spades' {
  const suitMap: Record<string, 'hearts' | 'diamonds' | 'clubs' | 'spades'> = {
    h: 'hearts',
    d: 'diamonds',
    c: 'clubs',
    s: 'spades'
  };
  return suitMap[suit] || 'hearts';
}

function mapRankBack(value: string): '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' {
  const rankMap: Record<string, '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A'> = {
    '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8',
    '9': '9', 'T': '10', 'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A'
  };
  return rankMap[value] || '2';
}

export function compareHands(hand1: HandResult, hand2: HandResult): number {
  if (hand1.rank !== hand2.rank) {
    return hand1.rank - hand2.rank;
  }
  return 0;
}

export interface PlayerHand {
  playerId: string;
  hand: HandResult;
  solverHand: PokerSolver.Hand;
}

export function determineWinners(
  playerHands: PlayerHand[]
): PlayerHand[] {
  if (playerHands.length === 0) return [];

  const solverHands = playerHands.map(ph => ph.solverHand);
  const winningHands = PokerSolver.Hand.winners(solverHands);
  
  const winningHandStrings = new Set(
    winningHands.map((h: PokerSolver.Hand) => 
      h.cards.map((c: PokerSolver.Card) => `${c.value}${c.suit}`).join('')
    )
  );

  return playerHands.filter(ph => {
    const handString = ph.solverHand.cards.map((c: PokerSolver.Card) => 
      `${c.value}${c.suit}`
    ).join('');
    return winningHandStrings.has(handString);
  });
}

export function getHandRankName(rank: number): string {
  if (rank >= 1 && rank <= 10) {
    return HAND_RANKS[rank - 1];
  }
  return 'Unknown';
}
