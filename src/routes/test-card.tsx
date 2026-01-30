import { createSignal, For } from "solid-js";
import { Card, CardData } from "~/components/game/Card";

export default function TestCard() {
  const blackCard: CardData = {
    id: "b1",
    text: "What's the most Indian way to solve a problem?",
    pick: 1
  };

  const whiteCards: CardData[] = [
    { id: "w1", text: "Chai break" },
    { id: "w2", text: "Jugaad" },
    { id: "w3", text: "Technical issue" }
  ];

  return (
    <div class="p-8 max-w-4xl mx-auto space-y-12">
      <section>
        <h2 class="text-2xl font-black mb-6 uppercase tracking-tight text-center">3D Cards Test</h2>
        
        <div class="flex flex-col items-center gap-12">
          <div class="space-y-4 text-center">
            <h3 class="text-sm font-bold opacity-50 uppercase tracking-widest">Black Card</h3>
            <Card type="black" card={blackCard} />
          </div>

          <div class="space-y-4 text-center w-full">
            <h3 class="text-sm font-bold opacity-50 uppercase tracking-widest">White Cards</h3>
            <div class="flex flex-wrap justify-center gap-6">
              <For each={whiteCards}>
                {(card) => <Card type="white" card={card} />}
              </For>
            </div>
          </div>
        </div>

        <div class="mt-12 p-6 bg-gray-100 rounded-xl text-center">
          <p class="text-gray-600 font-medium italic">
            Click cards to test the 3D flip animation. Hover to see the subtle 3D tilt.
          </p>
        </div>
      </section>
    </div>
  );
}
