export const IPC_CHANNELS = {
  CONFIG_SAVE: 'config:save',
  CONFIG_LOAD: 'config:load',
  CONFIG_DELETE: 'config:delete',
  CONFIG_LIST: 'config:list',
  
  GAME_SAVE: 'game:save',
  GAME_LOAD: 'game:load',
  GAME_LIST: 'game:list',
  GAME_DELETE: 'game:delete',
  
  AI_REQUEST: 'ai:request',
  AI_CANCEL: 'ai:cancel',
  
  FILE_DIALOG: 'file:dialog',
  APP_INFO: 'app:info',
} as const;

export interface MatchConfig {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  startingChips: number;
  smallBlind: number;
  bigBlind: number;
  players: PlayerConfigData[];
}

export interface PlayerConfigData {
  id: string;
  name: string;
  type: 'human' | 'ai';
  seatIndex: number;
  aiModel?: string;
  aiConfig?: AIConfig;
}

export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'ollama' | 'custom';
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface SavedGame {
  id: string;
  matchConfigId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  gameState: unknown;
}

export interface AIRequest {
  provider: string;
  model: string;
  messages: AIMessage[];
  config?: AIConfig;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  success: boolean;
  content?: string;
  error?: string;
}

export interface AppInfo {
  version: string;
  name: string;
  platform: string;
  userDataPath: string;
}
