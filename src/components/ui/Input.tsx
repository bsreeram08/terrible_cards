import { JSX, splitProps } from "solid-js";

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input(props: InputProps) {
  const [local, others] = splitProps(props, ["label", "error", "class"]);

  return (
    <div class={`flex flex-col gap-1.5 ${local.class || ""}`}>
      {local.label && (
        <label class="text-sm font-semibold text-brand-secondary opacity-80">
          {local.label}
        </label>
      )}
      <input
        class={`
          px-4 py-2.5 rounded-lg border-2 border-brand-secondary/20 outline-none transition-all
          focus:border-brand-primary placeholder:text-gray-400
          ${local.error ? "border-red-500" : ""}
        `}
        {...others}
      />
      {local.error && (
        <span class="text-xs font-bold text-red-500">{local.error}</span>
      )}
    </div>
  );
}
