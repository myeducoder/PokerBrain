import { chat } from './llm/index';
import type { LLMMessage } from './llm/index';
import { 
  buildPokerPrompt, 
  parseAIResponse, 
  validateAction,
  POKER_SYSTEM_PROMPT,
  PokerPromptContext 
} from './llm/promptFormatter';
import type { AIConfig } from './ipcChannels';
import type { PlayerAction, Player } from '../src/game/types';

export interface AIActionRequest {
  provider: string;
  config: AIConfig;
  context: PokerPromptContext;
}

export interface AIActionResponse {
  success: boolean;
  action?: PlayerAction;
  amount?: number;
  rawResponse?: string;
  error?: string;
}

export async function getAIAction(request: AIActionRequest): Promise<AIActionResponse> {
  const { provider, config, context } = request;
  
  const messages: LLMMessage[] = [
    { role: 'system', content: POKER_SYSTEM_PROMPT },
    { role: 'user', content: buildPokerPrompt(context) }
  ];
  
  const response = await chat(provider, messages, config);
  
  if (!response.success) {
    return {
      success: false,
      error: response.error
    };
  }
  
  const rawContent = response.content || '';
  const parsed = parseAIResponse(rawContent);
  
  if (!parsed) {
    return {
      success: false,
      rawResponse: rawContent,
      error: 'Could not parse AI response as a valid poker action'
    };
  }
  
  const currentPlayer = context.gameState.players.find((p: Player) => p.id === context.playerId);
  const maxChips = currentPlayer?.chips || 0;
  
  const validation = validateAction(
    parsed,
    context.availableActions,
    context.minRaiseAmount,
    maxChips
  );
  
  if (!validation.valid) {
    return {
      success: false,
      rawResponse: rawContent,
      error: validation.error
    };
  }
  
  return {
    success: true,
    action: validation.action,
    amount: validation.amount,
    rawResponse: rawContent
  };
}

export async function testAIConnection(
  provider: string,
  config: AIConfig
): Promise<{ success: boolean; error?: string }> {
  const messages: LLMMessage[] = [
    { role: 'user', content: 'Say "OK" if you can read this.' }
  ];
  
  const response = await chat(provider, messages, { ...config, maxTokens: 10 });
  
  return {
    success: response.success,
    error: response.error
  };
}

export { buildPokerPrompt, parseAIResponse, validateAction, POKER_SYSTEM_PROMPT };
export type { PokerPromptContext };
