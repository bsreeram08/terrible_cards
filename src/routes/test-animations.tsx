import { createSignal, onMount, For } from "solid-js";
import { Card, CardData } from "~/components/game/Card";
import { Button } from "~/components/ui/Button";

export default function TestAnimations() {
  const [cards, setCards] = createSignal<CardData[]>([
    { id: "1", text: "Animation Test 1" },
    { id: "2", text: "Animation Test 2" },
    { id: "3", text: "Animation Test 3" },
  ]);

  let cardRefs: HTMLElement[] = [];
  let containerRef: HTMLDivElement;

  const triggerDeal = async () => {
    const { dealCards } = await import("~/lib/animations/cardAnimations");
    dealCards(cardRefs);
  };

  const triggerShake = async () => {
    const { shakeCard } = await import("~/lib/animations/cardAnimations");
    cardRefs.forEach(ref => shakeCard(ref));
  };

  return (
    <div class="p-8 max-w-4xl mx-auto space-y-12">
      <section class="text-center space-y-8">
        <h2 class="text-2xl font-black uppercase tracking-tight">GSAP Animations Test</h2>
        
        <div class="flex justify-center gap-4">
          <Button onClick={triggerDeal}>Deal Cards</Button>
          <Button variant="secondary" onClick={triggerShake}>Shake All</Button>
        </div>

        <div 
          ref={containerRef!}
          class="relative h-[400px] w-full border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-6 overflow-hidden"
        >
          <For each={cards()}>
            {(card, i) => (
              <Card 
                ref={(el: HTMLDivElement) => cardRefs[i()] = el}
                type="white" 
                card={card} 
              />
            )}
          </For>
        </div>

        <p class="text-gray-500 italic">
          "Deal Cards" uses gsap.from() to fly cards in. "Shake All" uses a timeline for oscillation.
        </p>
      </section>
    </div>
  );
}
