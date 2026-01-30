import { useAuth } from "solid-firebase";
import { auth } from "./config";
import { signInAnonymously, signOut, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from "firebase/auth";

export function useAppAuth() {
  return useAuth(auth);
}

export async function loginAnonymously() {
  return signInAnonymously(auth);
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function logout() {
  return signOut(auth);
}

export function waitForAuth(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}
