import type { AIConfig } from '../ipcChannels';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  success: boolean;
  content?: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMRequestOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
}

export abstract class LLMProvider {
  abstract name: string;
  
  abstract chat(
    messages: LLMMessage[],
    config: AIConfig,
    options?: LLMRequestOptions
  ): Promise<LLMResponse>;
  
  protected handleError(error: unknown): LLMResponse {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error occurred' };
  }
}
