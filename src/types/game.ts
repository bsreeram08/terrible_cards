import { Timestamp } from "firebase/firestore";

export interface BlackCard {
  id: string;
  text: string;
  pick: number;
}

export interface WhiteCard {
  id: string;
  text: string;
}

export interface GameSettings {
  winningScore: number;
  turnTimeoutSeconds: number;
  cardsPerHand: number;
  deckId: string;
}

export interface GameDocument {
  id: string;
  hostId: string;
  playerUids: string[];
  status: "waiting" | "playing" | "judging" | "round_end" | "finished";
  currentRound: number;
  currentJudgeIndex: number;
  settings: GameSettings;
  scores: {
    [playerId: string]: number;
  };
  deck: {
    blackCardIds: string[];
    whiteCardIds: string[];
  };
  pendingDeals?: {
    [playerId: string]: string[];
  };
  pendingAutoSubmit?: {
    [playerId: string]: string[];
  };
  nextRoundAt?: number | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RoundDocument {
  roundNumber: number;
  judgeId: string;
  blackCard: BlackCard;
  submissions: {
    [playerId: string]: {
      cards: WhiteCard[];
      submittedAt: Timestamp;
    };
  };
  winnerId: string | null;
  winningCards: WhiteCard[] | null;
  status: "submitting" | "judging" | "complete";
  startedAt: Timestamp;
  completedAt: Timestamp | null;
}

export interface PlayerHandDocument {
  cards: WhiteCard[];
  lastUpdated: Timestamp;
}

export interface UserDocument {
  displayName: string;
  email: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}
