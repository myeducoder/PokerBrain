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

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000
};

export function getProvider(name: string): LLMProvider | undefined {
  return providers[name];
}

export function getAvailableProviders(): string[] {
  return Object.keys(providers);
}

function isRetryableError(error: string): boolean {
  const retryablePatterns = [
    /rate limit/i,
    /timeout/i,
    /network/i,
    /connection/i,
    /ECONNREFUSED/i,
    /ETIMEDOUT/i,
    /ENOTFOUND/i,
    /429/,
    /503/,
    /502/,
    /504/
  ];
  
  return retryablePatterns.some(pattern => pattern.test(error));
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 1000;
  return Math.min(exponentialDelay + jitter, maxDelay);
}

export async function chat(
  providerName: string,
  messages: LLMMessage[],
  config: AIConfig,
  options?: LLMRequestOptions,
  retryConfig: RetryConfig = defaultRetryConfig
): Promise<LLMResponse> {
  const provider = getProvider(providerName);
  
  if (!provider) {
    return {
      success: false,
      error: `Unknown provider: ${providerName}. Available: ${getAvailableProviders().join(', ')}`
    };
  }
  
  let lastError: string = '';
  
  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      const response = await provider.chat(messages, config, options);
      
      if (response.success) {
        return response;
      }
      
      lastError = response.error || 'Unknown error';
      
      if (!isRetryableError(lastError)) {
        return response;
      }
      
      if (attempt < retryConfig.maxRetries) {
        const delayMs = calculateDelay(attempt, retryConfig.baseDelay, retryConfig.maxDelay);
        console.log(`LLM request failed (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}), retrying in ${delayMs}ms...`);
        await delay(delayMs);
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      
      if (!isRetryableError(lastError)) {
        return {
          success: false,
          error: lastError
        };
      }
      
      if (attempt < retryConfig.maxRetries) {
        const delayMs = calculateDelay(attempt, retryConfig.baseDelay, retryConfig.maxDelay);
        console.log(`LLM request threw error (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}), retrying in ${delayMs}ms...`);
        await delay(delayMs);
      }
    }
  }
  
  return {
    success: false,
    error: `Failed after ${retryConfig.maxRetries + 1} attempts. Last error: ${lastError}`
  };
}

export async function chatWithFallback(
  messages: LLMMessage[],
  config: AIConfig,
  options?: LLMRequestOptions,
  fallbackProvider?: 'openai' | 'anthropic' | 'ollama' | 'custom'
): Promise<LLMResponse> {
  const primaryProvider = config.provider;
  
  const response = await chat(primaryProvider, messages, config, options);
  
  if (response.success) {
    return response;
  }
  
  if (fallbackProvider && fallbackProvider !== primaryProvider) {
    console.log(`Primary provider ${primaryProvider} failed, trying fallback ${fallbackProvider}...`);
    
    const fallbackConfig: AIConfig = {
      ...config,
      provider: fallbackProvider
    };
    
    const fallbackResponse = await chat(fallbackProvider, messages, fallbackConfig, options);
    
    if (fallbackResponse.success) {
      return {
        ...fallbackResponse,
        usedFallback: true,
        fallbackFrom: primaryProvider
      };
    }
  }
  
  return response;
}

export type { LLMMessage, LLMResponse, LLMRequestOptions };
export { openaiProvider, anthropicProvider, ollamaProvider };
