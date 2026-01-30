import { JSX, Show, children, createSignal, onMount } from "solid-js";

interface PlayAreaProps {
  id?: string;
  class?: string;
  children?: JSX.Element;
  hideBackground?: boolean;
}

export function PlayArea(props: PlayAreaProps) {
  const resolved = children(() => props.children);
  const [mounted, setMounted] = createSignal(false);
  onMount(() => setMounted(true));

  return (
    <div 
      id={props.id || "play-area"}
      class={`
        relative w-full rounded-3xl border-4 border-dashed border-gray-300 
        flex items-center justify-center transition-colors
        bg-gray-50/50 hover:bg-gray-100/50 hover:border-brand-primary
        ${props.class || "max-w-2xl"}
      `}
    >
      <Show when={mounted() && !resolved() && !props.hideBackground}>
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none text-center">
          <div class="space-y-2">
            <div class="text-3xl font-black text-gray-300 uppercase tracking-tighter italic">Selection Zone</div>
            <p class="text-sm text-gray-400 font-bold uppercase tracking-widest">Choose your best cards below</p>
          </div>
        </div>
      </Show>
      <div class="relative z-10 w-full h-full">
        <Show when={mounted()}>
          {resolved()}
        </Show>
      </div>
    </div>
  );
}
