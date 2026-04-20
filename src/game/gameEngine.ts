import {
  GameState,
  GameConfig,
  Player,
  PlayerAction,
  ActionRequest,
  WinnerInfo
} from './types';
import { Deck, createShuffledDeck } from './card';
import { evaluateHand, determineWinners as determineHandWinners, PlayerHand } from './handEvaluation';
import { calculatePots, getTotalPotAmount, distributePotToWinners } from './pot';

export class GameEngine {
  private state: GameState;
  private deck: Deck;

  constructor(config: GameConfig) {
    this.deck = createShuffledDeck();
    this.state = this.initializeState(config);
  }

  private initializeState(config: GameConfig): GameState {
    const players: Player[] = config.players.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      chips: config.startingChips,
      holeCards: [],
      currentBet: 0,
      totalBetInHand: 0,
      isFolded: false,
      isAllIn: false,
      isActive: true,
      seatIndex: p.seatIndex,
      aiModel: p.aiModel
    }));

    const dealerIndex = 0;
    const smallBlindIndex = (dealerIndex + 1) % players.length;
    const bigBlindIndex = (dealerIndex + 2) % players.length;

    return {
      phase: 'waiting',
      players,
      communityCards: [],
      deck: [],
      pots: [],
      currentBet: 0,
      minRaise: config.bigBlind,
      dealerIndex,
      smallBlindIndex,
      bigBlindIndex,
      currentPlayerIndex: (bigBlindIndex + 1) % players.length,
      smallBlind: config.smallBlind,
      bigBlind: config.bigBlind,
      firstToActIndex: -1,
      actedThisRound: new Set<string>(),
      winners: [],
      handNumber: 0
    };
  }

  getState(): GameState {
    return { ...this.state };
  }

  startNewHand(): GameState {
    this.deck = createShuffledDeck();
    this.state.handNumber++;
    this.state.phase = 'preflop';
    this.state.communityCards = [];
    this.state.pots = [];
    this.state.currentBet = 0;
    this.state.winners = [];
    this.state.actedThisRound = new Set<string>();
    this.state.firstToActIndex = -1;

    this.state.players.forEach(p => {
      p.holeCards = [];
      p.currentBet = 0;
      p.totalBetInHand = 0;
      p.isFolded = false;
      p.isAllIn = false;
    });

    this.moveDealerButton();
    this.postBlinds();
    this.dealHoleCards();

    return this.getState();
  }

  private moveDealerButton(): void {
    const activePlayers = this.state.players.filter(p => p.chips > 0 || p.isActive);
    if (activePlayers.length < 2) return;

    do {
      this.state.dealerIndex = (this.state.dealerIndex + 1) % this.state.players.length;
    } while (!this.state.players[this.state.dealerIndex].isActive || 
             this.state.players[this.state.dealerIndex].chips <= 0);

    this.state.smallBlindIndex = this.findNextActivePlayer(this.state.dealerIndex);
    this.state.bigBlindIndex = this.findNextActivePlayer(this.state.smallBlindIndex);
  }

  private findNextActivePlayer(fromIndex: number): number {
    let index = (fromIndex + 1) % this.state.players.length;
    while (index !== fromIndex) {
      if (this.state.players[index].isActive && this.state.players[index].chips > 0) {
        return index;
      }
      index = (index + 1) % this.state.players.length;
    }
    return fromIndex;
  }

  private postBlinds(): void {
    const sbPlayer = this.state.players[this.state.smallBlindIndex];
    const bbPlayer = this.state.players[this.state.bigBlindIndex];

    const sbAmount = Math.min(sbPlayer.chips, this.state.smallBlind);
    const bbAmount = Math.min(bbPlayer.chips, this.state.bigBlind);

    sbPlayer.chips -= sbAmount;
    sbPlayer.currentBet = sbAmount;
    sbPlayer.totalBetInHand = sbAmount;
    if (sbPlayer.chips === 0) sbPlayer.isAllIn = true;

    bbPlayer.chips -= bbAmount;
    bbPlayer.currentBet = bbAmount;
    bbPlayer.totalBetInHand = bbAmount;
    if (bbPlayer.chips === 0) bbPlayer.isAllIn = true;

    this.state.currentBet = bbAmount;
    this.state.minRaise = this.state.bigBlind;
    this.state.pots = [{ amount: sbAmount + bbAmount, eligiblePlayers: [sbPlayer.id, bbPlayer.id], isSidePot: false }];
    this.state.currentPlayerIndex = this.findNextActivePlayer(this.state.bigBlindIndex);
    this.state.firstToActIndex = this.state.currentPlayerIndex;
    this.state.actedThisRound = new Set<string>();
  }

  private dealHoleCards(): void {
    for (const player of this.state.players) {
      if (player.isActive && player.chips > 0 || player.totalBetInHand > 0) {
        player.holeCards = this.deck.deal(2);
      }
    }
  }

  getAvailableActions(playerId: string): ActionRequest | null {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || player.isFolded || player.isAllIn) return null;

    const actions: PlayerAction[] = [];
    const callAmount = this.state.currentBet - player.currentBet;
    const potSize = getTotalPotAmount(this.state.pots);

    if (callAmount === 0) {
      actions.push('check');
    } else if (player.chips >= callAmount) {
      actions.push('call');
    } else {
      actions.push('all-in');
    }

    actions.push('fold');

    if (player.chips > callAmount) {
      actions.push('raise');
    }

    if (player.chips > 0 && callAmount === 0) {
      actions.push('all-in');
    }

    const minRaiseAmount = this.state.currentBet + this.state.minRaise;

    return {
      playerId,
      availableActions: actions,
      minRaiseAmount,
      callAmount,
      potSize
    };
  }

  executeAction(playerId: string, action: PlayerAction, raiseAmount?: number): GameState {
    const playerIndex = this.state.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return this.getState();

    const player = this.state.players[playerIndex];
    if (player.isFolded || player.isAllIn) return this.getState();

    const isRaising = action === 'raise' || action === 'all-in';
    const previousBet = player.currentBet;

    switch (action) {
      case 'fold':
        this.handleFold(player);
        break;
      case 'check':
        this.handleCheck(player);
        break;
      case 'call':
        this.handleCall(player);
        break;
      case 'raise':
        this.handleRaise(player, raiseAmount || this.state.currentBet + this.state.minRaise);
        break;
      case 'all-in':
        this.handleAllIn(player);
        break;
    }

    if (isRaising && player.currentBet > previousBet) {
      this.state.actedThisRound = new Set<string>();
    }
    this.state.actedThisRound.add(playerId);

    this.updatePots();
    
    if (this.checkRoundComplete()) {
      this.advancePhase();
    } else {
      this.moveToNextPlayer();
    }

    return this.getState();
  }

  private handleFold(player: Player): void {
    player.isFolded = true;
  }

  private handleCheck(_player: Player): void {
    // No action needed, just pass
  }

  private handleCall(player: Player): void {
    const callAmount = Math.min(player.chips, this.state.currentBet - player.currentBet);
    player.chips -= callAmount;
    player.currentBet += callAmount;
    player.totalBetInHand += callAmount;
    if (player.chips === 0) player.isAllIn = true;
  }

  private handleRaise(player: Player, amount: number): void {
    const totalBet = amount;
    const additionalBet = totalBet - player.currentBet;
    
    if (additionalBet > player.chips) {
      this.handleAllIn(player);
      return;
    }

    const raiseSize = totalBet - this.state.currentBet;
    if (raiseSize > 0) {
      this.state.minRaise = raiseSize;
    }

    player.chips -= additionalBet;
    player.currentBet = totalBet;
    player.totalBetInHand += additionalBet;
    this.state.currentBet = totalBet;
    
    if (player.chips === 0) player.isAllIn = true;
  }

  private handleAllIn(player: Player): void {
    const allInAmount = player.chips;
    const newBet = player.currentBet + allInAmount;
    
    if (newBet > this.state.currentBet) {
      const raiseSize = newBet - this.state.currentBet;
      this.state.minRaise = Math.max(this.state.minRaise, raiseSize);
      this.state.currentBet = newBet;
    }

    player.chips = 0;
    player.currentBet = newBet;
    player.totalBetInHand += allInAmount;
    player.isAllIn = true;
  }

  private updatePots(): void {
    this.state.pots = calculatePots(this.state.players);
  }

  private checkRoundComplete(): boolean {
    const activePlayers = this.state.players.filter(p => !p.isFolded && !p.isAllIn);
    
    if (activePlayers.length <= 1) {
      return true;
    }

    const allMatched = activePlayers.every(p => p.currentBet === this.state.currentBet);
    const allActed = activePlayers.every(p => this.state.actedThisRound.has(p.id));

    return allMatched && allActed;
  }

  private moveToNextPlayer(): void {
    const startIndex = this.state.currentPlayerIndex;
    let nextIndex = (startIndex + 1) % this.state.players.length;

    while (nextIndex !== startIndex) {
      const player = this.state.players[nextIndex];
      if (!player.isFolded && !player.isAllIn && player.isActive) {
        this.state.currentPlayerIndex = nextIndex;
        return;
      }
      nextIndex = (nextIndex + 1) % this.state.players.length;
    }
  }

  private advancePhase(): void {
    this.state.players.forEach(p => p.currentBet = 0);
    this.state.currentBet = 0;
    this.state.actedThisRound = new Set<string>();

    const activePlayers = this.state.players.filter(p => !p.isFolded);
    if (activePlayers.length <= 1) {
      this.goToShowdown();
      return;
    }

    const canActPlayers = activePlayers.filter(p => !p.isAllIn);
    if (canActPlayers.length <= 1) {
      this.dealRemainingCommunityCards();
      this.goToShowdown();
      return;
    }

    switch (this.state.phase) {
      case 'preflop':
        this.state.phase = 'flop';
        this.state.communityCards.push(...this.deck.deal(3));
        break;
      case 'flop':
        this.state.phase = 'turn';
        this.state.communityCards.push(this.deck.dealOne()!);
        break;
      case 'turn':
        this.state.phase = 'river';
        this.state.communityCards.push(this.deck.dealOne()!);
        break;
      case 'river':
        this.goToShowdown();
        return;
    }

    this.state.currentPlayerIndex = this.findNextActivePlayer(this.state.smallBlindIndex);
    this.state.firstToActIndex = this.state.currentPlayerIndex;
  }

  private dealRemainingCommunityCards(): void {
    while (this.state.communityCards.length < 5) {
      this.state.communityCards.push(this.deck.dealOne()!);
    }
  }

  private goToShowdown(): void {
    this.state.phase = 'showdown';
    this.determineWinners();
    this.state.phase = 'ended';
  }

  private determineWinners(): void {
    const activePlayers = this.state.players.filter(p => !p.isFolded);
    
    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      const totalPot = getTotalPotAmount(this.state.pots);
      winner.chips += totalPot;
      this.state.winners = [{
        playerId: winner.id,
        handRank: 'Last Player Standing',
        amount: totalPot
      }];
      return;
    }

    const playerHands: PlayerHand[] = activePlayers.map(p => {
      const hand = evaluateHand(p.holeCards, this.state.communityCards);
      return {
        playerId: p.id,
        hand,
        solverHand: hand.solverHand
      };
    });

    const allWinners: WinnerInfo[] = [];
    const playerWinnings: Map<string, number> = new Map();

    for (const pot of this.state.pots) {
      const eligibleHands = playerHands.filter(ph => pot.eligiblePlayers.includes(ph.playerId));
      if (eligibleHands.length === 0) continue;

      const potWinners = determineHandWinners(eligibleHands);
      const winnerInfos = potWinners.map((w: PlayerHand) => ({
        playerId: w.playerId,
        handRank: w.hand.name
      }));

      const distributions = distributePotToWinners(pot, winnerInfos);
      
      for (const dist of distributions) {
        const player = this.state.players.find(p => p.id === dist.playerId);
        if (player) {
          player.chips += dist.amount;
          const currentWinnings = playerWinnings.get(dist.playerId) || 0;
          playerWinnings.set(dist.playerId, currentWinnings + dist.amount);
        }
      }
    }

    for (const [playerId, amount] of playerWinnings) {
      const hand = playerHands.find(ph => ph.playerId === playerId);
      allWinners.push({
        playerId,
        handRank: hand?.hand.name || 'Unknown',
        amount
      });
    }

    this.state.winners = allWinners;
  }

  isHandComplete(): boolean {
    return this.state.phase === 'ended';
  }

  getWinners(): WinnerInfo[] {
    return this.state.winners;
  }

  getCurrentPlayer(): Player | null {
    if (this.state.phase === 'ended' || this.state.phase === 'showdown') return null;
    return this.state.players[this.state.currentPlayerIndex] || null;
  }

  eliminateBrokePlayers(): void {
    for (const player of this.state.players) {
      if (player.chips <= 0) {
        player.isActive = false;
      }
    }
  }

  isGameComplete(): boolean {
    const activePlayers = this.state.players.filter(p => p.isActive);
    return activePlayers.length <= 1;
  }
}
