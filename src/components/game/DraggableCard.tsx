import { onMount, onCleanup, createSignal } from "solid-js";
import { Card, CardData } from "./Card";

interface DraggableCardProps {
  card: CardData;
  onPlay?: (cardId: string) => void;
  playAreaSelector: string;
  class?: string;
}

export function DraggableCard(props: DraggableCardProps) {
  let cardRef: HTMLDivElement;
  const [isDragging, setIsDragging] = createSignal(false);

  onMount(async () => {
    const { gsap, Draggable } = await import("~/lib/animations/gsap");
    
    Draggable.create(cardRef!, {
      type: "x,y",
      edgeResistance: 0.65,
      bounds: window,
      inertia: true,
      onDragStart: () => { setIsDragging(true); },
      onDragEnd: function(this: any) {
        setIsDragging(false);
        const playArea = document.querySelector(props.playAreaSelector);
        
        if (playArea && this.hitTest(playArea, "50%")) {
          props.onPlay?.(props.card.id);
          const rect = playArea.getBoundingClientRect();
          const cardRect = cardRef!.getBoundingClientRect();
          
          gsap.to(cardRef!, {
            x: rect.left + rect.width/2 - cardRect.left + parseFloat(gsap.getProperty(cardRef!, "x") as string),
            y: rect.top + rect.height/2 - cardRect.top + parseFloat(gsap.getProperty(cardRef!, "y") as string),
            duration: 0.3,
            scale: 0.8,
            opacity: 0.5
          });
        } else {
          gsap.to(cardRef!, {
            x: 0,
            y: 0,
            duration: 0.5,
            ease: "back.out(1.7)"
          });
        }
      }
    });
  });

  return (
    <div 
      ref={cardRef!} 
      class={`touch-none ${isDragging() ? "z-50 cursor-grabbing" : "z-10 cursor-grab"}`}
    >
      <Card type="white" card={props.card} class={props.class} />
    </div>
  );
}
