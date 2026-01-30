import { Title } from "@solidjs/meta";
import { createSignal, Show } from "solid-js";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";
import { generateRandomName } from "~/lib/utils/nameGenerator";

export default function Login() {
  const [guestName, setGuestName] = createSignal("");
  const [showNameInput, setShowNameInput] = createSignal(false);
  const [loading, setLoading] = createSignal(false);

  const handleGuestLogin = async () => {
    if (!showNameInput()) {
      setShowNameInput(true);
      return;
    }

    const { loginAnonymously } = await import("~/lib/firebase/auth");
    const { db } = await import("~/lib/firebase/config");
    const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
    
    setLoading(true);
    try {
      const userCredential = await loginAnonymously();
      const user = userCredential.user;
      
      const displayName = guestName().trim() || generateRandomName();
      
      await setDoc(doc(db, "users", user.uid), {
        displayName,
        isAnonymous: true,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      }, { merge: true });
      
      window.location.href = "/";
    } catch (error) {
      console.error("Login failed:", error);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { loginWithGoogle } = await import("~/lib/firebase/auth");
    const { db } = await import("~/lib/firebase/config");
    const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");

    setLoading(true);
    try {
      const userCredential = await loginWithGoogle();
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        isAnonymous: false,
        lastLoginAt: serverTimestamp()
      }, { merge: true });

      window.location.href = "/";
    } catch (error) {
      console.error("Google login failed:", error);
      setLoading(false);
    }
  };

  return (
    <main class="min-h-screen flex items-center justify-center p-4">
      <Title>Login - Terrible Cards</Title>
      
      <Card class="w-full max-w-md space-y-8 p-10">
        <div class="text-center space-y-2">
          <h1 class="text-4xl font-black tracking-tighter uppercase">Terrible Cards</h1>
          <p class="text-gray-500 font-medium italic">A party game for creative people</p>
        </div>

        <div class="space-y-4 pt-4">
          <Show when={showNameInput()}>
            <Input
              label="Your Name (optional)"
              placeholder="Enter a nickname or leave blank"
              value={guestName()}
              onInput={(e) => setGuestName(e.currentTarget.value)}
              maxLength={20}
            />
          </Show>

          <Button 
            class="w-full" 
            variant="primary" 
            size="lg" 
            onClick={handleGuestLogin}
            disabled={loading()}
          >
            {loading() ? "Joining..." : (showNameInput() ? "Join Game" : "Play as Guest")}
          </Button>
          
          <Show when={!showNameInput()}>
            <Button 
              class="w-full" 
              variant="secondary" 
              size="lg" 
              onClick={handleGoogleLogin}
              disabled={loading()}
            >
              Sign in with Google
            </Button>
          </Show>

          <Show when={showNameInput()}>
            <button 
              class="w-full text-sm text-gray-400 hover:text-gray-600 font-bold uppercase tracking-widest"
              onClick={() => setShowNameInput(false)}
            >
              ← Back
            </button>
          </Show>
        </div>

        <p class="text-center text-xs text-gray-400 font-bold uppercase tracking-widest pt-4">
          Fill in the blanks. Win points. Have fun.
        </p>
      </Card>
    </main>
  );
}
