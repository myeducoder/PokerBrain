import { defineStore } from 'pinia';

export const useMainStore = defineStore('main', {
  state: () => ({
    appName: 'LLM Poker',
    version: '1.0.0',
  }),
  actions: {
    setAppName(name: string) {
      this.appName = name;
    }
  }
});
