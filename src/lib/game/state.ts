import { createSignal, createMemo, onCleanup, createEffect, onMount } from "solid-js";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "~/lib/firebase/config";
import { GameDocument, RoundDocument, PlayerHandDocument } from "~/types/game";

export function useGameState(gameId: string | (() => string | undefined), currentUserId: string | (() => string)) {
  const [game, setGame] = createSignal<GameDocument | null>(null);
  const [round, setRound] = createSignal<RoundDocument | null>(null);
  const [hand, setHand] = createSignal<PlayerHandDocument | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<Error | null>(null);

  const userId = createMemo(() => typeof currentUserId === "function" ? currentUserId() : currentUserId);
  const gId = createMemo(() => typeof gameId === "function" ? gameId() : gameId);

  onMount(() => {
    // Game listener
    createEffect(() => {
      const gid = gId();
      if (!gid) return;

      const unsub = onSnapshot(
        doc(db, "games", gid),
        (snapshot) => {
          if (snapshot.exists()) {
            setGame({ id: snapshot.id, ...snapshot.data() } as GameDocument);
            setLoading(false);
          } else {
            setError(new Error("Game not found"));
            setLoading(false);
          }
        },
        (err) => {
          console.error("Game snapshot error:", err);
          setError(err);
          setLoading(false);
        }
      );
      onCleanup(() => unsub());
    });

    createEffect(() => {
      const gid = gId();
      const currentRound = game()?.currentRound;
      if (!gid || !currentRound) {
        setRound(null);
        return;
      }

      setRound(null);
      const unsub = onSnapshot(
        doc(db, "games", gid, "rounds", `round_${currentRound}`),
        (snapshot) => {
          if (snapshot.exists()) {
            setRound(snapshot.data() as RoundDocument);
          } else {
            setRound(null);
          }
        },
        (err) => {
          console.error("Round snapshot error:", err);
        }
      );
      onCleanup(() => unsub());
    });

    // Hand listener
    createEffect(() => {
      const uid = userId();
      const gid = gId();
      if (!uid || !gid) {
        setHand(null);
        return;
      }

      const unsub = onSnapshot(
        doc(db, "games", gid, "playerHands", uid),
        (snapshot) => {
          if (snapshot.exists()) {
            setHand(snapshot.data() as PlayerHandDocument);
          } else {
            setHand(null);
          }
        },
        (err) => {
          console.error("Hand snapshot error:", err);
        }
      );
      onCleanup(() => unsub());
    });
  });

  const isHost = createMemo(() => game()?.hostId === userId());
  const isJudge = createMemo(() => round()?.judgeId === userId());
  const status = createMemo(() => game()?.status || "waiting");

  return {
    game,
    round,
    hand,
    loading,
    error,
    isHost,
    isJudge,
    status
  };
}
