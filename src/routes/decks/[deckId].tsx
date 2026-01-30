import { createSignal, onMount, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";
import { useAppAuth } from "~/lib/firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "~/lib/firebase/config";

export default function EditDeck() {
  const params = useParams();
  const auth = useAppAuth();
  const [name, setName] = createSignal("");
  const [description, setDescription] = createSignal("");
  const [blackCards, setBlackCards] = createSignal("");
  const [whiteCards, setWhiteCards] = createSignal("");
  const [loading, setLoading] = createSignal(true);
  const [saving, setSaving] = createSignal(false);

  onMount(async () => {
    if (!params.deckId) return;
    try {
      const snap = await getDoc(doc(db, "decks", params.deckId));
      if (snap.exists()) {
        const data = snap.data();
        setName(data.name);
        setDescription(data.description);
        setBlackCards(data.blackCards.map((c: any) => c.text).join("\n"));
        setWhiteCards(data.whiteCards.map((c: any) => c.text).join("\n"));
      }
    } catch (e) {
      console.error("Failed to load deck:", e);
    } finally {
      setLoading(false);
    }
  });

  const handleSave = async () => {
    if (!auth.data?.uid || !params.deckId) return;
    setSaving(true);

    try {
      const black = blackCards().split("\n").filter(t => t.trim()).map((text, i) => ({
        id: `b-${i}`,
        text: text.trim(),
        pick: (text.match(/_______/g) || []).length || 1
      }));

      const white = whiteCards().split("\n").filter(t => t.trim()).map((text, i) => ({
        id: `w-${i}`,
        text: text.trim()
      }));

      await updateDoc(doc(db, "decks", params.deckId), {
        name: name(),
        description: description(),
        blackCards: black,
        whiteCards: white,
        cardCount: black.length + white.length,
        updatedAt: serverTimestamp()
      });

      window.location.href = "/decks";
    } catch (e) {
      console.error("Failed to update deck:", e);
      alert("Failed to update deck");
      setSaving(false);
    }
  };

  return (
    <main class="min-h-screen p-8 max-w-4xl mx-auto space-y-8">
      <Title>Edit Deck - Terrible Cards</Title>
      
      <div class="flex items-center gap-4">
        <a href="/decks" class="text-gray-400 hover:text-gray-600 font-bold">← Back</a>
        <h1 class="text-3xl font-black uppercase tracking-tighter">Edit Deck</h1>
      </div>

      <Show when={!loading()} fallback={<div class="text-center p-20">Loading...</div>}>
        <div class="grid gap-8 md:grid-cols-2">
          <Card class="space-y-6 md:col-span-2">
            <Input 
              label="Deck Name" 
              value={name()} 
              onInput={(e) => setName(e.currentTarget.value)}
            />
            <Input 
              label="Description" 
              value={description()} 
              onInput={(e) => setDescription(e.currentTarget.value)}
            />
          </Card>

          <Card class="space-y-4">
            <div class="flex justify-between items-center">
              <label class="font-bold text-sm uppercase tracking-widest text-gray-500">Black Cards</label>
            </div>
            <textarea
              class="w-full h-96 p-4 rounded-lg border border-gray-200 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none font-mono text-sm"
              value={blackCards()}
              onInput={(e) => setBlackCards(e.currentTarget.value)}
            />
          </Card>

          <Card class="space-y-4">
            <div class="flex justify-between items-center">
              <label class="font-bold text-sm uppercase tracking-widest text-gray-500">White Cards</label>
            </div>
            <textarea
              class="w-full h-96 p-4 rounded-lg border border-gray-200 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none font-mono text-sm"
              value={whiteCards()}
              onInput={(e) => setWhiteCards(e.currentTarget.value)}
            />
          </Card>
        </div>

        <div class="flex justify-end">
          <Button size="lg" onClick={handleSave} disabled={saving()}>
            {saving() ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Show>
    </main>
  );
}
