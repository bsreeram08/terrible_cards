import { GameDocument, RoundDocument, WhiteCard, BlackCard } from "~/types/game";

export function canStartGame(playerUids: string[]): boolean {
  return playerUids.length >= 3;
}

export function isValidSubmission(
  playerHand: WhiteCard[],
  selectedCards: WhiteCard[],
  blackCard: BlackCard
): boolean {
  if (selectedCards.length !== blackCard.pick) return false;
  
  const handIds = new Set(playerHand.map(c => c.id));
  return selectedCards.every(c => handIds.has(c.id));
}

export function isRoundComplete(
  submissions: RoundDocument["submissions"],
  playerUids: string[],
  judgeId: string
): boolean {
  const nonJudges = playerUids.filter(uid => uid !== judgeId);
  return nonJudges.every(uid => !!submissions[uid]);
}

export function getNextJudgeIndex(
  currentIndex: number,
  playerCount: number
): number {
  return (currentIndex + 1) % playerCount;
}

export function isGameOver(
  scores: { [playerId: string]: number },
  winningScore: number
): string | null {
  for (const [playerId, score] of Object.entries(scores)) {
    if (score >= winningScore) return playerId;
  }
  return null;
}
