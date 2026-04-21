<template>
  <div class="game-log">
    <div class="log-header">
      <h3>📋 Event Log</h3>
      <div class="header-badges">
        <span class="hand-number" v-if="handNumber > 0">Hand #{{ handNumber }}</span>
        <button @click="clearLog" class="clear-btn" title="Clear log">
          🗑️
        </button>
      </div>
    </div>
    <div class="log-content" ref="logContainer">
      <div 
        v-for="(entry, index) in log" 
        :key="index"
        class="log-entry"
        :class="getEntryClass(entry)"
      >
        <span class="log-icon">{{ getEntryIcon(entry) }}</span>
        <span class="log-text">{{ entry }}</span>
      </div>
      <div v-if="log.length === 0" class="log-empty">
        No events yet. Start a game to see the log.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

const props = defineProps<{
  log: string[];
  handNumber: number;
}>();

const emit = defineEmits<{
  (e: 'clear'): void;
}>();

const logContainer = ref<HTMLElement | null>(null);

watch(() => props.log.length, async () => {
  await nextTick();
  if (logContainer.value) {
    logContainer.value.scrollTop = 0;
  }
});

function getEntryClass(entry: string): Record<string, boolean> {
  const lowerEntry = entry.toLowerCase();
  
  return {
    'log-hand-start': entry.includes('--- Hand'),
    'log-winner': entry.includes('wins'),
    'log-error': lowerEntry.includes('error') || lowerEntry.includes('failed'),
    'log-phase': entry.includes('FLOP') || entry.includes('TURN') || entry.includes('RIVER') || entry.includes('SHOWDOWN') || entry.includes('PRE-FLOP'),
    'log-action': entry.includes('Folds') || entry.includes('Checks') || entry.includes('Calls') || entry.includes('Raises') || entry.includes('All-in'),
    'log-blind': lowerEntry.includes('blind'),
    'log-thinking': lowerEntry.includes('thinking'),
    'log-game': lowerEntry.includes('game') && !lowerEntry.includes('game over'),
    'log-complete': lowerEntry.includes('complete') || lowerEntry.includes('game over'),
  };
}

function getEntryIcon(entry: string): string {
  const lowerEntry = entry.toLowerCase();
  
  if (entry.includes('--- Hand')) return '🎴';
  if (entry.includes('wins')) return '🏆';
  if (lowerEntry.includes('error') || lowerEntry.includes('failed')) return '❌';
  if (entry.includes('FLOP')) return '🃏';
  if (entry.includes('TURN')) return '🔄';
  if (entry.includes('RIVER')) return '🌊';
  if (entry.includes('SHOWDOWN')) return '👀';
  if (entry.includes('PRE-FLOP')) return '🃏';
  if (entry.includes('Folds')) return '🏳️';
  if (entry.includes('Checks')) return '✓';
  if (entry.includes('Calls')) return '📞';
  if (entry.includes('Raises')) return '⬆️';
  if (entry.includes('All-in')) return '🚀';
  if (lowerEntry.includes('blind')) return '💰';
  if (lowerEntry.includes('thinking')) return '🤔';
  if (lowerEntry.includes('game over')) return '🎉';
  if (lowerEntry.includes('complete')) return '✅';
  if (lowerEntry.includes('game')) return '🎮';
  
  return '•';
}

function clearLog() {
  emit('clear');
}
</script>

<style scoped>
.game-log {
  background: #1f2937;
  border-radius: 8px;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #111827;
  border-bottom: 1px solid #374155;
}

.log-header h3 {
  margin: 0;
  font-size: 14px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.header-badges {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hand-number {
  color: #fbbf24;
  font-size: 12px;
  font-weight: 600;
}

.clear-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  font-size: 14px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.clear-btn:hover {
  opacity: 1;
}

.log-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column-reverse;
  gap: 4px;
}

.log-entry {
  font-size: 12px;
  color: #d1d5db;
  padding: 6px 10px;
  border-radius: 6px;
  font-family: monospace;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.log-icon {
  flex-shrink: 0;
  font-size: 14px;
}

.log-text {
  flex: 1;
  word-break: break-word;
}

.log-hand-start {
  color: #fbbf24;
  font-weight: 600;
  background: rgba(251, 191, 36, 0.1);
  border-left: 3px solid #fbbf24;
}

.log-winner {
  color: #34d399;
  background: rgba(52, 211, 153, 0.1);
  border-left: 3px solid #34d399;
}

.log-error {
  color: #f87171;
  background: rgba(248, 113, 113, 0.1);
  border-left: 3px solid #f87171;
}

.log-phase {
  color: #60a5fa;
  font-weight: 600;
  background: rgba(96, 165, 250, 0.1);
  border-left: 3px solid #60a5fa;
}

.log-action {
  color: #a78bfa;
  background: rgba(167, 139, 250, 0.1);
}

.log-blind {
  color: #fb923c;
  background: rgba(251, 146, 60, 0.1);
}

.log-thinking {
  color: #94a3b8;
  font-style: italic;
}

.log-game {
  color: #22d3ee;
  background: rgba(34, 211, 238, 0.1);
}

.log-complete {
  color: #4ade80;
  font-weight: 600;
  background: rgba(74, 222, 128, 0.1);
  border-left: 3px solid #4ade80;
}

.log-empty {
  color: #64748b;
  font-size: 13px;
  text-align: center;
  padding: 20px;
  font-style: italic;
}
</style>
