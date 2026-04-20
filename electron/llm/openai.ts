import { LLMProvider, LLMMessage, LLMResponse, LLMRequestOptions } from './base';
import type { AIConfig } from '../ipcChannels';

export class OpenAIProvider extends LLMProvider {
  name = 'openai';

  async chat(
    messages: LLMMessage[],
    config: AIConfig,
    options?: LLMRequestOptions
  ): Promise<LLMResponse> {
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'OpenAI API key not configured' };
    }

    const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    const model = config.model || 'gpt-3.5-turbo';

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          temperature: options?.temperature ?? config.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? config.maxTokens ?? 1000,
          top_p: options?.topP,
          stop: options?.stopSequences
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error?.message || `OpenAI API error: ${response.status}`
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        content: data.choices[0]?.message?.content || '',
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        }
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}

export const openaiProvider = new OpenAIProvider();
