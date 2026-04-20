<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h3 class="text-lg font-semibold text-gray-800 mb-4">Game Settings</h3>
    
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Match Name</label>
        <input
          v-model="matchName"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter match name"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Number of Players: {{ playerCount }}</label>
        <input
          :value="playerCount"
          @input="updatePlayerCount"
          type="range"
          min="2"
          max="10"
          class="w-full"
        />
        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>2</span>
          <span>10</span>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Starting Chips</label>
          <input
            v-model.number="startingChips"
            type="number"
            min="100"
            step="100"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Small Blind</label>
          <input
            v-model.number="smallBlind"
            type="number"
            min="1"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Big Blind</label>
          <input
            v-model.number="bigBlind"
            type="number"
            min="2"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div class="pt-4 border-t border-gray-200">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-700">Players Configuration</span>
          <span class="text-xs text-gray-500">
            {{ aiPlayerCount }} AI / {{ humanPlayerCount }} Human
          </span>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <PlayerConfig
            v-for="player in players"
            :key="player.id"
            :player="player"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useMatchConfigStore } from '../store/matchConfig';
import PlayerConfig from './PlayerConfig.vue';
import type { PlayerConfigData } from '../../electron/ipcChannels';

const store = useMatchConfigStore();

const matchName = computed({
  get: () => store.currentConfig?.name ?? '',
  set: (value) => store.updateConfig({ name: value }),
});

const playerCount = computed(() => store.playerCount);

const startingChips = computed({
  get: () => store.currentConfig?.startingChips ?? 1000,
  set: (value) => store.updateConfig({ startingChips: value }),
});

const smallBlind = computed({
  get: () => store.currentConfig?.smallBlind ?? 10,
  set: (value) => store.updateConfig({ smallBlind: value }),
});

const bigBlind = computed({
  get: () => store.currentConfig?.bigBlind ?? 20,
  set: (value) => store.updateConfig({ bigBlind: value }),
});

const players = computed(() => store.currentConfig?.players ?? []);

const aiPlayerCount = computed(() => 
  players.value.filter((p: PlayerConfigData) => p.type === 'ai').length
);

const humanPlayerCount = computed(() => 
  players.value.filter((p: PlayerConfigData) => p.type === 'human').length
);

function updatePlayerCount(event: Event) {
  const target = event.target as HTMLInputElement;
  store.setPlayerCount(parseInt(target.value, 10));
}
</script>
