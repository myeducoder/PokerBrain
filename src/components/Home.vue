<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold text-gray-900">{{ mainStore.appName }}</h1>
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-500">v{{ mainStore.version }}</span>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div v-if="error" class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        {{ error }}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1">
          <ConfigList />
        </div>

        <div class="lg:col-span-2 space-y-6">
          <div v-if="!currentConfig" class="bg-white rounded-lg shadow p-8 text-center">
            <p class="text-gray-500">Select a configuration or create a new one to get started</p>
          </div>

          <template v-else>
            <MatchSettings />

            <div class="flex justify-end gap-3">
              <button
                @click="clearConfig"
                class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                @click="saveCurrentConfig"
                :disabled="isLoading"
                class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {{ isLoading ? 'Saving...' : 'Save Configuration' }}
              </button>
              <button
                @click="startGame"
                :disabled="!canStartGame"
                class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                Start Game
              </button>
            </div>
          </template>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useMainStore } from '../store/index';
import { useMatchConfigStore } from '../store/matchConfig';
import ConfigList from '../components/ConfigList.vue';
import MatchSettings from '../components/MatchSettings.vue';

const router = useRouter();
const mainStore = useMainStore();
const matchConfigStore = useMatchConfigStore();
const { currentConfig, isLoading, error } = storeToRefs(matchConfigStore);

onMounted(() => {
  matchConfigStore.loadConfigs();
});

const canStartGame = computed(() => {
  if (!currentConfig.value) return false;
  const players = currentConfig.value.players;
  if (players.length < 2) return false;
  
  const aiPlayers = players.filter(p => p.type === 'ai');
  const hasValidAI = aiPlayers.every(p => {
    if (!p.aiConfig) return false;
    if (!p.aiConfig.model) return false;
    if (p.aiConfig.provider !== 'ollama' && !p.aiConfig.apiKey) return false;
    return true;
  });
  
  return hasValidAI;
});

function clearConfig() {
  matchConfigStore.clearCurrentConfig();
}

function saveCurrentConfig() {
  if (currentConfig.value) {
    matchConfigStore.saveConfig(currentConfig.value);
  }
}

function startGame() {
  if (!currentConfig.value) return;
  matchConfigStore.saveConfig(currentConfig.value);
  router.push('/game');
}
</script>
