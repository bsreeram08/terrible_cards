import { db, auth } from "~/lib/firebase/config";
import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp, updateDoc, arrayUnion } from "firebase/firestore";
import { GameDocument, GameSettings } from "~/types/game";

export async function createGame(hostId: string, settings: GameSettings): Promise<string> {
  const gameRef = doc(collection(db, "games"));
  const gameId = gameRef.id;
  const inviteCode = generateInviteCode();

  const gameData: Partial<GameDocument> = {
    hostId,
    playerUids: [hostId],
    status: "waiting",
    currentRound: 0,
    currentJudgeIndex: 0,
    settings,
    scores: { [hostId]: 0 },
    deck: {
      blackCardIds: [],
      whiteCardIds: []
    },
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any
  };

  await setDoc(gameRef, gameData);

  await setDoc(doc(db, "inviteCodes", inviteCode), {
    gameId,
    createdAt: serverTimestamp()
  });

  return gameId;
}

export async function joinGameByCode(code: string, userId: string): Promise<string> {
  const codeRef = doc(db, "inviteCodes", code.toUpperCase());
  const codeSnap = await getDoc(codeRef);

  if (!codeSnap.exists()) {
    throw new Error("Invalid invite code");
  }

  const { gameId } = codeSnap.data();
  const gameRef = doc(db, "games", gameId);
  const gameSnap = await getDoc(gameRef);

  if (!gameSnap.exists()) {
    throw new Error("Game no longer exists");
  }

  const gameData = gameSnap.data() as GameDocument;
  if (gameData.status !== "waiting") {
    throw new Error("Game has already started");
  }

  if (gameData.playerUids.includes(userId)) {
    return gameId;
  }

  await updateDoc(gameRef, {
    playerUids: arrayUnion(userId),
    [`scores.${userId}`]: 0,
    updatedAt: serverTimestamp()
  });

  return gameId;
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function getInviteCodeForGame(gameId: string): Promise<string | null> {
  const codesRef = collection(db, "inviteCodes");
  const q = query(codesRef, where("gameId", "==", gameId));
  const snap = await getDocs(q);
  
  if (snap.empty) return null;
  return snap.docs[0].id;
}
