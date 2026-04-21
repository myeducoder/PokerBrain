import { GameEngine } from '../../src/game/gameEngine';
import type { GameState, Player, PlayerAction } from '../../src/game/types';
import { chat } from '../llm/index';
import { 
  buildPokerPrompt, 
  parseAIResponse, 
  validateAction,
  type PokerPromptContext 
} from '../llm/promptFormatter';
import type { AIConfig, MatchConfig } from '../ipcChannels';

export interface GameLoopCallbacks {
  onStateChange: (state: GameState) => void;
  onLog: (message: string) => void;
  onError: (error: string) => void;
  onAIThinking: (playerId: string) => void;
  onHandComplete: (winners: GameState['winners']) => void;
  onGameComplete: () => void;
}

export class GameLoopService {
  private engine: GameEngine | null = null;
  private config: MatchConfig | null = null;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private actionDelay: number = 1000;
  private callbacks: GameLoopCallbacks;
  private pendingHumanAction: boolean = false;

  constructor(callbacks: GameLoopCallbacks) {
    this.callbacks = callbacks;
  }

  initialize(config: MatchConfig): GameState {
    this.config = config;
    this.engine = new GameEngine({
      players: config.players.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        seatIndex: p.seatIndex,
        aiModel: p.aiModel
      })),
      smallBlind: config.smallBlind,
      bigBlind: config.bigBlind,
      startingChips: config.startingChips
    });

    const state = this.engine.getState();
    this.callbacks.onStateChange(state);
    this.callbacks.onLog('Game initialized');
    
    return state;
  }

  startNewHand(): GameState | null {
    if (!this.engine) {
      this.callbacks.onError('Game not initialized');
      return null;
    }

    const state = this.engine.startNewHand();
    this.callbacks.onStateChange(state);
    this.callbacks.onLog(`--- Hand ${state.handNumber} ---`);
    this.callbacks.onLog(`Blinds: ${this.config?.smallBlind}/${this.config?.bigBlind}`);
    
    return state;
  }

  async startGameLoop(): Promise<void> {
    if (!this.engine) {
      this.callbacks.onError('Game not initialized');
      return;
    }

    this.isRunning = true;
    this.isPaused = false;

    while (this.isRunning && !this.isPaused) {
      const state = this.engine.getState();
      
      if (state.phase === 'showdown' || state.phase === 'ended') {
        await this.handleHandComplete();
        break;
      }

      const currentPlayer = state.players[state.currentPlayerIndex];
      
      if (!currentPlayer || currentPlayer.isFolded || currentPlayer.isAllIn) {
        await this.delay(100);
        continue;
      }

      if (currentPlayer.type === 'human') {
        this.pendingHumanAction = true;
        this.callbacks.onStateChange(state);
        break;
      }

      await this.processAITurn(currentPlayer);
    }
  }

  async processAITurn(player: Player): Promise<void> {
    if (!this.engine) return;

    this.callbacks.onAIThinking(player.id);
    this.callbacks.onLog(`${player.name} is thinking...`);

    const actionRequest = this.engine.getAvailableActions(player.id);
    if (!actionRequest) {
      this.callbacks.onError(`No actions available for ${player.name}`);
      return;
    }

    const aiConfig = this.getAIConfig(player.id);
    if (!aiConfig) {
      this.callbacks.onError(`No AI config found for ${player.name}`);
      return;
    }

    try {
      const action = await this.getAIAction(player, actionRequest, aiConfig);
      
      if (action) {
        this.engine.executeAction(player.id, action.action, action.amount);
        const newState = this.engine.getState();
        this.callbacks.onStateChange(newState);
        
        const actionText = this.formatAction(action.action, action.amount);
        this.callbacks.onLog(`${player.name}: ${actionText}`);
      }
    } catch (error) {
      this.callbacks.onError(`AI error for ${player.name}: ${error}`);
      this.engine.executeAction(player.id, 'fold');
      this.callbacks.onLog(`${player.name}: FOLD (error fallback)`);
    }

    await this.delay(this.actionDelay);
  }

  async getAIAction(
    player: Player,
    actionRequest: NonNullable<ReturnType<GameEngine['getAvailableActions']>>,
    aiConfig: AIConfig
  ): Promise<{ action: PlayerAction; amount?: number } | null> {
    if (!this.engine) return null;

    const state = this.engine.getState();
    const context: PokerPromptContext = {
      gameState: state,
      playerId: player.id,
      availableActions: actionRequest.availableActions,
      callAmount: actionRequest.callAmount,
      minRaiseAmount: actionRequest.minRaiseAmount,
      potSize: actionRequest.potSize
    };

    const prompt = buildPokerPrompt(context);
    
    const messages = [
      { role: 'system' as const, content: this.getSystemPrompt() },
      { role: 'user' as const, content: prompt }
    ];

    const response = await chat(aiConfig.provider, messages, aiConfig);

    if (!response.success || !response.content) {
      throw new Error(response.error || 'No response from AI');
    }

    const parsed = parseAIResponse(response.content);
    
    const validation = validateAction(
      parsed,
      actionRequest.availableActions,
      actionRequest.minRaiseAmount,
      player.chips
    );

    if (!validation.valid) {
      this.callbacks.onError(`AI action validation failed: ${validation.error}`);
      return this.getFallbackAction(actionRequest.availableActions, actionRequest.callAmount);
    }

    return { action: validation.action!, amount: validation.amount };
  }

  getSystemPrompt(): string {
    return `You are an expert Texas Hold'em poker player. Your goal is to make optimal decisions based on game theory and probability.

IMPORTANT RULES:
1. You must respond with ONLY ONE of the following actions:
   - FOLD
   - CHECK
   - CALL
   - RAISE <amount>
   - ALL-IN

2. Do NOT include any explanation, reasoning, or additional text.
3. Respond with ONLY the action.

STRATEGY TIPS:
- Consider your hand strength relative to the board
- Factor in pot odds and implied odds
- Consider your position and opponent tendencies
- Adjust for stack sizes and tournament dynamics
- Bluff occasionally but not predictably

RESPONSE FORMAT:
Just the action, nothing else. Examples:
- FOLD
- CALL
- RAISE 500
- ALL-IN`;
  }

  getFallbackAction(
    availableActions: PlayerAction[],
    callAmount: number
  ): { action: PlayerAction; amount?: number } {
    if (callAmount === 0 && availableActions.includes('check')) {
      return { action: 'check' };
    }
    if (availableActions.includes('call')) {
      return { action: 'call' };
    }
    return { action: 'fold' };
  }

  async executeHumanAction(action: PlayerAction, amount?: number): Promise<void> {
    if (!this.engine || !this.pendingHumanAction) return;

    const state = this.engine.getState();
    const currentPlayer = state.players[state.currentPlayerIndex];

    if (!currentPlayer || currentPlayer.type !== 'human') {
      this.callbacks.onError('Not human player turn');
      return;
    }

    this.engine.executeAction(currentPlayer.id, action, amount);
    const newState = this.engine.getState();
    this.callbacks.onStateChange(newState);

    const actionText = this.formatAction(action, amount);
    this.callbacks.onLog(`${currentPlayer.name}: ${actionText}`);

    this.pendingHumanAction = false;
    
    await this.delay(500);
    await this.continueGameLoop();
  }

  async continueGameLoop(): Promise<void> {
    if (!this.engine || !this.isRunning) return;

    while (this.isRunning && !this.isPaused) {
      const state = this.engine.getState();
      
      if (state.phase === 'showdown' || state.phase === 'ended') {
        await this.handleHandComplete();
        break;
      }

      const currentPlayer = state.players[state.currentPlayerIndex];
      
      if (!currentPlayer || currentPlayer.isFolded || currentPlayer.isAllIn) {
        await this.delay(100);
        continue;
      }

      if (currentPlayer.type === 'human') {
        this.pendingHumanAction = true;
        this.callbacks.onStateChange(state);
        break;
      }

      await this.processAITurn(currentPlayer);
    }
  }

  async handleHandComplete(): Promise<void> {
    if (!this.engine) return;

    const state = this.engine.getState();
    
    if (state.winners.length > 0) {
      state.winners.forEach(winner => {
        const player = state.players.find(p => p.id === winner.playerId);
        if (player) {
          this.callbacks.onLog(`${player.name} wins ${winner.amount} with ${winner.handRank}`);
        }
      });
    }

    this.callbacks.onHandComplete(state.winners);

    const activePlayers = state.players.filter(p => p.chips > 0);
    if (activePlayers.length <= 1) {
      this.callbacks.onLog('Game Over!');
      this.callbacks.onGameComplete();
      this.isRunning = false;
    }
  }

  getAIConfig(playerId: string): AIConfig | null {
    if (!this.config) return null;
    
    const player = this.config.players.find(p => p.id === playerId);
    if (!player || player.type !== 'ai') return null;
    
    return player.aiConfig || null;
  }

  formatAction(action: PlayerAction, amount?: number): string {
    switch (action) {
      case 'fold':
        return 'Folds';
      case 'check':
        return 'Checks';
      case 'call':
        return 'Calls';
      case 'raise':
        return `Raises to ${amount}`;
      case 'all-in':
        return 'All-in';
      default:
        return action;
    }
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
    this.continueGameLoop();
  }

  stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    this.pendingHumanAction = false;
  }

  isWaitingForHuman(): boolean {
    return this.pendingHumanAction;
  }

  getState(): GameState | null {
    return this.engine?.getState() ?? null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
