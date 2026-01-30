import { createSignal } from "solid-js";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";

export default function JoinGame() {
  const [code, setCode] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  const handleJoin = async (e: Event) => {
    e.preventDefault();
    if (code().length !== 6) {
      setError("Code must be 6 characters");
      return;
    }

    const { waitForAuth } = await import("~/lib/firebase/auth");
    const { joinGameByCode } = await import("~/lib/game/lobby");
    
    setLoading(true);
    setError("");
    
    try {
      const user = await waitForAuth();
      if (!user) {
        setError("You must be logged in to join a game");
        setLoading(false);
        return;
      }

      const gameId = await joinGameByCode(code(), user.uid);
      window.location.href = `/game/${gameId}`;
    } catch (err: any) {
      console.error("Join failed:", err);
      setError(err.message || "Failed to join game");
      setLoading(false);
    }
  };

  return (
    <main class="min-h-screen p-8 flex items-center justify-center">
      <Card class="w-full max-w-md space-y-8">
        <h2 class="text-3xl font-black uppercase tracking-tighter text-center">Join Game</h2>
        
        <form onSubmit={handleJoin} class="space-y-6">
          <Input 
            label="Room Code" 
            placeholder="e.g. AB12XY" 
            value={code()} 
            onInput={(e) => {
              const val = e.currentTarget.value.toUpperCase();
              setCode(val);
              if (error()) setError("");
            }}
            maxLength={6}
            error={error()}
          />

          <Button class="w-full" size="lg" type="submit" disabled={loading()}>
            {loading() ? "Joining..." : "Join Game"}
          </Button>
        </form>

        <div class="text-center">
          <a href="/create" class="text-sm font-bold text-brand-primary uppercase tracking-widest hover:underline">
            Or create a new game
          </a>
        </div>
      </Card>
    </main>
  );
}
