<template>
  <Teleport to="body">
    <Transition name="notification">
      <div v-if="visible" class="notification-overlay" @click.self="close">
        <div class="notification-container" :class="type">
          <div class="notification-icon">
            {{ icon }}
          </div>
          <div class="notification-content">
            <h4 class="notification-title">{{ title }}</h4>
            <p class="notification-message">{{ message }}</p>
          </div>
          <button @click="close" class="notification-close">×</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  visible: boolean;
  type: 'error' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const icon = computed(() => {
  switch (props.type) {
    case 'error': return '❌';
    case 'warning': return '⚠️';
    case 'success': return '✅';
    case 'info': return 'ℹ️';
    default: return 'ℹ️';
  }
});

function close() {
  emit('close');
}
</script>

<style scoped>
.notification-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.notification-container {
  background: #1e293b;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  position: relative;
}

.notification-container.error {
  border-left: 4px solid #ef4444;
}

.notification-container.warning {
  border-left: 4px solid #f59e0b;
}

.notification-container.success {
  border-left: 4px solid #22c55e;
}

.notification-container.info {
  border-left: 4px solid #3b82f6;
}

.notification-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
}

.notification-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
}

.notification-message {
  margin: 0;
  font-size: 14px;
  color: #94a3b8;
  line-height: 1.5;
}

.notification-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  transition: color 0.2s;
}

.notification-close:hover {
  color: #f1f5f9;
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
}

.notification-enter-from .notification-container,
.notification-leave-to .notification-container {
  transform: scale(0.9);
}
</style>
