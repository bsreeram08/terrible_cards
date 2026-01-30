import { JSX, splitProps } from "solid-js";

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
}

export function Button(props: ButtonProps) {
  const [local, others] = splitProps(props, ["variant", "size", "class"]);
  
  const variantClasses = {
    primary: "bg-brand-primary text-white hover:bg-brand-primary/90",
    secondary: "bg-brand-secondary text-white hover:bg-brand-secondary/90",
    ghost: "bg-transparent text-brand-secondary hover:bg-brand-secondary/10",
    danger: "bg-brand-primary text-white hover:bg-brand-primary/90",
    outline: "bg-transparent border-2 border-brand-secondary text-brand-secondary hover:bg-brand-secondary hover:text-white"
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-6 py-2.5 text-base",
    lg: "px-8 py-3.5 text-lg"
  };

  return (
    <button
      class={`
        inline-flex items-center justify-center rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[local.variant || "primary"]}
        ${sizeClasses[local.size || "md"]}
        ${local.class || ""}
      `}
      {...others}
    />
  );
}
