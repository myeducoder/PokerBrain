<template>
  <div class="poker-table">
    <div class="table-felt">
      <div class="table-center">
        <PotDisplay :pots="pots" />
        <CommunityCards :cards="communityCards" :phase="phase" />
      </div>
      
      <div class="players-container">
        <PlayerSeat
          v-for="player in positionedPlayers"
          :key="player.id"
          :player="player"
          :isCurrentTurn="player.id === currentPlayerId"
          :isDealer="player.seatIndex === dealerIndex"
          :isSmallBlind="player.seatIndex === smallBlindIndex"
          :isBigBlind="player.seatIndex === bigBlindIndex"
          :showHoleCards="shouldShowHoleCards(player)"
          :isWinner="isWinner(player.id)"
          :showCards="showCards"
          :style="getPlayerPosition(player.seatIndex, players.length)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Player, Card, Pot, GamePhase } from '../../game/types';
import PlayerSeat from './PlayerSeat.vue';
import CommunityCards from './CommunityCards.vue';
import PotDisplay from './PotDisplay.vue';

const props = defineProps<{
  players: Player[];
  communityCards: Card[];
  pots: Pot[];
  phase: GamePhase;
  currentPlayerIndex: number;
  dealerIndex: number;
  smallBlindIndex: number;
  bigBlindIndex: number;
  winners: { playerId: string }[];
  showCards?: boolean;
  humanPlayerId?: string;
}>();

const currentPlayerId = computed(() => {
  if (props.currentPlayerIndex < 0 || props.currentPlayerIndex >= props.players.length) {
    return null;
  }
  return props.players[props.currentPlayerIndex]?.id;
});

const positionedPlayers = computed(() => props.players);

function shouldShowHoleCards(player: Player): boolean {
  if (props.phase === 'showdown' || props.phase === 'ended') {
    return !player.isFolded;
  }
  return player.id === props.humanPlayerId;
}

function isWinner(playerId: string): boolean {
  return props.winners.some(w => w.playerId === playerId);
}

function getPlayerPosition(seatIndex: number, totalPlayers: number): Record<string, string> {
  const angle = (seatIndex / totalPlayers) * 2 * Math.PI - Math.PI / 2;
  const radiusX = 42;
  const radiusY = 38;
  
  const x = 50 + radiusX * Math.cos(angle);
  const y = 50 + radiusY * Math.sin(angle);
  
  return {
    position: 'absolute',
    left: `${x}%`,
    top: `${y}%`,
    transform: 'translate(-50%, -50%)'
  };
}
</script>

<style scoped>
.poker-table {
  width: 100%;
  max-width: 900px;
  aspect-ratio: 16 / 10;
  margin: 0 auto;
  padding: 20px;
}

.table-felt {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #1a5a3a, #0d3a2a);
  border-radius: 50%;
  border: 12px solid #4a3a2a;
  box-shadow: 
    inset 0 0 50px rgba(0, 0, 0, 0.3),
    0 10px 30px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.table-felt::before {
  content: '';
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 10px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.table-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  z-index: 1;
}

.players-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
