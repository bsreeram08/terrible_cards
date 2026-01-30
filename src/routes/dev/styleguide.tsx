import { For, createSignal } from "solid-js";
import { Card } from "~/components/game/Card";
import { Button } from "~/components/ui/Button";
import { ScoreBoard } from "~/components/game/ScoreBoard";
import { PlayArea } from "~/components/game/PlayArea";

export default function StyleguidePage() {
  const [revealed, setRevealed] = createSignal(new Set<string>());
  
  const dummyPlayerUids = ["p1", "p2", "p3", "p4"];
  const dummyPlayerNames = {
    p1: "CleverMango123",
    p2: "SaltyCucumber",
    p3: "AngryPotato",
    p4: "HappyTomato"
  };
  const dummyScores = {
    p1: 5,
    p2: 3,
    p3: 7,
    p4: 2
  };

  const dummyWhiteCard = { id: "w1", text: "A questionable life choice that leads to permanent regret." };
  const dummyBlackCard = { id: "b1", text: "What's that smell?", pick: 1 };
  const dummyLongWhiteCard = { 
    id: "w2", 
    text: "The feeling of realization when you discover that the person you've been arguing with on the internet is actually a very sophisticated bot designed to make you feel slightly more annoyed than you already were." 
  };

  return (
    <div class="h-screen w-screen overflow-hidden bg-bg-light flex flex-col p-8 gap-8">
      <header class="shrink-0 border-b pb-4 border-brand-secondary/10">
        <h1 class="text-3xl font-black italic text-brand-primary uppercase">SES Styleguide</h1>
        <p class="text-brand-secondary/70 font-bold uppercase tracking-widest text-[10px]">Component Isolation & Design System</p>
      </header>

      <div class="flex-1 min-h-0 flex gap-8">
        <aside class="w-64 shrink-0 flex flex-col gap-8 overflow-y-auto pr-4">
          <section class="space-y-4">
            <h2 class="text-[10px] font-black uppercase tracking-widest opacity-30">Scoreboard</h2>
            <ScoreBoard 
              scores={dummyScores}
              playerUids={dummyPlayerUids}
              currentUserId="p1"
              hostId="p1"
              playerNames={dummyPlayerNames}
              judgeId="p3"
            />
          </section>

          <section class="space-y-4">
            <h2 class="text-[10px] font-black uppercase tracking-widest opacity-30">Buttons</h2>
            <div class="flex flex-col gap-2">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="danger">Danger Button</Button>
            </div>
          </section>
        </aside>

        <main class="flex-1 flex flex-col gap-8 overflow-y-auto pr-4 pb-20">
          <section class="space-y-4">
            <h2 class="text-[10px] font-black uppercase tracking-widest opacity-30">Cards</h2>
            <div class="flex flex-wrap gap-6 items-start">
              <div class="w-48 h-64 shrink-0">
                <Card type="black" card={dummyBlackCard} disableFlip={true} />
              </div>
              <div class="w-48 h-64 shrink-0">
                <Card type="white" card={dummyWhiteCard} disableFlip={true} />
              </div>
              <div class="w-48 h-64 shrink-0">
                <Card type="white" card={dummyLongWhiteCard} disableFlip={true} />
              </div>
              <div class="w-48 h-64 shrink-0">
                <Card type="white" card={dummyWhiteCard} isSelected={true} disableFlip={true} />
              </div>
              <div class="w-48 h-64 shrink-0">
                <Card type="white" card={dummyWhiteCard} isFlipped={true} disableFlip={true} />
              </div>
            </div>
          </section>

          <section class="space-y-4 flex-1 flex flex-col min-h-0">
            <h2 class="text-[10px] font-black uppercase tracking-widest opacity-30">PlayArea & Reveal UX</h2>
            <PlayArea class="flex-1 min-h-[300px]">
              <div class="flex flex-wrap justify-center gap-12 p-8">
                <For each={["p2", "p3", "p4"]}>
                  {(uid) => (
                    <div class="flex flex-col items-center gap-4 group">
                      <div class="relative w-36 h-52 lg:w-44 lg:h-60 transition-transform group-hover:scale-105">
                         <Card 
                            type="white" 
                            card={dummyWhiteCard} 
                            isFlipped={!revealed().has(uid)}
                            disableFlip={true}
                            onClick={() => {
                              const next = new Set(revealed());
                              if (next.has(uid)) next.delete(uid);
                              else next.add(uid);
                              setRevealed(next);
                            }}
                         />
                      </div>
                      <Button size="sm" variant="primary" class="opacity-0 group-hover:opacity-100 transition-opacity">Select Winner</Button>
                    </div>
                  )}
                </For>
              </div>
            </PlayArea>
          </section>
        </main>
      </div>
    </div>
  );
}
