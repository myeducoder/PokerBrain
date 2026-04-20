import { LLMProvider } from './base';
import type { LLMMessage, LLMResponse, LLMRequestOptions } from './base';
import { openaiProvider } from './openai';
import { anthropicProvider } from './anthropic';
import { ollamaProvider } from './ollama';
import type { AIConfig } from '../ipcChannels';

const providers: Record<string, LLMProvider> = {
  openai: openaiProvider,
  anthropic: anthropicProvider,
  ollama: ollamaProvider
};

export function getProvider(name: string): LLMProvider | undefined {
  return providers[name];
}

export function getAvailableProviders(): string[] {
  return Object.keys(providers);
}

export async function chat(
  providerName: string,
  messages: LLMMessage[],
  config: AIConfig,
  options?: LLMRequestOptions
): Promise<LLMResponse> {
  const provider = getProvider(providerName);
  
  if (!provider) {
    return {
      success: false,
      error: `Unknown provider: ${providerName}. Available: ${getAvailableProviders().join(', ')}`
    };
  }
  
  return provider.chat(messages, config, options);
}

export type { LLMMessage, LLMResponse, LLMRequestOptions };
export { openaiProvider, anthropicProvider, ollamaProvider };
