import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "gold" | "green" | "red" | "blue" | "gray" | "dark";

interface Props {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}

const classes: Record<Variant, string> = {
  gold: "bg-gold text-white",
  green: "bg-green-100 text-green-800 border border-green-300",
  red: "bg-red-100 text-red-800 border border-red-300",
  blue: "bg-blue-100 text-blue-800 border border-blue-300",
  gray: "bg-gray-light text-gray",
  dark: "bg-dark text-white",
};

export default function Badge({ children, variant = "gold", className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[11px] font-medium whitespace-nowrap",
        classes[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
