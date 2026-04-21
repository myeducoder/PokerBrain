import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { GameEngine } from '../game/gameEngine';
import type { 
  GameState, 
  GameConfig, 
  PlayerAction
} from '../game/types';
import type { MatchConfig } from '../../electron/ipcChannels';

export const useGameStore = defineStore('game', () => {
  const engine = ref<GameEngine | null>(null);
  const gameState = ref<GameState | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const gameLog = ref<string[]>([]);
  const currentMatchConfig = ref<MatchConfig | null>(null);

  const phase = computed(() => gameState.value?.phase ?? 'waiting');
  const players = computed(() => gameState.value?.players ?? []);
  const communityCards = computed(() => gameState.value?.communityCards ?? []);
  const pots = computed(() => gameState.value?.pots ?? []);
  const currentPlayerIndex = computed(() => gameState.value?.currentPlayerIndex ?? -1);
  const dealerIndex = computed(() => gameState.value?.dealerIndex ?? 0);
  const smallBlindIndex = computed(() => gameState.value?.smallBlindIndex ?? 0);
  const bigBlindIndex = computed(() => gameState.value?.bigBlindIndex ?? 0);
  const currentBet = computed(() => gameState.value?.currentBet ?? 0);
  const handNumber = computed(() => gameState.value?.handNumber ?? 0);
  const winners = computed(() => gameState.value?.winners ?? []);

  const totalPot = computed(() => {
    if (!gameState.value) return 0;
    return gameState.value.pots.reduce((sum, pot) => sum + pot.amount, 0);
  });

  const currentPlayer = computed(() => {
    if (!gameState.value || currentPlayerIndex.value < 0) return null;
    return gameState.value.players[currentPlayerIndex.value];
  });

  const humanPlayers = computed(() => 
    players.value.filter(p => p.type === 'human' && !p.isFolded && p.chips > 0)
  );

  const aiPlayers = computed(() => 
    players.value.filter(p => p.type === 'ai' && !p.isFolded && p.chips > 0)
  );

  const activePlayers = computed(() => 
    players.value.filter(p => !p.isFolded && p.chips > 0)
  );

  function addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    gameLog.value.unshift(`[${timestamp}] ${message}`);
    if (gameLog.value.length > 100) {
      gameLog.value.pop();
    }
  }

  function startGame(config: MatchConfig) {
    try {
      isLoading.value = true;
      error.value = null;
      currentMatchConfig.value = config;

      const gameConfig: GameConfig = {
        startingChips: config.startingChips,
        smallBlind: config.smallBlind,
        bigBlind: config.bigBlind,
        players: config.players.map(p => ({
          id: p.id,
          name: p.name,
          type: p.type,
          seatIndex: p.seatIndex,
          aiModel: p.aiConfig?.model
        }))
      };

      engine.value = new GameEngine(gameConfig);
      gameState.value = engine.value.getState();
      
      addLog(`Game started with ${config.players.length} players`);
      addLog(`Blinds: ${config.smallBlind}/${config.bigBlind}, Starting chips: ${config.startingChips}`);
      
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to start game';
      addLog(`Error: ${error.value}`);
    } finally {
      isLoading.value = false;
    }
  }

  function startNewHand() {
    if (!engine.value) return;
    
    try {
      gameState.value = engine.value.startNewHand();
      addLog(`--- Hand #${gameState.value.handNumber} ---`);
      
      const sbPlayer = gameState.value.players[gameState.value.smallBlindIndex];
      const bbPlayer = gameState.value.players[gameState.value.bigBlindIndex];
      addLog(`${sbPlayer.name} posts small blind: ${gameState.value.smallBlind}`);
      addLog(`${bbPlayer.name} posts big blind: ${gameState.value.bigBlind}`);
      
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to start new hand';
      addLog(`Error: ${error.value}`);
    }
  }

  function playerAction(action: PlayerAction, amount?: number) {
    if (!engine.value || !gameState.value) return;
    
    try {
      const player = currentPlayer.value;
      if (!player) return;

      gameState.value = engine.value.executeAction(player.id, action, amount);
      
      const actionText = formatAction(action, amount);
      addLog(`${player.name}: ${actionText}`);
      
      if (gameState.value.phase === 'showdown' || gameState.value.phase === 'ended') {
        handleHandComplete();
      }
      
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Action failed';
      addLog(`Error: ${error.value}`);
    }
  }

  function handleHandComplete() {
    if (!gameState.value) return;
    
    if (gameState.value.winners.length > 0) {
      gameState.value.winners.forEach(winner => {
        const player = players.value.find(p => p.id === winner.playerId);
        if (player) {
          addLog(`${player.name} wins ${winner.amount} with ${winner.handRank}`);
        }
      });
    }
    
    addLog('Hand complete');
  }

  function formatAction(action: PlayerAction, amount?: number): string {
    switch (action) {
      case 'fold':
        return 'Folds';
      case 'check':
        return 'Checks';
      case 'call':
        return `Calls ${amount}`;
      case 'raise':
        return `Raises to ${amount}`;
      case 'all-in':
        return `All-in for ${amount}`;
      default:
        return action;
    }
  }

  function getAvailableActions(playerId: string): PlayerAction[] {
    if (!engine.value) return [];
    const actionRequest = engine.value.getAvailableActions(playerId);
    return actionRequest?.availableActions ?? [];
  }

  function getCallAmount(playerId: string): number {
    if (!engine.value || !gameState.value) return 0;
    const player = gameState.value.players.find(p => p.id === playerId);
    if (!player) return 0;
    return Math.max(0, gameState.value.currentBet - player.currentBet);
  }

  function getMinRaiseAmount(playerId: string): number {
    if (!engine.value) return 0;
    const actionRequest = engine.value.getAvailableActions(playerId);
    return actionRequest?.minRaiseAmount ?? 0;
  }

  function resetGame() {
    engine.value = null;
    gameState.value = null;
    gameLog.value = [];
    currentMatchConfig.value = null;
    error.value = null;
    addLog('Game reset');
  }

  return {
    engine,
    gameState,
    isLoading,
    error,
    gameLog,
    currentMatchConfig,
    phase,
    players,
    communityCards,
    pots,
    currentPlayerIndex,
    dealerIndex,
    smallBlindIndex,
    bigBlindIndex,
    currentBet,
    handNumber,
    winners,
    totalPot,
    currentPlayer,
    humanPlayers,
    aiPlayers,
    activePlayers,
    addLog,
    startGame,
    startNewHand,
    playerAction,
    getAvailableActions,
    getCallAmount,
    getMinRaiseAmount,
    resetGame,
  };
});
