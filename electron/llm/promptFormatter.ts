import type { GameState, Player, PlayerAction, Card, Pot } from '../../src/game/types';

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
};

function formatCard(card: Card): string {
  return `${card.rank}${SUIT_SYMBOLS[card.suit]}`;
}

function formatCards(cards: Card[]): string {
  return cards.map(formatCard).join(' ');
}

function formatChips(amount: number): string {
  return amount.toLocaleString();
}

export interface PokerPromptContext {
  gameState: GameState;
  playerId: string;
  availableActions: PlayerAction[];
  callAmount: number;
  minRaiseAmount: number;
  potSize: number;
}

export function formatPlayerStatus(player: Player, isCurrentPlayer: boolean): string {
  const status = player.isFolded ? 'FOLDED' : player.isAllIn ? 'ALL-IN' : 'ACTIVE';
  const cards = player.holeCards.length > 0 ? formatCards(player.holeCards) : '???';
  const currentBet = player.currentBet > 0 ? ` (bet: ${formatChips(player.currentBet)})` : '';
  
  return `${isCurrentPlayer ? '>>> ' : ''}${player.name}: ${formatChips(player.chips)} chips | ${cards}${currentBet} [${status}]`;
}

export function formatGameState(context: PokerPromptContext): string {
  const { gameState, playerId, availableActions, callAmount, minRaiseAmount } = context;
  const currentPlayer = gameState.players.find((p: Player) => p.id === playerId);
  
  if (!currentPlayer) {
    return 'Error: Player not found';
  }

  const lines: string[] = [];
  
  lines.push('=== TEXAS HOLD\'EM POKER ===');
  lines.push(`Phase: ${gameState.phase.toUpperCase()}`);
  lines.push(`Hand #${gameState.handNumber}`);
  lines.push('');
  
  lines.push('--- Community Cards ---');
  if (gameState.communityCards.length > 0) {
    lines.push(formatCards(gameState.communityCards));
  } else {
    lines.push('(no cards yet)');
  }
  lines.push('');
  
  lines.push('--- Pot Information ---');
  const totalPot = gameState.pots.reduce((sum: number, pot: Pot) => sum + pot.amount, 0);
  lines.push(`Total Pot: ${formatChips(totalPot)}`);
  if (gameState.pots.length > 1) {
    gameState.pots.forEach((pot: Pot, i: number) => {
      lines.push(`  Pot ${i + 1}: ${formatChips(pot.amount)}${pot.isSidePot ? ' (side pot)' : ''}`);
    });
  }
  lines.push('');
  
  lines.push('--- Players ---');
  gameState.players.forEach((player: Player) => {
    lines.push(formatPlayerStatus(player, player.id === playerId));
  });
  lines.push('');
  
  lines.push('--- Your Turn ---');
  lines.push(`You are: ${currentPlayer.name}`);
  lines.push(`Your cards: ${formatCards(currentPlayer.holeCards)}`);
  lines.push(`Your chips: ${formatChips(currentPlayer.chips)}`);
  lines.push('');
  
  lines.push('--- Available Actions ---');
  lines.push(`Current bet to call: ${formatChips(callAmount)}`);
  lines.push(`Minimum raise: ${formatChips(minRaiseAmount)}`);
  lines.push('');
  
  lines.push('Choose one of the following actions:');
  availableActions.forEach((action, i) => {
    switch (action) {
      case 'fold':
        lines.push(`  ${i + 1}. FOLD - Give up your hand`);
        break;
      case 'check':
        lines.push(`  ${i + 1}. CHECK - Pass without betting (only if no bet to call)`);
        break;
      case 'call':
        lines.push(`  ${i + 1}. CALL - Match the current bet of ${formatChips(callAmount)}`);
        break;
      case 'raise':
        lines.push(`  ${i + 1}. RAISE <amount> - Raise by at least ${formatChips(minRaiseAmount)}`);
        break;
      case 'all-in':
        lines.push(`  ${i + 1}. ALL-IN - Bet all your chips (${formatChips(currentPlayer.chips)})`);
        break;
    }
  });
  
  return lines.join('\n');
}

export const POKER_SYSTEM_PROMPT = `You are an expert Texas Hold'em poker player. Your goal is to make optimal decisions based on game theory and probability.

IMPORTANT RULES:
1. You must respond with ONLY ONE of the following actions:
   - FOLD
   - CHECK
   - CALL
   - RAISE <amount>
   - ALL-IN

2. Do NOT include any explanation, reasoning, or additional text.
3. Respond with ONLY the action.

STRATEGY TIPS:
- Consider your hand strength relative to the board
- Factor in pot odds and implied odds
- Consider your position and opponent tendencies
- Adjust for stack sizes and tournament dynamics
- Bluff occasionally but not predictably

RESPONSE FORMAT:
Just the action, nothing else. Examples:
- FOLD
- CALL
- RAISE 500
- ALL-IN`;

export function buildPokerPrompt(context: PokerPromptContext): string {
  const gameStateText = formatGameState(context);
  
  return `${gameStateText}

---
What is your action? Respond with ONLY the action (FOLD, CHECK, CALL, RAISE <amount>, or ALL-IN).`;
}

export function parseAIResponse(response: string): { action: PlayerAction; amount?: number } | null {
  const cleanResponse = response.trim().toUpperCase();
  
  if (cleanResponse === 'FOLD') {
    return { action: 'fold' };
  }
  
  if (cleanResponse === 'CHECK') {
    return { action: 'check' };
  }
  
  if (cleanResponse === 'CALL') {
    return { action: 'call' };
  }
  
  if (cleanResponse === 'ALL-IN' || cleanResponse === 'ALLIN') {
    return { action: 'all-in' };
  }
  
  const raiseMatch = cleanResponse.match(/^RAISE\s+(\d+)$/);
  if (raiseMatch) {
    return { action: 'raise', amount: parseInt(raiseMatch[1], 10) };
  }
  
  const raiseToMatch = cleanResponse.match(/^(?:RAISE\s+TO|BET)\s+(\d+)$/i);
  if (raiseToMatch) {
    return { action: 'raise', amount: parseInt(raiseToMatch[1], 10) };
  }
  
  return null;
}

export function validateAction(
  parsedAction: { action: PlayerAction; amount?: number } | null,
  availableActions: PlayerAction[],
  minRaise: number,
  maxChips: number
): { valid: boolean; action?: PlayerAction; amount?: number; error?: string } {
  if (!parsedAction) {
    return { valid: false, error: 'Could not parse AI response as a valid action' };
  }
  
  if (!availableActions.includes(parsedAction.action)) {
    return {
      valid: false,
      error: `Action ${parsedAction.action} is not available. Available: ${availableActions.join(', ')}`
    };
  }
  
  if (parsedAction.action === 'raise') {
    if (!parsedAction.amount || parsedAction.amount < minRaise) {
      return {
        valid: false,
        error: `Raise amount must be at least ${minRaise}`
      };
    }
    if (parsedAction.amount > maxChips) {
      return {
        valid: false,
        error: `Raise amount ${parsedAction.amount} exceeds your chips (${maxChips})`
      };
    }
  }
  
  return { valid: true, action: parsedAction.action, amount: parsedAction.amount };
}
