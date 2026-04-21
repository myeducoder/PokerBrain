<template>
  <div class="game-log">
    <div class="log-header">
      <h3>Game Log</h3>
      <span class="hand-number" v-if="handNumber > 0">Hand #{{ handNumber }}</span>
    </div>
    <div class="log-content" ref="logContainer">
      <div 
        v-for="(entry, index) in log" 
        :key="index"
        class="log-entry"
        :class="getEntryClass(entry)"
      >
        {{ entry }}
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

const logContainer = ref<HTMLElement | null>(null);

watch(() => props.log.length, async () => {
  await nextTick();
  if (logContainer.value) {
    logContainer.value.scrollTop = 0;
  }
});

function getEntryClass(entry: string): Record<string, boolean> {
  return {
    'log-hand-start': entry.includes('--- Hand'),
    'log-winner': entry.includes('wins'),
    'log-error': entry.includes('Error'),
    'log-phase': entry.includes('FLOP') || entry.includes('TURN') || entry.includes('RIVER') || entry.includes('SHOWDOWN')
  };
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
  border-bottom: 1px solid #374151;
}

.log-header h3 {
  margin: 0;
  font-size: 14px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.hand-number {
  color: #fbbf24;
  font-size: 12px;
  font-weight: 600;
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
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
}

.log-hand-start {
  color: #fbbf24;
  font-weight: 600;
  background: rgba(251, 191, 36, 0.1);
}

.log-winner {
  color: #34d399;
  background: rgba(52, 211, 153, 0.1);
}

.log-error {
  color: #f87171;
  background: rgba(248, 113, 113, 0.1);
}

.log-phase {
  color: #60a5fa;
  font-weight: 600;
}
</style>
