<template>
  <div class="community-cards">
    <div class="cards-label" v-if="cards.length > 0">
      {{ phaseLabel }}
    </div>
    <div class="cards-container">
      <div 
        v-for="(card, index) in cards" 
        :key="index"
        class="card-slot"
        :class="{ 'empty': !card }"
      >
        <CardComponent 
          v-if="card"
          :card="card"
          :faceUp="true"
        />
        <div v-else class="empty-slot"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Card, GamePhase } from '../../game/types';
import CardComponent from './CardComponent.vue';

const props = defineProps<{
  cards: Card[];
  phase: GamePhase;
}>();

const phaseLabel = computed(() => {
  switch (props.phase) {
    case 'flop':
      return 'FLOP';
    case 'turn':
      return 'TURN';
    case 'river':
      return 'RIVER';
    case 'showdown':
      return 'SHOWDOWN';
    default:
      return '';
  }
});
</script>

<style scoped>
.community-cards {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.cards-label {
  color: #fbbf24;
  font-weight: bold;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.cards-container {
  display: flex;
  gap: 8px;
}

.card-slot {
  width: 60px;
  height: 84px;
}

.empty-slot {
  width: 100%;
  height: 100%;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.2);
}
</style>
