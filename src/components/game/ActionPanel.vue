<template>
  <div class="action-panel" v-if="isVisible">
    <div class="panel-header">
      <div class="player-turn">
        <span class="player-name">{{ playerName }}</span>
        <span class="turn-label">'s Turn</span>
      </div>
      <div class="game-info">
        <div class="info-item">
          <span class="info-label">Pot:</span>
          <span class="info-value pot">{{ formatChips(potSize) }}</span>
        </div>
        <div class="info-item" v-if="callAmount > 0">
          <span class="info-label">To Call:</span>
          <span class="info-value call">{{ formatChips(callAmount) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Your Chips:</span>
          <span class="info-value chips">{{ formatChips(playerChips) }}</span>
        </div>
      </div>
    </div>

    <div class="action-buttons">
      <button 
        v-if="canFold"
        @click="handleAction('fold')"
        class="action-btn fold"
        :disabled="isProcessing"
      >
        <span class="btn-icon">✕</span>
        <span class="btn-text">Fold</span>
      </button>

      <button 
        v-if="canCheck"
        @click="handleAction('check')"
        class="action-btn check"
        :disabled="isProcessing"
      >
        <span class="btn-icon">✓</span>
        <span class="btn-text">Check</span>
      </button>

      <button 
        v-if="canCall"
        @click="handleAction('call')"
        class="action-btn call"
        :disabled="isProcessing"
      >
        <span class="btn-icon">📞</span>
        <span class="btn-text">Call {{ formatChips(callAmount) }}</span>
      </button>

      <div v-if="canRaise" class="raise-section">
        <div class="raise-controls">
          <div class="quick-amounts">
            <button 
              v-for="preset in raisePresets"
              :key="preset.label"
              @click="setRaiseAmount(preset.value)"
              class="quick-btn"
              :disabled="isProcessing"
            >
              {{ preset.label }}
            </button>
          </div>
          
          <div class="slider-container">
            <input 
              type="range" 
              :value="raiseAmount"
              @input="updateRaiseAmount($event)"
              :min="minRaise"
              :max="playerChips"
              class="raise-slider"
              :disabled="isProcessing"
            />
            <div class="slider-labels">
              <span>{{ formatChips(minRaise) }}</span>
              <span class="current-amount">{{ formatChips(raiseAmount) }}</span>
              <span>{{ formatChips(playerChips) }}</span>
            </div>
          </div>
        </div>
        
        <button 
          @click="handleAction('raise', raiseAmount)"
          class="action-btn raise"
          :disabled="isProcessing || raiseAmount < minRaise"
        >
          <span class="btn-icon">⬆</span>
          <span class="btn-text">Raise to {{ formatChips(raiseAmount) }}</span>
        </button>
      </div>

      <button 
        v-if="canAllIn"
        @click="handleAction('all-in')"
        class="action-btn all-in"
        :disabled="isProcessing"
      >
        <span class="btn-icon">🚀</span>
        <span class="btn-text">All-In {{ formatChips(playerChips) }}</span>
      </button>
    </div>

    <div v-if="isProcessing" class="processing-overlay">
      <div class="spinner"></div>
      <span>Processing...</span>
    </div>
  </div>

  <div v-else class="waiting-panel">
    <div class="waiting-message">
      <span class="waiting-icon">⏳</span>
      <span>Waiting for {{ currentPlayerName }}...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { PlayerAction } from '../../game/types';

const props = defineProps<{
  playerName: string;
  playerChips: number;
  potSize: number;
  callAmount: number;
  minRaise: number;
  availableActions: PlayerAction[];
  isHumanTurn: boolean;
  currentPlayerName?: string;
}>();

const emit = defineEmits<{
  (e: 'action', action: PlayerAction, amount?: number): void;
}>();

const isProcessing = ref(false);
const raiseAmount = ref(props.minRaise);

watch(() => props.minRaise, (newMin) => {
  if (raiseAmount.value < newMin) {
    raiseAmount.value = newMin;
  }
});

watch(() => props.playerChips, (newMax) => {
  if (raiseAmount.value > newMax) {
    raiseAmount.value = newMax;
  }
});

const isVisible = computed(() => props.isHumanTurn);

const canFold = computed(() => props.availableActions.includes('fold'));
const canCheck = computed(() => props.availableActions.includes('check'));
const canCall = computed(() => props.availableActions.includes('call'));
const canRaise = computed(() => props.availableActions.includes('raise'));
const canAllIn = computed(() => props.availableActions.includes('all-in'));

const raisePresets = computed(() => {
  const presets = [];
  const pot = props.potSize;
  const min = props.minRaise;
  const max = props.playerChips;

  if (min <= max) {
    presets.push({ label: 'Min', value: min });
  }
  
  const halfPot = Math.min(Math.floor(pot * 0.5), max);
  if (halfPot >= min && halfPot <= max) {
    presets.push({ label: '1/2 Pot', value: halfPot });
  }
  
  const threeQuartersPot = Math.min(Math.floor(pot * 0.75), max);
  if (threeQuartersPot >= min && threeQuartersPot <= max && threeQuartersPot !== halfPot) {
    presets.push({ label: '3/4 Pot', value: threeQuartersPot });
  }
  
  const fullPot = Math.min(pot, max);
  if (fullPot >= min && fullPot <= max && fullPot !== threeQuartersPot) {
    presets.push({ label: 'Pot', value: fullPot });
  }
  
  if (max >= min) {
    presets.push({ label: 'Max', value: max });
  }

  return presets.slice(0, 4);
});

function formatChips(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toString();
}

function setRaiseAmount(value: number) {
  raiseAmount.value = Math.max(props.minRaise, Math.min(value, props.playerChips));
}

function updateRaiseAmount(event: Event) {
  const target = event.target as HTMLInputElement;
  raiseAmount.value = parseInt(target.value, 10);
}

async function handleAction(action: PlayerAction, amount?: number) {
  if (isProcessing.value) return;
  
  isProcessing.value = true;
  
  try {
    emit('action', action, amount);
  } finally {
    setTimeout(() => {
      isProcessing.value = false;
    }, 300);
  }
}
</script>

<style scoped>
.action-panel {
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
}

.action-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #334155;
}

.player-turn {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.player-name {
  color: #fbbf24;
  font-size: 18px;
  font-weight: 700;
}

.turn-label {
  color: #94a3b8;
  font-size: 14px;
}

.game-info {
  display: flex;
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.info-label {
  color: #64748b;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 16px;
  font-weight: 600;
}

.info-value.pot {
  color: #fbbf24;
}

.info-value.call {
  color: #60a5fa;
}

.info-value.chips {
  color: #34d399;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 24px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
  font-family: inherit;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.action-btn:active:not(:disabled) {
  transform: translateY(0);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 24px;
}

.btn-text {
  font-size: 14px;
  font-weight: 600;
}

.action-btn.fold {
  background: linear-gradient(135deg, #475569, #334155);
  color: #e2e8f0;
}

.action-btn.fold:hover:not(:disabled) {
  background: linear-gradient(135deg, #64748b, #475569);
}

.action-btn.check {
  background: linear-gradient(135deg, #059669, #047857);
  color: white;
}

.action-btn.check:hover:not(:disabled) {
  background: linear-gradient(135deg, #10b981, #059669);
}

.action-btn.call {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: white;
}

.action-btn.call:hover:not(:disabled) {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.action-btn.raise {
  background: linear-gradient(135deg, #d97706, #b45309);
  color: white;
}

.action-btn.raise:hover:not(:disabled) {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.action-btn.all-in {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  color: white;
}

.action-btn.all-in:hover:not(:disabled) {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.raise-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 400px;
}

.raise-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(0, 0, 0, 0.2);
  padding: 12px;
  border-radius: 8px;
}

.quick-amounts {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-btn {
  padding: 6px 12px;
  background: #334155;
  color: #e2e8f0;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-btn:hover:not(:disabled) {
  background: #475569;
}

.quick-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.slider-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.raise-slider {
  width: 100%;
  height: 8px;
  -webkit-appearance: none;
  appearance: none;
  background: #334155;
  border-radius: 4px;
  outline: none;
}

.raise-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: #fbbf24;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.raise-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.raise-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #fbbf24;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #64748b;
}

.current-amount {
  color: #fbbf24;
  font-weight: 600;
  font-size: 13px;
}

.processing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #94a3b8;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #334155;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.waiting-panel {
  background: #1e293b;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
}

.waiting-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #94a3b8;
  font-size: 16px;
}

.waiting-icon {
  font-size: 24px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
