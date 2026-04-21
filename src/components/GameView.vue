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

      <div v-if="isGameComplete" class="game-complete-overlay">
        <div class="game-complete-modal">
          <h2>🎉 Game Over!</h2>
          <p v-if="finalWinner" class="winner-text">
            {{ finalWinner.name }} wins the tournament with {{ finalWinner.chips }} chips!
          </p>
          <div class="modal-buttons">
            <button @click="goBack" class="btn-primary">
              Back to Menu
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="showHandComplete" class="hand-complete-bar">
        <div class="hand-result">
          <span v-if="winners.length > 0">
            {{ winners.map(w => {
              const p = players.find(pl => pl.id === w.playerId);
              return p ? `${p.name} wins ${w.amount} with ${w.handRank}` : '';
            }).join(' | ') }}
          </span>
        </div>
        <button @click="startNewHand" class="btn-new-hand">
          Deal Next Hand
        </button>
      </div>

      <ActionPanel
        v-else-if="gameState && !isGameComplete"
        :playerName="currentPlayer?.name ?? ''"
        :playerChips="currentPlayer?.chips ?? 0"
        :potSize="totalPot"
        :callAmount="callAmount"
        :minRaise="minRaise"
        :availableActions="availableActions"
        :isHumanTurn="isHumanTurn"
        :currentPlayerName="currentPlayer?.name"
        @action="doAction"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useGameStore } from '../store/gameStore';
import { useMatchConfigStore } from '../store/matchConfig';
import PokerTable from './game/PokerTable.vue';
import GameLog from './game/GameLog.vue';
import ActionPanel from './game/ActionPanel.vue';
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
  currentPlayer,
  isHumanTurn,
  isGameComplete
} = storeToRefs(gameStore);

const showHandComplete = ref(false);

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

const finalWinner = computed(() => {
  if (!isGameComplete.value || !players.value) return null;
  return players.value.find(p => p.chips > 0) || null;
});

function goBack() {
  gameStore.resetGame();
  router.push('/');
}

async function doAction(action: PlayerAction, amount?: number) {
  await gameStore.playerAction(action, amount);
  
  if (phase.value === 'showdown' || phase.value === 'ended') {
    showHandComplete.value = true;
  }
}

async function startNewHand() {
  showHandComplete.value = false;
  await gameStore.startNewHand();
}

onMounted(async () => {
  if (!gameState.value && configStore.currentConfig) {
    await gameStore.startGame(configStore.currentConfig);
    await gameStore.startNewHand();
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
  position: relative;
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

.game-complete-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.game-complete-modal {
  background: #1e293b;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.game-complete-modal h2 {
  color: #fbbf24;
  font-size: 28px;
  margin-bottom: 16px;
}

.winner-text {
  color: #e2e8f0;
  font-size: 18px;
  margin-bottom: 24px;
}

.modal-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.hand-complete-bar {
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
}

.hand-result {
  color: #34d399;
  font-size: 16px;
  font-weight: 600;
}

.btn-new-hand {
  padding: 12px 24px;
  background: linear-gradient(135deg, #059669, #047857);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-new-hand:hover {
  background: linear-gradient(135deg, #10b981, #059669);
  transform: translateY(-2px);
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
