import { Title } from "@solidjs/meta";
import { Show, createSignal, onMount } from "solid-js";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";

export default function Home() {
  const [user, setUser] = createSignal<{ uid: string; displayName?: string | null } | null>(null);
  const [loading, setLoading] = createSignal(true);

  onMount(async () => {
    const { auth } = await import("~/lib/firebase/config");
    const { onAuthStateChanged } = await import("firebase/auth");
    
    onAuthStateChanged(auth, (u) => {
      setUser(u ? { uid: u.uid, displayName: u.displayName } : null);
      setLoading(false);
    });
  });

  return (
    <main class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <Title>Terrible Cards - A Party Game</Title>
      
      <header class="p-4 flex justify-between items-center">
        <div class="font-black italic text-brand-primary uppercase text-xl tracking-tighter">TC</div>
        <Show when={!loading()}>
          <Show when={user()} fallback={
            <a href="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </a>
          }>
            <div class="flex items-center gap-3">
              <span class="text-sm font-bold text-gray-500">
                {user()?.displayName || `Guest ${user()?.uid.slice(0, 6)}`}
              </span>
              <div class="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-black text-sm">
                {(user()?.displayName?.[0] || "G").toUpperCase()}
              </div>
            </div>
          </Show>
        </Show>
      </header>

      <div class="flex-1 flex items-center justify-center p-8">
        <div class="max-w-lg w-full space-y-8 text-center">
          <div class="space-y-4">
            <h1 class="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-brand-secondary">
              Terrible<br />
              <span class="text-brand-primary">Cards</span>
            </h1>
            <p class="text-xl text-gray-500 font-medium italic">
              A party game for creative people. Fill in the blanks with hilariously inappropriate answers.
            </p>
          </div>

          <Show when={!loading()}>
            <Show when={user()} fallback={
              <Card class="p-8 space-y-4">
                <p class="text-gray-600 font-bold">Sign in to start playing</p>
                <a href="/login">
                  <Button size="lg" class="w-full">Get Started</Button>
                </a>
              </Card>
            }>
              <div class="space-y-4">
                <a href="/create">
                  <Button size="lg" class="w-full">Create Game</Button>
                </a>
                <a href="/join">
                  <Button size="lg" variant="outline" class="w-full">Join Game</Button>
                </a>
                <a href="/decks">
                  <Button size="lg" variant="ghost" class="w-full text-brand-secondary">My Custom Decks</Button>
                </a>
              </div>
            </Show>
          </Show>

          <div class="pt-8 border-t border-gray-200">
            <p class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Test Routes</p>
            <div class="flex flex-wrap justify-center gap-2">
              <a href="/test-card" class="text-xs font-bold text-brand-primary hover:underline">Card</a>
              <span class="text-gray-300">•</span>
              <a href="/test-animations" class="text-xs font-bold text-brand-primary hover:underline">Animations</a>
              <span class="text-gray-300">•</span>
              <a href="/test-drag" class="text-xs font-bold text-brand-primary hover:underline">Drag</a>
              <span class="text-gray-300">•</span>
              <a href="/test-particles" class="text-xs font-bold text-brand-primary hover:underline">Particles</a>
              <span class="text-gray-300">•</span>
              <a href="/test-components" class="text-xs font-bold text-brand-primary hover:underline">Components</a>
            </div>
          </div>
        </div>
      </div>

      <footer class="p-4 text-center">
        <p class="text-xs text-gray-400 font-bold uppercase tracking-widest">
          Built with SolidStart + Firebase
        </p>
      </footer>
    </main>
  );
}
