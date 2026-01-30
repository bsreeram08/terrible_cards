import { createSignal, For } from "solid-js";
import { DraggableCard } from "~/components/game/DraggableCard";
import { PlayArea } from "~/components/game/PlayArea";
import { CardData } from "~/components/game/Card";

export default function TestDrag() {
  const [cards, setCards] = createSignal<CardData[]>([
    { id: "d1", text: "Drag me to the area" },
    { id: "d2", text: "I snap back if missed" },
    { id: "d3", text: "Jugaad solution" },
  ]);

  const [playedCards, setPlayedCards] = createSignal<string[]>([]);

  const handleCardPlay = (cardId: string) => {
    console.log("Card played:", cardId);
    setPlayedCards(prev => [...prev, cardId]);
  };

  return (
    <div class="p-8 max-w-4xl mx-auto space-y-16 flex flex-col items-center">
      <section class="text-center space-y-4">
        <h2 class="text-2xl font-black uppercase tracking-tight">GSAP Draggable Test</h2>
        <p class="text-gray-500">
          Try dragging cards into the dashed play area. 
          They will snap to the center if hit, or snap back if they miss.
        </p>
      </section>

      <PlayArea id="main-play-area">
        <div class="absolute top-2 right-4 text-xs font-bold text-gray-400">
          PLAYED: {playedCards().length}
        </div>
      </PlayArea>

      <section class="w-full space-y-8">
        <h3 class="text-sm font-bold opacity-50 uppercase tracking-widest text-center">Your Hand</h3>
        <div class="flex flex-wrap justify-center gap-8 min-h-[300px]">
          <For each={cards()}>
            {(card) => (
              <DraggableCard 
                card={card} 
                playAreaSelector="#main-play-area"
                onPlay={handleCardPlay}
              />
            )}
          </For>
        </div>
      </section>

      <div class="bg-brand-secondary text-white p-6 rounded-2xl w-full max-w-md">
        <h4 class="font-bold mb-2">Debug Info</h4>
        <ul class="text-sm opacity-80 space-y-1">
          <li>Play Area Selector: #main-play-area</li>
          <li>Played Cards: {playedCards().join(", ") || "None"}</li>
        </ul>
      </div>
    </div>
  );
}
