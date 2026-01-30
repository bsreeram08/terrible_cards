import { db, auth } from "~/lib/firebase/config";
import { doc, runTransaction, serverTimestamp, arrayRemove, arrayUnion, deleteField, writeBatch, updateDoc } from "firebase/firestore";
import { GameDocument, RoundDocument, WhiteCard, BlackCard } from "~/types/game";

export async function bootstrapPlayerHands(gameId: string, playerIds: string[]) {
  const batch = writeBatch(db);
  for (const playerId of playerIds) {
    const handRef = doc(db, "games", gameId, "playerHands", playerId);
    batch.set(handRef, {
      cards: [],
      lastUpdated: serverTimestamp()
    });
  }
  await batch.commit();
}

export async function startGameAction(gameId: string, deck: { blackCards: BlackCard[], whiteCards: WhiteCard[] }) {
  await runTransaction(db, async (tx) => {
    const gameRef = doc(db, "games", gameId);
    const gameSnap = await tx.get(gameRef);
    const gameData = gameSnap.data() as GameDocument;

    if (gameData.status !== "waiting") throw new Error("Game already started");
    
    const playerIds = gameData.playerUids.filter(id => !!id);
    
    const pendingDeals: { [key: string]: string[] } = {};
    const whiteCardIds = [...deck.whiteCards.map(c => c.id)];
    const shuffledWhite = whiteCardIds.sort(() => Math.random() - 0.5);
    
    for (const pid of playerIds) {
      pendingDeals[pid] = shuffledWhite.splice(0, gameData.settings.cardsPerHand);
    }

    const blackCardIds = deck.blackCards.map(c => c.id);
    const shuffledBlack = blackCardIds.sort(() => Math.random() - 0.5);
    const firstBlackId = shuffledBlack.pop()!;
    const firstBlack = deck.blackCards.find(c => c.id === firstBlackId)!;

    const roundRef = doc(db, "games", gameId, "rounds", "round_1");
    tx.set(roundRef, {
      roundNumber: 1,
      judgeId: playerIds[0],
      blackCard: firstBlack,
      submissions: {},
      winnerId: null,
      status: "submitting",
      startedAt: serverTimestamp(),
      completedAt: null
    });

    tx.update(gameRef, {
      status: "playing",
      currentRound: 1,
      currentJudgeIndex: 0,
      playerUids: playerIds,
      pendingDeals,
      scores: Object.fromEntries(playerIds.map(id => [id, 0])),
      "deck.whiteCardIds": shuffledWhite,
      "deck.blackCardIds": shuffledBlack,
      updatedAt: serverTimestamp()
    });
  });
}

export async function claimCardsAction(gameId: string, userId: string, cards: WhiteCard[]) {
  const { getDoc, setDoc } = await import("firebase/firestore");
  
  await runTransaction(db, async (tx) => {
    const gameRef = doc(db, "games", gameId);
    const handRef = doc(db, "games", gameId, "playerHands", userId);
    
    const gameSnap = await tx.get(gameRef);
    const gameData = gameSnap.data() as GameDocument;
    
    if (!gameData.pendingDeals?.[userId]) return;

    const handSnap = await tx.get(handRef);
    const existingCards = handSnap.exists() ? (handSnap.data()?.cards || []) : [];
    
    tx.set(handRef, {
      cards: [...existingCards, ...cards],
      lastUpdated: serverTimestamp()
    }, { merge: true });

    tx.update(gameRef, {
      [`pendingDeals.${userId}`]: deleteField()
    });
  });
}

export async function submitCardsAction(gameId: string, roundId: string, userId: string, cards: WhiteCard[]) {
  await runTransaction(db, async (tx) => {
    const handRef = doc(db, "games", gameId, "playerHands", userId);
    const roundRef = doc(db, "games", gameId, "rounds", roundId);
    const gameRef = doc(db, "games", gameId);
    
    const [handSnap, roundSnap, gameSnap] = await Promise.all([
      tx.get(handRef),
      tx.get(roundRef),
      tx.get(gameRef)
    ]);

    const currentCards = (handSnap.data()?.cards || []) as WhiteCard[];
    const remainingCards = currentCards.filter(c => !cards.find(sc => sc.id === c.id));

    const gameData = gameSnap.data() as GameDocument;
    const roundData = roundSnap.data() as RoundDocument;
    
    const submissions = { ...roundData.submissions, [userId]: { cards, submittedAt: serverTimestamp() } };
    const playerUids = gameData.playerUids.filter(id => !!id);
    const judgeId = roundData.judgeId;
    
    const nonJudges = playerUids.filter(uid => uid !== judgeId);
    const allSubmitted = nonJudges.every(uid => !!submissions[uid]);
    
    tx.update(handRef, { cards: remainingCards });
    
    tx.update(roundRef, {
      [`submissions.${userId}`]: {
        cards,
        submittedAt: serverTimestamp()
      }
    });

    if (allSubmitted) {
      tx.update(roundRef, { status: "judging" });
      tx.update(gameRef, { status: "judging" });
    }
  });
}

