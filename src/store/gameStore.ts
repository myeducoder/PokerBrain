import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { 
  GameState, 
  PlayerAction
} from '../game/types';
import type { MatchConfig } from '../../electron/ipcChannels';

export const useGameStore = defineStore('game', () => {
  const gameState = ref<GameState | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const gameLog = ref<string[]>([]);
  const currentMatchConfig = ref<MatchConfig | null>(null);
  const aiThinkingPlayerId = ref<string | null>(null);
  const isGameComplete = ref(false);

  const unsubscribers: (() => void)[] = [];

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

  const isHumanTurn = computed(() => {
    if (!currentPlayer.value || !gameState.value) return false;
    return currentPlayer.value.type === 'human' && 
           !currentPlayer.value.isFolded && 
           phase.value !== 'showdown' && 
           phase.value !== 'ended';
  });

  function addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    gameLog.value.unshift(`[${timestamp}] ${message}`);
    if (gameLog.value.length > 100) {
      gameLog.value.pop();
    }
  }

  function setupEventListeners() {
    if (!window.electronAPI) return;

    const unsubState = window.electronAPI.game.onStateChange((state: GameState) => {
      gameState.value = state;
    });
    unsubscribers.push(unsubState);

    const unsubLog = window.electronAPI.game.onLog((message: string) => {
      addLog(message);
    });
    unsubscribers.push(unsubLog);

    const unsubError = window.electronAPI.game.onError((errorMsg: string) => {
      error.value = errorMsg;
      addLog(`Error: ${errorMsg}`);
    });
    unsubscribers.push(unsubError);

    const unsubAIThinking = window.electronAPI.game.onAIThinking((playerId: string) => {
      aiThinkingPlayerId.value = playerId;
      const player = players.value.find(p => p.id === playerId);
      if (player) {
        addLog(`${player.name} is thinking...`);
      }
    });
    unsubscribers.push(unsubAIThinking);

    const unsubHandComplete = window.electronAPI.game.onHandComplete((handWinners: GameState['winners']) => {
      if (handWinners.length > 0) {
        handWinners.forEach(winner => {
          const player = players.value.find(p => p.id === winner.playerId);
          if (player) {
            addLog(`${player.name} wins ${winner.amount} with ${winner.handRank}`);
          }
        });
      }
      addLog('Hand complete');
    });
    unsubscribers.push(unsubHandComplete);

    const unsubGameComplete = window.electronAPI.game.onGameComplete(() => {
      isGameComplete.value = true;
      addLog('Game Over!');
    });
    unsubscribers.push(unsubGameComplete);
  }

  async function startGame(config: MatchConfig) {
    try {
      isLoading.value = true;
      error.value = null;
      isGameComplete.value = false;
      currentMatchConfig.value = config;

      setupEventListeners();

      if (window.electronAPI) {
        const state = await window.electronAPI.game.start(config);
        if (state) {
          gameState.value = state;
          addLog(`Game started with ${config.players.length} players`);
          addLog(`Blinds: ${config.smallBlind}/${config.bigBlind}`);
        }
      } else {
        throw new Error('Electron API not available');
      }
      
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to start game';
      addLog(`Error: ${error.value}`);
    } finally {
      isLoading.value = false;
    }
  }

  async function startNewHand() {
    if (!window.electronAPI) return;
    
    try {
      isLoading.value = true;
      const state = await window.electronAPI.game.newHand();
      if (state) {
        gameState.value = state;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to start new hand';
      addLog(`Error: ${error.value}`);
    } finally {
      isLoading.value = false;
    }
  }

  async function playerAction(action: PlayerAction, amount?: number) {
    if (!window.electronAPI || !gameState.value) return;
    
    try {
      const player = currentPlayer.value;
      if (!player) return;

      aiThinkingPlayerId.value = null;
      
      const state = await window.electronAPI.game.action(action, amount);
      if (state) {
        gameState.value = state;
      }
      
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Action failed';
      addLog(`Error: ${error.value}`);
    }
  }

  function getAvailableActions(playerId: string): PlayerAction[] {
    if (!gameState.value) return [];
    
    const player = gameState.value.players.find(p => p.id === playerId);
    if (!player || player.isFolded || player.isAllIn) return [];

    const actions: PlayerAction[] = [];
    const callAmount = gameState.value.currentBet - player.currentBet;

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

    return actions;
  }

  function getCallAmount(playerId: string): number {
    if (!gameState.value) return 0;
    const player = gameState.value.players.find(p => p.id === playerId);
    if (!player) return 0;
    return Math.max(0, gameState.value.currentBet - player.currentBet);
  }

  function getMinRaiseAmount(playerId: string): number {
    if (!gameState.value) return 0;
    const player = gameState.value.players.find(p => p.id === playerId);
    if (!player) return 0;
    return gameState.value.currentBet + gameState.value.minRaise;
  }

  async function resetGame() {
    if (window.electronAPI) {
      await window.electronAPI.game.stop();
    }
    
    unsubscribers.forEach(unsub => unsub());
    unsubscribers.length = 0;
    
    gameState.value = null;
    gameLog.value = [];
    currentMatchConfig.value = null;
    error.value = null;
    aiThinkingPlayerId.value = null;
    isGameComplete.value = false;
    addLog('Game reset');
  }

  function cleanup() {
    unsubscribers.forEach(unsub => unsub());
    unsubscribers.length = 0;
  }

  return {
    gameState,
    isLoading,
    error,
    gameLog,
    currentMatchConfig,
    aiThinkingPlayerId,
    isGameComplete,
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
    isHumanTurn,
    addLog,
    startGame,
    startNewHand,
    playerAction,
    getAvailableActions,
    getCallAmount,
    getMinRaiseAmount,
    resetGame,
    cleanup,
  };
});
