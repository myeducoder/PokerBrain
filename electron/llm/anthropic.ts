import { LLMProvider, LLMMessage, LLMResponse, LLMRequestOptions } from './base';
import type { AIConfig } from '../ipcChannels';

export class AnthropicProvider extends LLMProvider {
  name = 'anthropic';

  async chat(
    messages: LLMMessage[],
    config: AIConfig,
    options?: LLMRequestOptions
  ): Promise<LLMResponse> {
    const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'Anthropic API key not configured' };
    }

    const baseUrl = config.baseUrl || 'https://api.anthropic.com';
    const model = config.model || 'claude-3-sonnet-20240229';

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
          max_tokens: options?.maxTokens ?? config.maxTokens ?? 1000,
          system: systemMessage?.content,
          messages: nonSystemMessages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
          })),
          temperature: options?.temperature ?? config.temperature ?? 0.7,
          top_p: options?.topP,
          stop_sequences: options?.stopSequences
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error?.message || `Anthropic API error: ${response.status}`
        };
      }

      const data = await response.json();
      const textContent = data.content?.find((c: { type: string; text?: string }) => c.type === 'text');
      
      return {
        success: true,
        content: textContent?.text || '',
        usage: {
          promptTokens: data.usage?.input_tokens || 0,
          completionTokens: data.usage?.output_tokens || 0,
          totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
        }
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}

export const anthropicProvider = new AnthropicProvider();
