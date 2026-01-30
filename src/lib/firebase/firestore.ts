import { useFirestore } from "solid-firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { db } from "./config";

export function useGameDoc(gameId: string) {
  const gameRef = doc(db, "games", gameId);
  return useFirestore(gameRef);
}

export function usePlayerHand(gameId: string, playerId: string) {
  const handRef = doc(db, "games", gameId, "playerHands", playerId);
  return useFirestore(handRef);
}

export function useGameRounds(gameId: string) {
  const roundsRef = collection(db, "games", gameId, "rounds");
  return useFirestore(roundsRef);
}

export function useActiveGames() {
  const gamesRef = collection(db, "games");
  const activeGamesQuery = query(gamesRef, where("status", "==", "waiting"));
  return useFirestore(activeGamesQuery);
}
