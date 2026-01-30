import { createSignal, Show, For, onMount } from "solid-js";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";
import { GameSettings } from "~/types/game";
import { AVAILABLE_DECKS, DeckMetadata } from "~/lib/game/deck";
import { useAppAuth } from "~/lib/firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "~/lib/firebase/config";

export default function CreateGame() {
  const auth = useAppAuth();
  const [winningScore, setWinningScore] = createSignal(7);
  const [selectedDeck, setSelectedDeck] = createSignal("default");
  const [loading, setLoading] = createSignal(false);
  const [customDecks, setCustomDecks] = createSignal<DeckMetadata[]>([]);

  const [error, setError] = createSignal<string | null>(null);

  onMount(async () => {
    if (!auth.data?.uid) return;
    try {
      const q = query(
        collection(db, "decks"), 
        where("authorId", "==", auth.data.uid)
      );
      const snap = await getDocs(q);
      const loadedDecks = snap.docs.map(d => ({ 
        id: d.id, 
        name: d.data().name, 
        description: d.data().description,
        cardCount: d.data().cardCount,
        isCustom: true
      }));
      setCustomDecks(loadedDecks);
    } catch (e) {
      console.error("Failed to load custom decks:", e);
    }
  });

  const allDecks = () => [...AVAILABLE_DECKS, ...customDecks()];

  const handleCreate = async () => {
    const { waitForAuth } = await import("~/lib/firebase/auth");
    const { createGame } = await import("~/lib/game/lobby");
    
    setLoading(true);
    setError(null);
    
    try {
      const user = await waitForAuth();
      if (!user) {
        setError("You must be logged in to create a game");
        setLoading(false);
        return;
      }

      const settings: GameSettings = {
        winningScore: winningScore(),
        turnTimeoutSeconds: 90,
        cardsPerHand: 7,
        deckId: selectedDeck()
      };
      const gameId = await createGame(user.uid, settings);
      window.location.href = `/game/${gameId}`;
    } catch (err: any) {
      console.error("Game creation failed:", err);
      setError(err.message || "Failed to create game");
      setLoading(false);
    }
  };

  return (
    <main class="min-h-screen p-8 flex items-center justify-center">
      <Card class="w-full max-w-md space-y-8">
        <h2 class="text-3xl font-black uppercase tracking-tighter text-center">Create Game</h2>
        
        <Show when={error()}>
          <div class="p-4 bg-red-50 text-red-500 rounded-lg text-sm font-bold border border-red-100">
            {error()}
          </div>
        </Show>

        <div class="space-y-6">
          <Input 
            label="Points to Win" 
            type="number" 
            value={winningScore()} 
            onInput={(e) => setWinningScore(parseInt(e.currentTarget.value))}
            min="3"
            max="20"
          />

          <div class="space-y-2">
            <label class="block text-sm font-black uppercase tracking-widest text-gray-500">
              Select Deck
            </label>
            <div class="grid gap-3 max-h-60 overflow-y-auto pr-2">
              <For each={allDecks()}>
                {(deck) => (
                  <button
                    type="button"
                    class={`
                      flex flex-col items-start p-3 rounded-lg border-2 transition-all text-left w-full
                      ${selectedDeck() === deck.id 
                        ? "border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary" 
                        : "border-gray-200 hover:border-gray-300 bg-white"}
                    `}
                    onClick={() => setSelectedDeck(deck.id)}
                  >
                    <div class="flex justify-between w-full items-center">
                      <span class={`font-bold flex items-center gap-2 ${selectedDeck() === deck.id ? "text-brand-primary" : "text-gray-900"}`}>
                        {deck.name}
                        <Show when={deck.isCustom}>
                          <span class="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase">Custom</span>
                        </Show>
                      </span>
                      <span class="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">
                        {deck.cardCount} cards
                      </span>
                    </div>
                    <p class="text-xs text-gray-500 mt-1 line-clamp-1">{deck.description}</p>
                  </button>
                )}
              </For>
            </div>
          </div>

          <div class="p-4 bg-gray-50 rounded-lg text-sm text-gray-500 space-y-2">
            <p>• <strong>Players:</strong> 3 - 10 players</p>
            <p>• <strong>Timeout:</strong> 90s per round</p>
          </div>

          <Button 
            class="w-full" 
            size="lg" 
            type="button" 
            disabled={loading()}
            onClick={handleCreate}
          >
            {loading() ? "Creating..." : "Start Lobby"}
          </Button>
        </div>
      </Card>
    </main>
  );
}
