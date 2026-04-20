import { app } from 'electron';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { MatchConfig, SavedGame } from './ipcChannels';

const MATCH_CONFIG_FILE = 'match-configs.json';
const SAVED_GAMES_FILE = 'saved-games.json';

function getUserDataPath(): string {
  return app.getPath('userData');
}

function ensureDirectory(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getFilePath(filename: string): string {
  const userDataPath = getUserDataPath();
  ensureDirectory(userDataPath);
  return path.join(userDataPath, filename);
}

function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as T;
    }
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
  }
  return defaultValue;
}

function writeJsonFile<T>(filePath: string, data: T): boolean {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    return false;
  }
}

export class ConfigService {
  private matchConfigsPath: string;
  private savedGamesPath: string;

  constructor() {
    this.matchConfigsPath = getFilePath(MATCH_CONFIG_FILE);
    this.savedGamesPath = getFilePath(SAVED_GAMES_FILE);
  }

  saveMatchConfig(config: MatchConfig): boolean {
    const configs = this.loadAllMatchConfigs();
    const existingIndex = configs.findIndex(c => c.id === config.id);
    
    if (existingIndex >= 0) {
      configs[existingIndex] = { ...config, updatedAt: new Date().toISOString() };
    } else {
      configs.push({
        ...config,
        createdAt: config.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    return writeJsonFile(this.matchConfigsPath, configs);
  }

  loadMatchConfig(id: string): MatchConfig | null {
    const configs = this.loadAllMatchConfigs();
    return configs.find(c => c.id === id) || null;
  }

  loadAllMatchConfigs(): MatchConfig[] {
    return readJsonFile<MatchConfig[]>(this.matchConfigsPath, []);
  }

  deleteMatchConfig(id: string): boolean {
    const configs = this.loadAllMatchConfigs();
    const filtered = configs.filter(c => c.id !== id);
    return writeJsonFile(this.matchConfigsPath, filtered);
  }

  saveGame(game: SavedGame): boolean {
    const games = this.loadAllGames();
    const existingIndex = games.findIndex(g => g.id === game.id);
    
    if (existingIndex >= 0) {
      games[existingIndex] = { ...game, updatedAt: new Date().toISOString() };
    } else {
      games.push({
        ...game,
        createdAt: game.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    return writeJsonFile(this.savedGamesPath, games);
  }

  loadGame(id: string): SavedGame | null {
    const games = this.loadAllGames();
    return games.find(g => g.id === id) || null;
  }

  loadAllGames(): SavedGame[] {
    return readJsonFile<SavedGame[]>(this.savedGamesPath, []);
  }

  deleteGame(id: string): boolean {
    const games = this.loadAllGames();
    const filtered = games.filter(g => g.id !== id);
    return writeJsonFile(this.savedGamesPath, filtered);
  }

  getAppInfo() {
    return {
      version: app.getVersion(),
      name: app.getName(),
      platform: process.platform,
      userDataPath: getUserDataPath()
    };
  }
}

export const configService = new ConfigService();
