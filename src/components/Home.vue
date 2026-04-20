<template>
  <div class="p-8 bg-gray-100 min-h-screen">
    <h2 class="text-2xl font-bold text-blue-600">Home View</h2>
    <p class="mt-4 text-gray-700">Welcome to {{ mainStore.appName }}!</p>
    <button class="px-4 py-2 mt-4 bg-blue-500 text-white rounded hover:bg-blue-600" @click="mainStore.setAppName('LLM Poker (Updated)')">Update Name</button>
  </div>
</template>
<script setup lang="ts">
import { useMainStore } from '../store/index';

const mainStore = useMainStore();
</script>
