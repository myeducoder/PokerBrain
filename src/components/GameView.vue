<template>
  <div class="game-view">
    <header class="game-header">
      <div class="header-left">
        <button @click="goBack" class="btn-secondary">
          ← Back
        </button>
        <h1>LLM Poker</h1>
      </div>
      <div class="header-right">
        <span class="phase-badge" :class="phase">
          {{ phaseLabel }}
        </span>
        <span class="hand-badge" v-if="handNumber > 0">
          Hand #{{ handNumber }}
        </span>
      </div>
    </header>

    <main class="game-main">
      <div class="game-content">
        <div class="table-area">
          <PokerTable
            v-if="gameState"
            :players="players"
            :communityCards="communityCards"
            :pots="pots"
            :phase="phase"
            :currentPlayerIndex="currentPlayerIndex"
            :dealerIndex="dealerIndex"
            :smallBlindIndex="smallBlindIndex"
            :bigBlindIndex="bigBlindIndex"
            :winners="winners"
            :showCards="phase === 'showdown' || phase === 'ended'"
          />
          
          <div v-else class="no-game">
            <p>No game in progress</p>
            <button @click="goBack" class="btn-primary">
              Start a New Game
            </button>
          </div>
        </div>

        <aside class="game-sidebar">
          <GameLog :log="gameLog" :handNumber="handNumber" />
        </aside>
      </div>

      <div class="action-bar" v-if="showActions">
        <div class="action-info">
          <span class="current-player">{{ currentPlayer?.name }}'s Turn</span>
          <span class="pot-info">Pot: {{ totalPot.toLocaleString() }}</span>
        </div>
        <div class="action-buttons">
          <button 
            v-if="availableActions.includes('fold')"
            @click="doAction('fold')"
            class="btn-action fold"
          >
            Fold
          </button>
          <button 
            v-if="availableActions.includes('check')"
            @click="doAction('check')"
            class="btn-action check"
          >
            Check
          </button>
          <button 
            v-if="availableActions.includes('call')"
            @click="doAction('call')"
            class="btn-action call"
          >
            Call {{ callAmount }}
          </button>
          <div v-if="availableActions.includes('raise')" class="raise-controls">
            <input 
              type="range" 
              v-model.number="raiseAmount"
              :min="minRaise"
              :max="maxRaise"
              class="raise-slider"
            />
            <span class="raise-amount">{{ raiseAmount }}</span>
            <button 
              @click="doAction('raise', raiseAmount)"
              class="btn-action raise"
            >
              Raise to {{ raiseAmount }}
            </button>
          </div>
          <button 
            v-if="availableActions.includes('all-in')"
            @click="doAction('all-in')"
            class="btn-action all-in"
          >
            All In ({{ currentPlayer?.chips }})
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useGameStore } from '../store/gameStore';
import { useMatchConfigStore } from '../store/matchConfig';
import PokerTable from './game/PokerTable.vue';
import GameLog from './game/GameLog.vue';
import type { PlayerAction } from '../game/types';

const router = useRouter();
const gameStore = useGameStore();
const configStore = useMatchConfigStore();

const {
  gameState,
  gameLog,
  phase,
  players,
  communityCards,
  pots,
  currentPlayerIndex,
  dealerIndex,
  smallBlindIndex,
  bigBlindIndex,
  handNumber,
  winners,
  totalPot,
  currentPlayer
} = storeToRefs(gameStore);

const raiseAmount = ref(0);

const phaseLabel = computed(() => {
  const labels: Record<string, string> = {
    waiting: 'WAITING',
    preflop: 'PRE-FLOP',
    flop: 'FLOP',
    turn: 'TURN',
    river: 'RIVER',
    showdown: 'SHOWDOWN',
    ended: 'GAME OVER'
  };
  return labels[phase.value] || phase.value.toUpperCase();
});

const showActions = computed(() => {
  if (!gameState.value || !currentPlayer.value) return false;
  return currentPlayer.value.type === 'human' && 
         !currentPlayer.value.isFolded && 
         phase.value !== 'showdown' && 
         phase.value !== 'ended';
});

const availableActions = computed(() => {
  if (!currentPlayer.value) return [];
  return gameStore.getAvailableActions(currentPlayer.value.id);
});

const callAmount = computed(() => {
  if (!currentPlayer.value) return 0;
  return gameStore.getCallAmount(currentPlayer.value.id);
});

const minRaise = computed(() => {
  if (!currentPlayer.value) return 0;
  return gameStore.getMinRaiseAmount(currentPlayer.value.id);
});

const maxRaise = computed(() => {
  return currentPlayer.value?.chips || 0;
});

watch(minRaise, (newMin) => {
  if (raiseAmount.value < newMin) {
    raiseAmount.value = newMin;
  }
});

watch(maxRaise, (newMax) => {
  if (raiseAmount.value > newMax) {
    raiseAmount.value = newMax;
  }
});

function goBack() {
  gameStore.resetGame();
  router.push('/');
}

function doAction(action: PlayerAction, amount?: number) {
  gameStore.playerAction(action, amount);
}

onMounted(() => {
  if (!gameState.value && configStore.currentConfig) {
    gameStore.startGame(configStore.currentConfig);
    gameStore.startNewHand();
  }
});
</script>

<style scoped>
.game-view {
  min-height: 100vh;
  background: #0f172a;
  display: flex;
  flex-direction: column;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #1e293b;
  border-bottom: 1px solid #334155;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h1 {
  margin: 0;
  font-size: 20px;
  color: white;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.phase-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.phase-badge.waiting { background: #475569; color: #94a3b8; }
.phase-badge.preflop { background: #1e40af; color: white; }
.phase-badge.flop { background: #166534; color: white; }
.phase-badge.turn { background: #854d0e; color: white; }
.phase-badge.river { background: #9a3412; color: white; }
.phase-badge.showdown { background: #7c2d12; color: white; }
.phase-badge.ended { background: #1f2937; color: #fbbf24; }

.hand-badge {
  color: #94a3b8;
  font-size: 14px;
}

.game-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 24px;
}

.game-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
}

.table-area {
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-game {
  text-align: center;
  color: #64748b;
}

.no-game p {
  font-size: 18px;
  margin-bottom: 16px;
}

.game-sidebar {
  display: flex;
  flex-direction: column;
}

.action-bar {
  background: #1e293b;
  border-radius: 12px;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.action-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.current-player {
  color: #fbbf24;
  font-weight: 600;
  font-size: 16px;
}

.pot-info {
  color: #94a3b8;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-action {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-action:hover {
  transform: translateY(-2px);
}

.btn-action.fold {
  background: #475569;
  color: white;
}

.btn-action.check {
  background: #059669;
  color: white;
}

.btn-action.call {
  background: #2563eb;
  color: white;
}

.btn-action.raise {
  background: #d97706;
  color: white;
}

.btn-action.all-in {
  background: #dc2626;
  color: white;
}

.raise-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.raise-slider {
  width: 100px;
}

.raise-amount {
  color: #fbbf24;
  font-weight: 600;
  min-width: 60px;
  text-align: center;
}

.btn-primary {
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  padding: 8px 16px;
  background: transparent;
  color: #94a3b8;
  border: 1px solid #475569;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #334155;
  color: white;
}
</style>
