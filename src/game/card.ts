import { Card, Suit, Rank } from './types';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export function createCard(suit: Suit, rank: Rank): Card {
  return { suit, rank };
}

export function cardToString(card: Card): string {
  const suitSymbols: Record<Suit, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  };
  return `${card.rank}${suitSymbols[card.suit]}`;
}

export function cardToPokerSolver(card: Card): string {
  const rankMap: Record<Rank, string> = {
    '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8',
    '9': '9', '10': 'T', 'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A'
  };
  const suitMap: Record<Suit, string> = {
    hearts: 'h', diamonds: 'd', clubs: 'c', spades: 's'
  };
  return `${rankMap[card.rank]}${suitMap[card.suit]}`;
}

export class Deck {
  private cards: Card[];

  constructor() {
    this.cards = this.createDeck();
  }

  private createDeck(): Card[] {
    const deck: Card[] = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push(createCard(suit, rank));
      }
    }
    return deck;
  }

  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  deal(count: number): Card[] {
    const dealt: Card[] = [];
    for (let i = 0; i < count && this.cards.length > 0; i++) {
      dealt.push(this.cards.pop()!);
    }
    return dealt;
  }

  dealOne(): Card | undefined {
    return this.cards.pop();
  }

  get remaining(): number {
    return this.cards.length;
  }

  reset(): void {
    this.cards = this.createDeck();
    this.shuffle();
  }
}

export function createShuffledDeck(): Deck {
  const deck = new Deck();
  deck.shuffle();
  return deck;
}
