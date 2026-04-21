<template>
  <div 
    class="player-seat" 
    :class="{
      'current-turn': isCurrentTurn,
      'folded': player.isFolded,
      'all-in': player.isAllIn,
      'dealer': isDealer,
      'small-blind': isSmallBlind,
      'big-blind': isBigBlind
    }"
  >
    <div class="player-avatar">
      <span class="avatar-icon">{{ player.type === 'ai' ? '🤖' : '👤' }}</span>
      <div v-if="isDealer" class="dealer-button">D</div>
      <div v-if="isSmallBlind" class="blind-indicator sb">SB</div>
      <div v-if="isBigBlind" class="blind-indicator bb">BB</div>
    </div>
    
    <div class="player-info">
      <div class="player-name">{{ player.name }}</div>
      <div class="player-chips">
        <span class="chip-icon">💰</span>
        {{ player.chips.toLocaleString() }}
      </div>
    </div>

    <div v-if="player.currentBet > 0" class="current-bet">
      Bet: {{ player.currentBet }}
    </div>

    <div class="hole-cards" v-if="showCards && player.holeCards.length > 0">
      <CardComponent 
        v-for="(card, index) in player.holeCards" 
        :key="index"
        :card="card"
        :faceUp="showHoleCards"
        class="hole-card"
      />
    </div>

    <div v-if="player.isFolded" class="folded-overlay">
      FOLDED
    </div>

    <div v-if="player.isAllIn" class="all-in-badge">
      ALL IN
    </div>

    <div v-if="isWinner" class="winner-badge">
      🏆
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '../../game/types';
import CardComponent from './CardComponent.vue';

defineProps<{
  player: Player;
  isCurrentTurn?: boolean;
  isDealer?: boolean;
  isSmallBlind?: boolean;
  isBigBlind?: boolean;
  showHoleCards?: boolean;
  isWinner?: boolean;
  showCards?: boolean;
}>();
</script>

<style scoped>
.player-seat {
  position: relative;
  background: linear-gradient(145deg, #2a4a3a, #1a3a2a);
  border: 2px solid #3a5a4a;
  border-radius: 12px;
  padding: 12px;
  min-width: 140px;
  transition: all 0.3s ease;
}

.player-seat.current-turn {
  border-color: #fbbf24;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.5); }
  50% { box-shadow: 0 0 30px rgba(251, 191, 36, 0.8); }
}

.player-seat.folded {
  opacity: 0.5;
  filter: grayscale(50%);
}

.player-seat.all-in {
  border-color: #ef4444;
}

.player-avatar {
  position: relative;
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.avatar-icon {
  font-size: 32px;
}

.dealer-button {
  position: absolute;
  right: -8px;
  top: -8px;
  width: 24px;
  height: 24px;
  background: #fbbf24;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: #1f2937;
}

.blind-indicator {
  position: absolute;
  left: -8px;
  top: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  color: white;
}

.blind-indicator.sb {
  background: #3b82f6;
}

.blind-indicator.bb {
  background: #8b5cf6;
}

.player-info {
  text-align: center;
}

.player-name {
  font-weight: 600;
  color: white;
  font-size: 14px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-chips {
  color: #fbbf24;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.chip-icon {
  font-size: 12px;
}

.current-bet {
  position: absolute;
  bottom: -24px;
  left: 50%;
  transform: translateX(-50%);
  background: #1e40af;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  white-space: nowrap;
}

.hole-cards {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-top: 8px;
}

.hole-card {
  width: 40px;
  height: 56px;
  font-size: 10px;
}

.hole-card :deep(.card-rank-top),
.hole-card :deep(.card-rank-bottom) {
  font-size: 10px;
}

.hole-card :deep(.card-suit) {
  font-size: 16px;
}

.folded-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444;
  font-weight: bold;
  font-size: 14px;
  border-radius: 10px;
}

.all-in-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #ef4444;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
}

.winner-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 24px;
  animation: bounce 0.5s infinite alternate;
}

@keyframes bounce {
  from { transform: translateX(-50%) translateY(0); }
  to { transform: translateX(-50%) translateY(-5px); }
}
</style>
