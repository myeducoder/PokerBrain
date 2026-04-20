import { Player, Pot } from './types';

export function calculatePots(players: Player[]): Pot[] {
  const activePlayers = players.filter(p => !p.isFolded && p.totalBetInHand > 0);
  
  if (activePlayers.length === 0) {
    return [];
  }

  const pots: Pot[] = [];
  const sortedPlayers = [...activePlayers].sort((a, b) => a.totalBetInHand - b.totalBetInHand);
  
  let processedAmount = 0;
  
  for (let i = 0; i < sortedPlayers.length; i++) {
    const currentPlayer = sortedPlayers[i];
    const currentBet = currentPlayer.totalBetInHand;
    
    if (currentBet <= processedAmount) continue;
    
    const levelAmount = currentBet - processedAmount;
    const eligiblePlayers = sortedPlayers
      .filter(p => p.totalBetInHand >= currentBet)
      .map(p => p.id);
    
    const contributors = sortedPlayers.filter(p => p.totalBetInHand > processedAmount);
    const potAmount = levelAmount * contributors.length;
    
    if (potAmount > 0 && eligiblePlayers.length > 0) {
      pots.push({
        amount: potAmount,
        eligiblePlayers,
        isSidePot: pots.length > 0
      });
    }
    
    processedAmount = currentBet;
  }

  return pots;
}

export function getTotalPotAmount(pots: Pot[]): number {
  return pots.reduce((sum, pot) => sum + pot.amount, 0);
}

export function distributePotToWinners(
  pot: Pot,
  winners: { playerId: string; handRank: string }[]
): { playerId: string; amount: number }[] {
  const eligibleWinners = winners.filter(w => pot.eligiblePlayers.includes(w.playerId));
  
  if (eligibleWinners.length === 0) {
    return [];
  }

  const shareAmount = Math.floor(pot.amount / eligibleWinners.length);
  const remainder = pot.amount % eligibleWinners.length;

  return eligibleWinners.map((winner, index) => ({
    playerId: winner.playerId,
    amount: shareAmount + (index === 0 ? remainder : 0)
  }));
}

export function calculateSidePots(players: Player[]): Pot[] {
  const allInPlayers = players.filter(p => p.isAllIn && p.totalBetInHand > 0);
  const nonAllInPlayers = players.filter(p => !p.isFolded && !p.isAllIn && p.totalBetInHand > 0);
  
  if (allInPlayers.length === 0) {
    return [];
  }

  const sortedAllIn = [...allInPlayers].sort((a, b) => a.totalBetInHand - b.totalBetInHand);
  const pots: Pot[] = [];
  let processedAmount = 0;

  for (const allInPlayer of sortedAllIn) {
    const playerBet = allInPlayer.totalBetInHand;
    const levelAmount = playerBet - processedAmount;
    
    if (levelAmount <= 0) continue;

    const eligiblePlayers = players
      .filter(p => !p.isFolded && p.totalBetInHand >= playerBet)
      .map(p => p.id);

    const contributors = [...allInPlayers, ...nonAllInPlayers].filter(
      p => p.totalBetInHand >= playerBet
    );
    
    const potAmount = levelAmount * contributors.length;

    if (potAmount > 0 && eligiblePlayers.length > 0) {
      pots.push({
        amount: potAmount,
        eligiblePlayers,
        isSidePot: true
      });
    }

    processedAmount = playerBet;
  }

  return pots;
}
