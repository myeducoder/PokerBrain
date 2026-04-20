<template>
  <div class="bg-white rounded-lg shadow p-4 border-2" :class="player.type === 'ai' ? 'border-purple-300' : 'border-blue-300'">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
          :class="player.type === 'ai' ? 'bg-purple-500' : 'bg-blue-500'">
          {{ player.seatIndex + 1 }}
        </span>
        <input
          v-model="playerName"
          type="text"
          class="font-medium text-gray-800 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1"
          placeholder="Player name"
        />
      </div>
      <select
        v-model="playerType"
        class="px-3 py-1 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="human">Human</option>
        <option value="ai">AI</option>
      </select>
    </div>

    <div v-if="player.type === 'ai'" class="space-y-2 mt-3 pt-3 border-t border-gray-200">
      <div>
        <label class="block text-xs text-gray-500 mb-1">AI Provider</label>
        <select
          v-model="aiProvider"
          class="w-full px-2 py-1 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="ollama">Ollama (Local)</option>
        </select>
      </div>

      <div>
        <label class="block text-xs text-gray-500 mb-1">Model</label>
        <input
          v-model="aiModel"
          type="text"
          class="w-full px-2 py-1 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          :placeholder="modelPlaceholder"
        />
      </div>

      <div v-if="aiProvider !== 'ollama'">
        <label class="block text-xs text-gray-500 mb-1">API Key</label>
        <input
          v-model="apiKey"
          type="password"
          class="w-full px-2 py-1 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Enter API key"
        />
      </div>

      <div v-if="aiProvider === 'ollama'">
        <label class="block text-xs text-gray-500 mb-1">Ollama URL</label>
        <input
          v-model="baseUrl"
          type="text"
          class="w-full px-2 py-1 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="http://localhost:11434"
        />
      </div>

      <div>
        <label class="block text-xs text-gray-500 mb-1">Temperature: {{ temperature }}</label>
        <input
          v-model.number="temperature"
          type="range"
          min="0"
          max="2"
          step="0.1"
          class="w-full"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PlayerConfigData } from '../../electron/ipcChannels';
import { useMatchConfigStore } from '../store/matchConfig';

const props = defineProps<{
  player: PlayerConfigData;
}>();

const store = useMatchConfigStore();

const playerName = computed({
  get: () => props.player.name,
  set: (value) => store.updatePlayer(props.player.id, { name: value }),
});

const playerType = computed({
  get: () => props.player.type,
  set: (value) => store.updatePlayer(props.player.id, { type: value }),
});

const aiProvider = computed({
  get: () => props.player.aiConfig?.provider ?? 'openai',
  set: (value) => {
    const provider = value as 'openai' | 'anthropic' | 'ollama';
    store.setPlayerAIConfig(props.player.id, {
      provider,
      model: props.player.aiConfig?.model ?? getDefaultModel(value),
      apiKey: props.player.aiConfig?.apiKey ?? '',
      baseUrl: props.player.aiConfig?.baseUrl ?? 'http://localhost:11434',
      temperature: props.player.aiConfig?.temperature ?? 0.7,
    });
  },
});

const aiModel = computed({
  get: () => props.player.aiConfig?.model ?? '',
  set: (value) => {
    store.setPlayerAIConfig(props.player.id, {
      provider: props.player.aiConfig?.provider ?? 'openai',
      model: value,
      apiKey: props.player.aiConfig?.apiKey ?? '',
      baseUrl: props.player.aiConfig?.baseUrl ?? 'http://localhost:11434',
      temperature: props.player.aiConfig?.temperature ?? 0.7,
    });
  },
});

const apiKey = computed({
  get: () => props.player.aiConfig?.apiKey ?? '',
  set: (value) => {
    store.setPlayerAIConfig(props.player.id, {
      provider: props.player.aiConfig?.provider ?? 'openai',
      model: props.player.aiConfig?.model ?? '',
      apiKey: value,
      baseUrl: props.player.aiConfig?.baseUrl ?? 'http://localhost:11434',
      temperature: props.player.aiConfig?.temperature ?? 0.7,
    });
  },
});

const baseUrl = computed({
  get: () => props.player.aiConfig?.baseUrl ?? 'http://localhost:11434',
  set: (value) => {
    store.setPlayerAIConfig(props.player.id, {
      provider: props.player.aiConfig?.provider ?? 'openai',
      model: props.player.aiConfig?.model ?? '',
      apiKey: props.player.aiConfig?.apiKey ?? '',
      baseUrl: value,
      temperature: props.player.aiConfig?.temperature ?? 0.7,
    });
  },
});

const temperature = computed({
  get: () => props.player.aiConfig?.temperature ?? 0.7,
  set: (value) => {
    store.setPlayerAIConfig(props.player.id, {
      provider: props.player.aiConfig?.provider ?? 'openai',
      model: props.player.aiConfig?.model ?? '',
      apiKey: props.player.aiConfig?.apiKey ?? '',
      baseUrl: props.player.aiConfig?.baseUrl ?? 'http://localhost:11434',
      temperature: value,
    });
  },
});

const modelPlaceholder = computed(() => {
  switch (aiProvider.value) {
    case 'openai':
      return 'gpt-4, gpt-3.5-turbo, ...';
    case 'anthropic':
      return 'claude-3-opus, claude-3-sonnet, ...';
    case 'ollama':
      return 'llama2, mistral, codellama, ...';
    default:
      return 'Model name';
  }
});

function getDefaultModel(provider: string): string {
  switch (provider) {
    case 'openai':
      return 'gpt-3.5-turbo';
    case 'anthropic':
      return 'claude-3-sonnet';
    case 'ollama':
      return 'llama2';
    default:
      return '';
  }
}
</script>
