<template>
  <div class="playing-card" :class="[suitClass, { 'face-down': !faceUp }]">
    <div v-if="faceUp" class="card-content">
      <div class="card-rank-top">{{ card.rank }}</div>
      <div class="card-suit">{{ suitSymbol }}</div>
      <div class="card-rank-bottom">{{ card.rank }}</div>
    </div>
    <div v-else class="card-back">
      <div class="card-back-pattern">🂠</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Card, Suit } from '../../game/types';

const props = defineProps<{
  card: Card;
  faceUp?: boolean;
}>();

const suitSymbols: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
};

const suitSymbol = computed(() => suitSymbols[props.card.suit]);

const suitClass = computed(() => {
  const isRed = props.card.suit === 'hearts' || props.card.suit === 'diamonds';
  return isRed ? 'red-suit' : 'black-suit';
});
</script>

<style scoped>
.playing-card {
  width: 60px;
  height: 84px;
  border-radius: 6px;
  background: white;
  border: 1px solid #ccc;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  transition: transform 0.2s;
}

.playing-card:hover {
  transform: translateY(-2px);
}

.card-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 4px;
}

.card-rank-top {
  font-size: 14px;
  font-weight: bold;
  text-align: left;
}

.card-suit {
  font-size: 24px;
  text-align: center;
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-rank-bottom {
  font-size: 14px;
  font-weight: bold;
  text-align: right;
  transform: rotate(180deg);
}

.card-back {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-back-pattern {
  font-size: 40px;
  color: rgba(255, 255, 255, 0.3);
}

.red-suit .card-rank-top,
.red-suit .card-rank-bottom,
.red-suit .card-suit {
  color: #dc2626;
}

.black-suit .card-rank-top,
.black-suit .card-rank-bottom,
.black-suit .card-suit {
  color: #1f2937;
}

.face-down {
  cursor: default;
}
</style>