export async function selectWinnerAction(gameId: string, roundId: string, winnerId: string, noPoints: boolean = false) {
  await runTransaction(db, async (tx) => {
    const gameRef = doc(db, "games", gameId);
    const roundRef = doc(db, "games", gameId, "rounds", roundId);
    
    const [gameSnap, roundSnap] = await Promise.all([tx.get(gameRef), tx.get(roundRef)]);
    const gameData = gameSnap.data() as GameDocument;
    const roundData = roundSnap.data() as RoundDocument;

    if (roundData.status !== "judging") return;

    const submissions = roundData.submissions;
    if (!submissions[winnerId]) return;
    
    const winningCards = submissions[winnerId].cards;

    tx.update(roundRef, {
      winnerId,
      winningCards,
      status: "complete",
      completedAt: serverTimestamp()
    });

    const currentScore = gameData.scores[winnerId] || 0;
    const newScore = noPoints ? currentScore : currentScore + 1;
    
    const status = newScore >= gameData.settings.winningScore ? "finished" : "round_end";

    tx.update(gameRef, {
      [`scores.${winnerId}`]: newScore,
      status,
      nextRoundAt: Date.now() + 4000,
      updatedAt: serverTimestamp()
    });
  });
}

export async function nextRoundAction(gameId: string, deck: { blackCards: BlackCard[], whiteCards: WhiteCard[] }) {
  await runTransaction(db, async (tx) => {
    const gameRef = doc(db, "games", gameId);
    const gameSnap = await tx.get(gameRef);
    const gameData = gameSnap.data() as GameDocument;

    if (gameData.status !== "round_end") throw new Error("Round not ended yet");

    const playerIds = gameData.playerUids;
    const nextRoundNumber = gameData.currentRound + 1;
    const nextJudgeIndex = (gameData.currentJudgeIndex + 1) % playerIds.length;
    
    const pendingDeals: { [key: string]: string[] } = {};
    const whiteCardIds = [...gameData.deck.whiteCardIds];
    
    const handRefs = playerIds.map(pid => doc(db, "games", gameId, "playerHands", pid));
    const handSnaps = await Promise.all(handRefs.map(ref => tx.get(ref)));
    
    for (let i = 0; i < playerIds.length; i++) {
      const pid = playerIds[i];
      const currentHandCount = handSnaps[i].data()?.cards?.length || 0;
      const needed = gameData.settings.cardsPerHand - currentHandCount;
      if (needed > 0) {
        pendingDeals[pid] = whiteCardIds.splice(0, needed);
      }
    }

    const blackCardIds = [...gameData.deck.blackCardIds];
    const nextBlackId = blackCardIds.pop()!;
    const nextBlack = deck.blackCards.find(c => c.id === nextBlackId)!;

    const roundRef = doc(db, "games", gameId, "rounds", `round_${nextRoundNumber}`);
    tx.set(roundRef, {
      roundNumber: nextRoundNumber,
      judgeId: playerIds[nextJudgeIndex],
      blackCard: nextBlack,
      submissions: {},
      winnerId: null,
      status: "submitting",
      startedAt: serverTimestamp(),
      completedAt: null
    });

    tx.update(gameRef, {
      status: "playing",
      currentRound: nextRoundNumber,
      currentJudgeIndex: nextJudgeIndex,
      pendingDeals,
      "deck.whiteCardIds": whiteCardIds,
      "deck.blackCardIds": blackCardIds,
      nextRoundAt: null,
      updatedAt: serverTimestamp()
    });
  });
}

