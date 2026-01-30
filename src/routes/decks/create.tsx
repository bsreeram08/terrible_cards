import { createSignal, Show } from "solid-js";
import { Title } from "@solidjs/meta";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";
import { useAppAuth } from "~/lib/firebase/auth";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "~/lib/firebase/config";
import { PaymentModal } from "~/components/ui/PaymentModal";

export default function CreateDeck() {
  const auth = useAppAuth();
  const [name, setName] = createSignal("");
  const [description, setDescription] = createSignal("");
  const [blackCards, setBlackCards] = createSignal("");
  const [whiteCards, setWhiteCards] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [showPayment, setShowPayment] = createSignal(false);

  const performSave = async () => {
    if (!auth.data?.uid) return;
    setLoading(true);

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

      if (black.length < 5 || white.length < 10) {
        alert("Please add at least 5 black cards and 10 white cards.");
        setLoading(false);
        return;
      }

      await addDoc(collection(db, "decks"), {
        name: name(),
        description: description(),
        authorId: auth.data.uid,
        blackCards: black,
        whiteCards: white,
        cardCount: black.length + white.length,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      window.location.href = "/decks";
    } catch (e) {
      console.error("Failed to create deck:", e);
      alert("Failed to create deck");
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!auth.data?.uid) return;
    
    // Check if user already has 1 deck
    try {
      const q = query(
        collection(db, "decks"), 
        where("authorId", "==", auth.data.uid)
      );
      const snap = await getDocs(q);
      
      if (snap.size >= 1) {
        setShowPayment(true);
        return;
      }
      
      await performSave();
    } catch (e) {
      console.error("Failed to check deck limit:", e);
      await performSave(); // Fallback
    }
  };

  return (
    <main class="min-h-screen p-8 max-w-4xl mx-auto space-y-8">
      <Title>Create Deck - Terrible Cards</Title>
      
      <PaymentModal
        isOpen={showPayment()}
        onClose={() => setShowPayment(false)}
        onSuccess={performSave}
        itemName="Unlimited Decks"
        price="$4.99"
      />
      
      <div class="flex items-center gap-4">
        <a href="/decks" class="text-gray-400 hover:text-gray-600 font-bold">← Back</a>
        <h1 class="text-3xl font-black uppercase tracking-tighter">New Custom Deck</h1>
      </div>

      <div class="grid gap-8 md:grid-cols-2">
        <Card class="space-y-6 md:col-span-2">
          <Input 
            label="Deck Name" 
            placeholder="e.g. My Awesome Expansion" 
            value={name()} 
            onInput={(e) => setName(e.currentTarget.value)}
          />
          <Input 
            label="Description" 
            placeholder="A short description of your deck" 
            value={description()} 
            onInput={(e) => setDescription(e.currentTarget.value)}
          />
        </Card>

        <Card class="space-y-4">
          <div class="flex justify-between items-center">
            <label class="font-bold text-sm uppercase tracking-widest text-gray-500">Black Cards (Prompts)</label>
            <span class="text-xs text-gray-400">One per line. Use _______ for blanks.</span>
          </div>
          <textarea
            class="w-full h-96 p-4 rounded-lg border border-gray-200 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none font-mono text-sm"
            placeholder={"What's that smell?\nWhy am I sticky?\n_______: The Musical!"}
            value={blackCards()}
            onInput={(e) => setBlackCards(e.currentTarget.value)}
          />
        </Card>

        <Card class="space-y-4">
          <div class="flex justify-between items-center">
            <label class="font-bold text-sm uppercase tracking-widest text-gray-500">White Cards (Answers)</label>
            <span class="text-xs text-gray-400">One per line.</span>
          </div>
          <textarea
            class="w-full h-96 p-4 rounded-lg border border-gray-200 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none font-mono text-sm"
            placeholder={"Bees?\nA sad handjob.\nExploding pigeons."}
            value={whiteCards()}
            onInput={(e) => setWhiteCards(e.currentTarget.value)}
          />
        </Card>
      </div>

      <div class="flex justify-end">
        <Button size="lg" onClick={handleSave} disabled={loading()}>
          {loading() ? "Creating..." : "Create Deck"}
        </Button>
      </div>
    </main>
  );
}
