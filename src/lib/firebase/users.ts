import { createSignal, createEffect, onCleanup } from "solid-js";
import { db } from "./config";
import { doc, onSnapshot } from "firebase/firestore";
import { UserDocument } from "~/types/game";

export function useUserData(userId: string | (() => string | undefined)) {
  const [user, setUser] = createSignal<UserDocument | null>(null);
  const [loading, setLoading] = createSignal(true);

  createEffect(() => {
    const uid = typeof userId === "function" ? userId() : userId;
    if (!uid) {
      setUser(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "users", uid),
      (snapshot) => {
        if (snapshot.exists()) {
          setUser(snapshot.data() as UserDocument);
        } else {
          setUser(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("User snapshot error:", error);
        setUser(null);
        setLoading(false);
      }
    );

    onCleanup(() => unsubscribe());
  });

  return { user, loading };
}

const userCache = new Map<string, string>();

export async function getUserDisplayName(userId: string): Promise<string> {
  if (!userId) return "Anonymous Player";
  
  if (userCache.has(userId)) {
    return userCache.get(userId)!;
  }

  const { getDoc, doc: firestoreDoc } = await import("firebase/firestore");
  
  try {
    const userDoc = await getDoc(firestoreDoc(db, "users", userId));
    if (userDoc.exists()) {
      const displayName = userDoc.data().displayName || `User ${userId.slice(0, 5)}`;
      userCache.set(userId, displayName);
      return displayName;
    }
  } catch (error) {
    console.error("Failed to fetch user:", error);
  }
  
  return userId ? `User ${userId.slice(0, 5)}` : "Unknown Player";
}
