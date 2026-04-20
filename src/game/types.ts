export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export type PlayerAction = 'fold' | 'check' | 'call' | 'raise' | 'all-in';

export type GamePhase = 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'ended';

export type PlayerType = 'human' | 'ai';

export interface Player {
  id: string;
  name: string;
  type: PlayerType;
  chips: number;
  holeCards: Card[];
  currentBet: number;
  totalBetInHand: number;
  isFolded: boolean;
  isAllIn: boolean;
  isActive: boolean;
  seatIndex: number;
  aiModel?: string;
}

export interface Pot {
  amount: number;
  eligiblePlayers: string[];
  isSidePot: boolean;
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  communityCards: Card[];
  deck: Card[];
  pots: Pot[];
  currentBet: number;
  minRaise: number;
  dealerIndex: number;
  smallBlindIndex: number;
  bigBlindIndex: number;
  currentPlayerIndex: number;
  smallBlind: number;
  bigBlind: number;
  firstToActIndex: number;
  actedThisRound: Set<string>;
  winners: WinnerInfo[];
  handNumber: number;
}

export interface WinnerInfo {
  playerId: string;
  handRank: string;
  amount: number;
}

export interface GameConfig {
  startingChips: number;
  smallBlind: number;
  bigBlind: number;
  players: PlayerConfig[];
}

export interface PlayerConfig {
  id: string;
  name: string;
  type: PlayerType;
  seatIndex: number;
  aiModel?: string;
}

export interface ActionRequest {
  playerId: string;
  availableActions: PlayerAction[];
  minRaiseAmount: number;
  callAmount: number;
  potSize: number;
}

export interface ActionResult {
  action: PlayerAction;
  amount?: number;
}
