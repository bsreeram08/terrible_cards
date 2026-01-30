import { createSignal, Show } from "solid-js";
import "../../styles/card.css";

export interface CardData {
  id: string;
  text: string;
  pick?: number;
}

interface CardProps {
  card: CardData;
  type: "black" | "white";
  isFlipped?: boolean;
  onFlip?: (isFlipped: boolean) => void;
  onClick?: () => void;
  class?: string;
  disableFlip?: boolean;
  isSelected?: boolean;
}

export function Card(props: CardProps) {
  const [internalFlipped, setInternalFlipped] = createSignal(false);

  const isFlipped = () => props.isFlipped ?? internalFlipped();

  const handleClick = () => {
    if (!props.disableFlip) {
      if (props.onFlip) {
        props.onFlip(!isFlipped());
      } else {
        setInternalFlipped(!internalFlipped());
      }
    }
    props.onClick?.();
  };

  return (
    <div 
      class={`card-container ${props.type === 'black' ? 'card-black' : 'card-white'} ${props.isSelected ? 'ring-4 ring-brand-primary ring-offset-2' : ''} ${props.class || ""}`}
      onClick={handleClick}
    >
      <div class={`card-inner hover-tilt ${isFlipped() ? "is-flipped" : ""}`}>
        <div class="card-front">
          <p class="font-black leading-tight">
            {props.card.text}
          </p>
          <div class="card-type-label flex justify-between items-center">
            <span>{props.type === "black" ? "PROMPT" : "ANSWER"}</span>
            <Show when={props.card.pick && props.card.pick > 1}>
              <span class="bg-brand-primary text-white px-2 py-0.5 rounded-full text-[10px]">
                PICK {props.card.pick}
              </span>
            </Show>
          </div>
        </div>

        <div class="card-back">
          <div class="space-y-2">
            <div class="text-2xl font-black">TC</div>
            <div class="text-[10px] uppercase tracking-[0.2em] opacity-50">Terrible Cards</div>
          </div>
        </div>
      </div>
    </div>
  );
}
