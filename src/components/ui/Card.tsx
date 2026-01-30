import { JSX, splitProps } from "solid-js";

interface CardProps extends JSX.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card(props: CardProps) {
  const [local, others] = splitProps(props, ["padding", "class", "children"]);

  const paddingClasses = {
    none: "p-0",
    sm: "p-3",
    md: "p-6",
    lg: "p-8"
  };

  return (
    <div
      class={`
        bg-white rounded-xl shadow-sm border border-brand-secondary/10
        ${paddingClasses[local.padding || "md"]}
        ${local.class || ""}
      `}
      {...others}
    >
      {local.children}
    </div>
  );
}
