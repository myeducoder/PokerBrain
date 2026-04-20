<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-800">Saved Configurations</h3>
      <button
        @click="createNew"
        class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
      >
        + New
      </button>
    </div>

    <div v-if="isLoading" class="text-center py-4 text-gray-500">
      Loading...
    </div>

    <div v-else-if="configs.length === 0" class="text-center py-8 text-gray-500">
      <p>No saved configurations</p>
      <p class="text-sm mt-1">Click "New" to create one</p>
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="config in configs"
        :key="config.id"
        class="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
        :class="isSelected(config.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'"
        @click="selectConfig(config)"
      >
        <div class="flex items-center justify-between">
          <div>
            <h4 class="font-medium text-gray-800">{{ config.name }}</h4>
            <p class="text-xs text-gray-500 mt-1">
              {{ config.players.length }} players | {{ config.startingChips }} chips | 
              {{ config.smallBlind }}/{{ config.bigBlind }} blinds
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-400">
              {{ formatDate(config.updatedAt) }}
            </span>
            <button
              @click.stop="deleteConfig(config.id)"
              class="p-1 text-red-500 hover:bg-red-100 rounded"
              title="Delete"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useMatchConfigStore } from '../store/matchConfig';
import type { MatchConfig } from '../../electron/ipcChannels';

const store = useMatchConfigStore();
const { configs, isLoading, currentConfig } = storeToRefs(store);

onMounted(() => {
  store.loadConfigs();
});

function createNew() {
  store.createNewConfig();
}

function selectConfig(config: MatchConfig) {
  store.selectConfig(config);
}

function deleteConfig(id: string) {
  if (confirm('Are you sure you want to delete this configuration?')) {
    store.deleteConfig(id);
    if (currentConfig.value?.id === id) {
      store.clearCurrentConfig();
    }
  }
}

function isSelected(id: string) {
  return currentConfig.value?.id === id;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
</script>
