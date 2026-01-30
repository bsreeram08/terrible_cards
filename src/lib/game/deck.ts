import { BlackCard, WhiteCard } from "~/types/game";
import defaultDeck from "~/data/deck.json";
import techDeck from "~/data/tech.json";
import { doc, getDoc } from "firebase/firestore";
import { db } from "~/lib/firebase/config";

export interface Deck {
  blackCards: BlackCard[];
  whiteCards: WhiteCard[];
}

export interface DeckMetadata {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  isCustom?: boolean;
}

export const AVAILABLE_DECKS: DeckMetadata[] = [
  {
    id: "default",
    name: "Standard Edition",
    description: "The classic deck for terrible people.",
    cardCount: defaultDeck.whiteCards.length + defaultDeck.blackCards.length
  },
  {
    id: "tech",
    name: "Tech Edition",
    description: "For developers, PMs, and startup founders.",
    cardCount: techDeck.whiteCards.length + techDeck.blackCards.length
  }
];

export async function getHydratedDeck(deckId: string = "default"): Promise<Deck> {
  let sourceDeck: any = defaultDeck;
  
  if (deckId === "tech") {
    sourceDeck = techDeck;
  } else if (deckId !== "default") {
    // Try to load custom deck from Firestore
    try {
      const snap = await getDoc(doc(db, "decks", deckId));
      if (snap.exists()) {
        sourceDeck = snap.data();
      } else {
        console.warn(`Deck ${deckId} not found, falling back to default`);
      }
    } catch (e) {
      console.error("Failed to load custom deck:", e);
    }
  }

  const blackCards: BlackCard[] = sourceDeck.blackCards.map((c: any, i: number) => ({
    ...c,
    id: `b-${deckId}-${i}`
  }));

  const whiteCards: WhiteCard[] = sourceDeck.whiteCards.map((text: any, i: number) => ({
    id: `w-${deckId}-${i}`,
    text: typeof text === 'string' ? text : text.text // Handle both string and object format
  }));

  return { blackCards, whiteCards };
}
