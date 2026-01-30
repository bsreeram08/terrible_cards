import { createSignal, For, Show, onMount } from "solid-js";
import { Title } from "@solidjs/meta";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { useAppAuth } from "~/lib/firebase/auth";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "~/lib/firebase/config";

interface CustomDeck {
  id: string;
  name: string;
  description: string;
  authorId: string;
  cardCount: number;
}

export default function MyDecks() {
  const auth = useAppAuth();
  const [decks, setDecks] = createSignal<CustomDeck[]>([]);
  const [loading, setLoading] = createSignal(true);

  onMount(async () => {
    if (!auth.data?.uid) return;
    await loadDecks();
  });

  const loadDecks = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "decks"), 
        where("authorId", "==", auth.data?.uid)
      );
      const snap = await getDocs(q);
      const loadedDecks = snap.docs.map(d => ({ id: d.id, ...d.data() } as CustomDeck));
      setDecks(loadedDecks);
    } catch (e) {
      console.error("Failed to load decks:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (deckId: string) => {
    if (!confirm("Are you sure you want to delete this deck?")) return;
    try {
      await deleteDoc(doc(db, "decks", deckId));
      setDecks(prev => prev.filter(d => d.id !== deckId));
    } catch (e) {
      console.error("Failed to delete deck:", e);
      alert("Failed to delete deck");
    }
  };

  return (
    <main class="min-h-screen p-8 max-w-4xl mx-auto space-y-8">
      <Title>My Decks - Terrible Cards</Title>
      
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-black uppercase tracking-tighter">My Custom Decks</h1>
        <a href="/decks/create">
          <Button>Create New Deck</Button>
        </a>
      </div>

      <Show when={!loading()} fallback={<div class="text-center p-20">Loading...</div>}>
        <Show when={decks().length > 0} fallback={
          <div class="text-center p-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p class="text-gray-500 font-bold mb-4">You haven't created any decks yet.</p>
            <a href="/decks/create">
              <Button variant="outline">Create Your First Deck</Button>
            </a>
          </div>
        }>
          <div class="grid gap-4 md:grid-cols-2">
            <For each={decks()}>
              {(deck) => (
                <Card class="space-y-4 hover:shadow-lg transition-shadow">
                  <div>
                    <h3 class="text-xl font-bold">{deck.name}</h3>
                    <p class="text-gray-500 text-sm">{deck.description}</p>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-xs font-bold bg-gray-100 px-2 py-1 rounded-full">
                      {deck.cardCount} cards
                    </span>
                    <div class="flex gap-2">
                      <a href={`/decks/${deck.id}`}>
                        <Button size="sm" variant="ghost">Edit</Button>
                      </a>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(deck.id)}>Delete</Button>
                    </div>
                  </div>
                </Card>
              )}
            </For>
          </div>
        </Show>
      </Show>
    </main>
  );
}
