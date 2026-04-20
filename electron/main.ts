import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import { IPC_CHANNELS, MatchConfig, SavedGame, AIRequest, AIResponse } from './ipcChannels';
import { configService } from './configService';
import { chat, getAvailableProviders } from './llm/index';
import { getAIAction, testAIConnection, AIActionRequest } from './aiService';

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

function setupIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.CONFIG_SAVE, async (_event, config: MatchConfig) => {
    return configService.saveMatchConfig(config);
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_LOAD, async (_event, id: string) => {
    return configService.loadMatchConfig(id);
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_DELETE, async (_event, id: string) => {
    return configService.deleteMatchConfig(id);
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_LIST, async () => {
    return configService.loadAllMatchConfigs();
  });

  ipcMain.handle(IPC_CHANNELS.GAME_SAVE, async (_event, game: SavedGame) => {
    return configService.saveGame(game);
  });

  ipcMain.handle(IPC_CHANNELS.GAME_LOAD, async (_event, id: string) => {
    return configService.loadGame(id);
  });

  ipcMain.handle(IPC_CHANNELS.GAME_LIST, async () => {
    return configService.loadAllGames();
  });

  ipcMain.handle(IPC_CHANNELS.GAME_DELETE, async (_event, id: string) => {
    return configService.deleteGame(id);
  });

  ipcMain.handle(IPC_CHANNELS.AI_REQUEST, async (_event, request: AIRequest): Promise<AIResponse> => {
    try {
      const config = request.config || {
        provider: request.provider as 'openai' | 'anthropic' | 'ollama',
        model: request.model,
        temperature: 0.7
      };
      
      const response = await chat(
        request.provider,
        request.messages.map(m => ({ role: m.role, content: m.content })),
        config
      );
      
      return {
        success: response.success,
        content: response.content,
        error: response.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  ipcMain.handle('ai:action', async (_event, request: AIActionRequest) => {
    return getAIAction(request);
  });

  ipcMain.handle('ai:test', async (_event, provider: string, config: { apiKey?: string; baseUrl?: string; model?: string }) => {
    return testAIConnection(provider, {
      provider: provider as 'openai' | 'anthropic' | 'ollama',
      model: config.model || '',
      apiKey: config.apiKey || '',
      baseUrl: config.baseUrl || '',
      temperature: 0.7
    });
  });

  ipcMain.handle('ai:providers', async () => {
    return getAvailableProviders();
  });

  ipcMain.handle(IPC_CHANNELS.FILE_DIALOG, async (_event, options: Electron.OpenDialogOptions) => {
    if (!win) return { canceled: true, filePaths: [] };
    return dialog.showOpenDialog(win, options);
  });

  ipcMain.handle(IPC_CHANNELS.APP_INFO, async () => {
    return configService.getAppInfo();
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();
});
