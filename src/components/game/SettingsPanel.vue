<template>
  <div class="settings-panel">
    <div class="settings-header">
      <h3>⚙️ Settings</h3>
      <button @click="$emit('close')" class="close-btn">×</button>
    </div>
    
    <div class="settings-content">
      <div class="settings-section">
        <h4>Game Settings</h4>
        
        <div class="setting-item">
          <label>AI Action Delay (ms)</label>
          <input 
            type="number" 
            v-model.number="localSettings.actionDelay"
            min="0"
            max="5000"
            step="100"
          />
        </div>
        
        <div class="setting-item">
          <label>Auto-start next hand</label>
          <input 
            type="checkbox" 
            v-model="localSettings.autoStartNextHand"
          />
        </div>
        
        <div class="setting-item">
          <label>Show AI thinking</label>
          <input 
            type="checkbox" 
            v-model="localSettings.showAIThinking"
          />
        </div>
      </div>
      
      <div class="settings-section">
        <h4>Display Settings</h4>
        
        <div class="setting-item">
          <label>Sound Effects</label>
          <input 
            type="checkbox" 
            v-model="localSettings.soundEnabled"
          />
        </div>
        
        <div class="setting-item">
          <label>Animations</label>
          <input 
            type="checkbox" 
            v-model="localSettings.animationsEnabled"
          />
        </div>
      </div>
      
      <div class="settings-section">
        <h4>LLM Settings</h4>
        
        <div class="setting-item">
          <label>Max Retries</label>
          <input 
            type="number" 
            v-model.number="localSettings.maxRetries"
            min="0"
            max="10"
          />
        </div>
        
        <div class="setting-item">
          <label>Retry Delay (ms)</label>
          <input 
            type="number" 
            v-model.number="localSettings.retryDelay"
            min="500"
            max="10000"
            step="500"
          />
        </div>
      </div>
    </div>
    
    <div class="settings-footer">
      <button @click="resetToDefaults" class="btn-secondary">
        Reset to Defaults
      </button>
      <button @click="saveSettings" class="btn-primary">
        Save Settings
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue';

interface GameSettings {
  actionDelay: number;
  autoStartNextHand: boolean;
  showAIThinking: boolean;
  soundEnabled: boolean;
  animationsEnabled: boolean;
  maxRetries: number;
  retryDelay: number;
}

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', settings: GameSettings): void;
}>();

const defaultSettings: GameSettings = {
  actionDelay: 1000,
  autoStartNextHand: false,
  showAIThinking: true,
  soundEnabled: true,
  animationsEnabled: true,
  maxRetries: 3,
  retryDelay: 1000
};

const localSettings = reactive<GameSettings>({ ...defaultSettings });

function loadSettings() {
  const saved = localStorage.getItem('pokerSettings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      Object.assign(localSettings, parsed);
    } catch {
      Object.assign(localSettings, defaultSettings);
    }
  }
}

function saveSettings() {
  localStorage.setItem('pokerSettings', JSON.stringify(localSettings));
  emit('save', { ...localSettings });
  emit('close');
}

function resetToDefaults() {
  Object.assign(localSettings, defaultSettings);
}

onMounted(() => {
  loadSettings();
});
</script>

<style scoped>
.settings-panel {
  background: #1e293b;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #334155;
}

.settings-header h3 {
  margin: 0;
  font-size: 18px;
  color: #f1f5f9;
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #f1f5f9;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.settings-section {
  margin-bottom: 24px;
}

.settings-section:last-child {
  margin-bottom: 0;
}

.settings-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #334155;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item label {
  color: #e2e8f0;
  font-size: 14px;
}

.setting-item input[type="number"] {
  width: 100px;
  padding: 8px 12px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  color: #f1f5f9;
  font-size: 14px;
  text-align: right;
}

.setting-item input[type="number"]:focus {
  outline: none;
  border-color: #3b82f6;
}

.setting-item input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #3b82f6;
}

.settings-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #334155;
}

.btn-primary {
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  padding: 10px 20px;
  background: transparent;
  color: #94a3b8;
  border: 1px solid #475569;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #334155;
  color: white;
}
</style>
