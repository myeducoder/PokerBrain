<template>
  <div class="pot-display">
    <div class="pot-total">
      <span class="pot-icon">🏆</span>
      <span class="pot-label">POT</span>
      <span class="pot-amount">{{ totalPot.toLocaleString() }}</span>
    </div>
    <div v-if="pots.length > 1" class="side-pots">
      <div 
        v-for="(pot, index) in pots" 
        :key="index"
        class="side-pot"
        :class="{ 'main': !pot.isSidePot }"
      >
        <span class="pot-name">{{ pot.isSidePot ? `Side Pot ${index}` : 'Main Pot' }}</span>
        <span class="pot-value">{{ pot.amount.toLocaleString() }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Pot } from '../../game/types';

const props = defineProps<{
  pots: Pot[];
}>();

const totalPot = computed(() => 
  props.pots.reduce((sum, pot) => sum + pot.amount, 0)
);
</script>

<style scoped>
.pot-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.pot-total {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(145deg, #1e40af, #1e3a8a);
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.pot-icon {
  font-size: 20px;
}

.pot-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.pot-amount {
  color: #fbbf24;
  font-size: 18px;
  font-weight: bold;
}

.side-pots {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.side-pot {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 12px;
}

.side-pot.main {
  background: rgba(251, 191, 36, 0.2);
}

.pot-name {
  color: rgba(255, 255, 255, 0.6);
  font-size: 10px;
  text-transform: uppercase;
}

.pot-value {
  color: #fbbf24;
  font-weight: 600;
}
</style>
