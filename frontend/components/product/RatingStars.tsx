"use client";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  size?: number;
  max?: number;
  interactive?: boolean;
  onChange?: (v: number) => void;
  className?: string;
}

export default function RatingStars({
  value,
  size = 16,
  max = 5,
  interactive,
  onChange,
  className,
}: Props) {
  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.round(value);
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(i + 1)}
            className={cn(
              "transition-transform",
              interactive && "hover:scale-110 cursor-pointer",
              !interactive && "cursor-default"
            )}
            aria-label={`${i + 1} star${i ? "s" : ""}`}
          >
            <Star
              style={{ width: size, height: size }}
              className={cn(
                filled ? "fill-gold text-gold" : "text-gray-mid",
                interactive && !filled && "hover:fill-gold-light hover:text-gold-light"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
