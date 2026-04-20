import { contextBridge, ipcRenderer, OpenDialogOptions } from 'electron';
import { 
  IPC_CHANNELS, 
  MatchConfig, 
  SavedGame, 
  AIRequest, 
  AIResponse,
  AppInfo 
} from './ipcChannels';

const electronAPI = {
  config: {
    save: (config: MatchConfig): Promise<boolean> => 
      ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SAVE, config),
    
    load: (id: string): Promise<MatchConfig | null> => 
      ipcRenderer.invoke(IPC_CHANNELS.CONFIG_LOAD, id),
    
    delete: (id: string): Promise<boolean> => 
      ipcRenderer.invoke(IPC_CHANNELS.CONFIG_DELETE, id),
    
    list: (): Promise<MatchConfig[]> => 
      ipcRenderer.invoke(IPC_CHANNELS.CONFIG_LIST),
  },

  game: {
    save: (game: SavedGame): Promise<boolean> => 
      ipcRenderer.invoke(IPC_CHANNELS.GAME_SAVE, game),
    
    load: (id: string): Promise<SavedGame | null> => 
      ipcRenderer.invoke(IPC_CHANNELS.GAME_LOAD, id),
    
    delete: (id: string): Promise<boolean> => 
      ipcRenderer.invoke(IPC_CHANNELS.GAME_DELETE, id),
    
    list: (): Promise<SavedGame[]> => 
      ipcRenderer.invoke(IPC_CHANNELS.GAME_LIST),
  },

  ai: {
    request: (request: AIRequest): Promise<AIResponse> => 
      ipcRenderer.invoke(IPC_CHANNELS.AI_REQUEST, request),
  },

  file: {
    showOpenDialog: (options: OpenDialogOptions) => 
      ipcRenderer.invoke(IPC_CHANNELS.FILE_DIALOG, options),
  },

  app: {
    getInfo: (): Promise<AppInfo> => 
      ipcRenderer.invoke(IPC_CHANNELS.APP_INFO),
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
