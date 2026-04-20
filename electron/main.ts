import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import { IPC_CHANNELS, MatchConfig, SavedGame, AIRequest, AIResponse } from './ipcChannels';
import { configService } from './configService';

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
      const response = await handleAIRequest(request);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.FILE_DIALOG, async (_event, options: Electron.OpenDialogOptions) => {
    if (!win) return { canceled: true, filePaths: [] };
    return dialog.showOpenDialog(win, options);
  });

  ipcMain.handle(IPC_CHANNELS.APP_INFO, async () => {
    return configService.getAppInfo();
  });
}

async function handleAIRequest(request: AIRequest): Promise<AIResponse> {
  const { provider, model, messages, config } = request;
  
  switch (provider) {
    case 'openai':
      return handleOpenAIRequest(model, messages, config);
    case 'anthropic':
      return handleAnthropicRequest(model, messages, config);
    case 'ollama':
      return handleOllamaRequest(model, messages, config);
    default:
      return {
        success: false,
        error: `Unsupported AI provider: ${provider}`
      };
  }
}

async function handleOpenAIRequest(
  model: string,
  messages: { role: string; content: string }[],
  config?: { apiKey?: string; baseUrl?: string; temperature?: number; maxTokens?: number }
): Promise<AIResponse> {
  const apiKey = config?.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'OpenAI API key not configured' };
  }

  const baseUrl = config?.baseUrl || 'https://api.openai.com/v1';
  
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: config?.temperature ?? 0.7,
        max_tokens: config?.maxTokens ?? 1000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error?.message || 'OpenAI API error' };
    }

    const data = await response.json();
    return {
      success: true,
      content: data.choices[0]?.message?.content || ''
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}

async function handleAnthropicRequest(
  model: string,
  messages: { role: string; content: string }[],
  config?: { apiKey?: string; baseUrl?: string; temperature?: number; maxTokens?: number }
): Promise<AIResponse> {
  const apiKey = config?.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'Anthropic API key not configured' };
  }

  const baseUrl = config?.baseUrl || 'https://api.anthropic.com';
  
  const systemMessage = messages.find(m => m.role === 'system');
  const nonSystemMessages = messages.filter(m => m.role !== 'system');
  
  try {
    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: config?.maxTokens ?? 1000,
        system: systemMessage?.content,
        messages: nonSystemMessages.map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error?.message || 'Anthropic API error' };
    }

    const data = await response.json();
    return {
      success: true,
      content: data.content[0]?.text || ''
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}

async function handleOllamaRequest(
  model: string,
  messages: { role: string; content: string }[],
  config?: { baseUrl?: string; temperature?: number; maxTokens?: number }
): Promise<AIResponse> {
  const baseUrl = config?.baseUrl || 'http://localhost:11434';
  
  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          temperature: config?.temperature ?? 0.7,
          num_predict: config?.maxTokens ?? 1000
        }
      })
    });

    if (!response.ok) {
      return { success: false, error: 'Ollama API error' };
    }

    const data = await response.json();
    return {
      success: true,
      content: data.message?.content || ''
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error (is Ollama running?)'
    };
  }
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
