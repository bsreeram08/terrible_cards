import { Show } from "solid-js";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function Loading(props: LoadingProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  return (
    <div class="flex flex-col items-center justify-center gap-3">
      <div
        class={`
          ${sizeClasses[props.size || "md"]}
          border-brand-secondary/10 border-t-brand-primary
          rounded-full animate-spin
        `}
      />
      <Show when={props.text}>
        <span class={`font-bold uppercase tracking-widest text-gray-400 ${textSizeClasses[props.size || "md"]}`}>
          {props.text}
        </span>
      </Show>
    </div>
  );
}
