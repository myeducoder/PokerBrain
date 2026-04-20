import { LLMProvider, LLMMessage, LLMResponse, LLMRequestOptions } from './base';
import type { AIConfig } from '../ipcChannels';

export class OllamaProvider extends LLMProvider {
  name = 'ollama';

  async chat(
    messages: LLMMessage[],
    config: AIConfig,
    options?: LLMRequestOptions
  ): Promise<LLMResponse> {
    const baseUrl = config.baseUrl || 'http://localhost:11434';
    const model = config.model || 'llama2';

    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          stream: false,
          options: {
            temperature: options?.temperature ?? config.temperature ?? 0.7,
            num_predict: options?.maxTokens ?? config.maxTokens ?? 1000,
            top_p: options?.topP,
            stop: options?.stopSequences
          }
        })
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Ollama API error: ${response.status}. Is Ollama running?`
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        content: data.message?.content || '',
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
        }
      };
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Cannot connect to Ollama. Make sure Ollama is running on ' + baseUrl
        };
      }
      return this.handleError(error);
    }
  }

  async listModels(baseUrl: string = 'http://localhost:11434'): Promise<string[]> {
    try {
      const response = await fetch(`${baseUrl}/api/tags`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.models?.map((m: { name: string }) => m.name) || [];
    } catch {
      return [];
    }
  }
}

export const ollamaProvider = new OllamaProvider();
