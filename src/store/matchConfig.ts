import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { MatchConfig, PlayerConfigData, AIConfig } from '../../electron/ipcChannels';

const generateId = () => Math.random().toString(36).substring(2, 15);

const createDefaultPlayer = (seatIndex: number): PlayerConfigData => ({
  id: generateId(),
  name: `Player ${seatIndex + 1}`,
  type: 'human',
  seatIndex,
});

export const useMatchConfigStore = defineStore('matchConfig', () => {
  const configs = ref<MatchConfig[]>([]);
  const currentConfig = ref<MatchConfig | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const playerCount = computed(() => currentConfig.value?.players.length ?? 0);

  async function loadConfigs() {
    isLoading.value = true;
    error.value = null;
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      const result = await window.electronAPI.config.list();
      configs.value = result;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load configs';
    } finally {
      isLoading.value = false;
    }
  }

  async function saveConfig(config: MatchConfig) {
    isLoading.value = true;
    error.value = null;
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      await window.electronAPI.config.save(config);
      await loadConfigs();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to save config';
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteConfig(id: string) {
    isLoading.value = true;
    error.value = null;
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      await window.electronAPI.config.delete(id);
      await loadConfigs();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to delete config';
    } finally {
      isLoading.value = false;
    }
  }

  function createNewConfig(name: string = 'New Match') {
    currentConfig.value = {
      id: generateId(),
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startingChips: 1000,
      smallBlind: 10,
      bigBlind: 20,
      players: [
        createDefaultPlayer(0),
        createDefaultPlayer(1),
      ],
    };
  }

  function updateConfig(updates: Partial<MatchConfig>) {
    if (currentConfig.value) {
      currentConfig.value = {
        ...currentConfig.value,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  function setPlayerCount(count: number) {
    if (!currentConfig.value) return;
    
    const minPlayers = 2;
    const maxPlayers = 10;
    const validCount = Math.max(minPlayers, Math.min(maxPlayers, count));
    
    const currentPlayers = currentConfig.value.players;
    
    if (validCount > currentPlayers.length) {
      for (let i = currentPlayers.length; i < validCount; i++) {
        currentPlayers.push(createDefaultPlayer(i));
      }
    } else if (validCount < currentPlayers.length) {
      currentPlayers.splice(validCount);
    }
    
    updateConfig({ players: currentPlayers });
  }

  function updatePlayer(playerId: string, updates: Partial<PlayerConfigData>) {
    if (!currentConfig.value) return;
    
    const playerIndex = currentConfig.value.players.findIndex(p => p.id === playerId);
    if (playerIndex >= 0) {
      currentConfig.value.players[playerIndex] = {
        ...currentConfig.value.players[playerIndex],
        ...updates,
      };
      updateConfig({ players: [...currentConfig.value.players] });
    }
  }

  function setPlayerAIConfig(playerId: string, aiConfig: AIConfig) {
    updatePlayer(playerId, { aiConfig });
  }

  function selectConfig(config: MatchConfig) {
    currentConfig.value = { ...config };
  }

  function clearCurrentConfig() {
    currentConfig.value = null;
  }

  return {
    configs,
    currentConfig,
    isLoading,
    error,
    playerCount,
    loadConfigs,
    saveConfig,
    deleteConfig,
    createNewConfig,
    updateConfig,
    setPlayerCount,
    updatePlayer,
    setPlayerAIConfig,
    selectConfig,
    clearCurrentConfig,
  };
});
