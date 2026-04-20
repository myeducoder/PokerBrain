declare module 'pokersolver' {
  export interface Card {
    value: string;
    suit: string;
  }

  export interface Hand {
    cards: Card[];
    rank: number;
    name: string;
    descr: string;
  }

  export const Hand: {
    solve(cards: string[]): Hand;
    winners(hands: Hand[]): Hand[];
  };
}
