import { BrowserWindow } from 'electron';
import { IPC_CHANNELS, MatchConfig } from './ipcChannels';
import { GameLoopService, type GameLoopCallbacks } from './game/gameLoopService';
import type { GameState, PlayerAction } from '../src/game/types';

class GameManager {
  private gameLoop: GameLoopService | null = null;
  private win: BrowserWindow | null = null;

  setWindow(window: BrowserWindow) {
    this.win = window;
  }

  startGame(config: MatchConfig): GameState | null {
    if (!this.win) return null;

    this.stopGame();

    const callbacks: GameLoopCallbacks = {
      onStateChange: (state: GameState) => {
        this.win?.webContents.send(IPC_CHANNELS.GAME_STATE, state);
      },
      onLog: (message: string) => {
        this.win?.webContents.send('game:log', message);
      },
      onError: (error: string) => {
        this.win?.webContents.send('game:error', error);
      },
      onAIThinking: (playerId: string) => {
        this.win?.webContents.send('game:ai-thinking', playerId);
      },
      onHandComplete: (winners: GameState['winners']) => {
        this.win?.webContents.send('game:hand-complete', winners);
      },
      onGameComplete: () => {
        this.win?.webContents.send('game:complete');
      }
    };

    this.gameLoop = new GameLoopService(callbacks);
    const state = this.gameLoop.initialize(config);
    
    return state;
  }

  startNewHand(): GameState | null {
    if (!this.gameLoop) return null;
    return this.gameLoop.startNewHand();
  }

  async executeAction(action: PlayerAction, amount?: number): Promise<void> {
    if (!this.gameLoop) return;
    await this.gameLoop.executeHumanAction(action, amount);
  }

  getState(): GameState | null {
    return this.gameLoop?.getState() ?? null;
  }

  isWaitingForHuman(): boolean {
    return this.gameLoop?.isWaitingForHuman() ?? false;
  }

  pauseGame(): void {
    this.gameLoop?.pause();
  }

  resumeGame(): void {
    this.gameLoop?.resume();
  }

  stopGame(): void {
    this.gameLoop?.stop();
    this.gameLoop = null;
  }
}

export const gameManager = new GameManager();