export async function setNextRoundTransitionAction(gameId: string, timestamp: number) {
  const gameRef = doc(db, "games", gameId);
  await updateDoc(gameRef, {
    nextRoundAt: timestamp,
    updatedAt: serverTimestamp()
  });
}

export async function leaveGameAction(gameId: string, userId: string) {
  const { updateDoc, deleteField } = await import("firebase/firestore");
  const gameRef = doc(db, "games", gameId);
  
  await updateDoc(gameRef, {
    playerUids: arrayRemove(userId),
    [`scores.${userId}`]: deleteField(),
    updatedAt: serverTimestamp()
  });
}

export async function endGameAction(gameId: string) {
  const gameRef = doc(db, "games", gameId);
  await updateDoc(gameRef, {
    status: "finished",
    updatedAt: serverTimestamp()
  });
}

export async function kickPlayerAction(gameId: string, hostId: string, playerIdToKick: string) {
  await runTransaction(db, async (tx) => {
    const gameRef = doc(db, "games", gameId);
    const gameSnap = await tx.get(gameRef);
    const gameData = gameSnap.data() as GameDocument;

    if (gameData.hostId !== hostId) {
      throw new Error("Only the host can kick players");
    }
    
    if (gameData.status !== "waiting") {
      throw new Error("Cannot kick players during active game");
    }

    if (playerIdToKick === hostId) {
      throw new Error("Host cannot kick themselves");
    }

    tx.update(gameRef, {
      playerUids: arrayRemove(playerIdToKick),
      [`scores.${playerIdToKick}`]: deleteField(),
      updatedAt: serverTimestamp()
    });
  });
}

export async function hostAutoSubmitForPlayers(gameId: string, roundId: string) {
  const roundRef = doc(db, "games", gameId, "rounds", roundId);
  const gameRef = doc(db, "games", gameId);
  
  const gameSnap = await import("firebase/firestore").then(m => m.getDoc(gameRef));
  const roundSnap = await import("firebase/firestore").then(m => m.getDoc(roundRef));
  
  if (!gameSnap.exists() || !roundSnap.exists()) return;
  
  const gameData = gameSnap.data() as GameDocument;
  const roundData = roundSnap.data() as RoundDocument;
  
  if (roundData.status !== "submitting") return;
  
  const playerUids = gameData.playerUids;
  const judgeId = roundData.judgeId;
  const requiredPick = roundData.blackCard.pick;
  
  const pendingPlayers = playerUids.filter(uid => 
    uid !== judgeId && !roundData.submissions[uid]
  );
  
  for (const userId of pendingPlayers) {
    try {
      await runTransaction(db, async (tx) => {
        const rSnap = await tx.get(roundRef);
        if (rSnap.data()?.submissions[userId]) return;
        
        const handRef = doc(db, "games", gameId, "playerHands", userId);
        const handSnap = await tx.get(handRef);
        const handData = handSnap.data();
        const cards = handData?.cards || [];
        
        if (cards.length < requiredPick) return;
        
        const shuffled = [...cards].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, requiredPick);
        const remaining = cards.filter((c: WhiteCard) => !selected.find(s => s.id === c.id));
        
        tx.update(handRef, { cards: remaining });
        tx.update(roundRef, {
          [`submissions.${userId}`]: {
            cards: selected,
            submittedAt: serverTimestamp()
          }
        });
        
        const currentSubmissions = { ...rSnap.data()?.submissions, [userId]: { cards: selected } };
        const nonJudges = playerUids.filter(uid => uid !== judgeId);
        const allSubmitted = nonJudges.every(uid => !!currentSubmissions[uid]);
        
        if (allSubmitted) {
          tx.update(roundRef, { status: "judging" });
          tx.update(gameRef, { status: "judging" });
        }
      });
    } catch (e) {
      console.error(`Auto-submit failed for ${userId}:`, e);
    }
  }
}

export async function hostAutoJudge(gameId: string, roundId: string) {
  const roundRef = doc(db, "games", gameId, "rounds", roundId);
  const roundSnap = await import("firebase/firestore").then(m => m.getDoc(roundRef));
  
  if (!roundSnap.exists()) return;
  const roundData = roundSnap.data() as RoundDocument;
  
  if (roundData.status !== "judging") return;
  
  const submissions = Object.entries(roundData.submissions);
  if (submissions.length === 0) return;
  
  const winnerId = submissions[0][0];
  
  await selectWinnerAction(gameId, roundId, winnerId, true);
}
