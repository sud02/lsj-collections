"use client";
import { ProductVariation } from "@/types/product";
import { cn } from "@/lib/utils";

interface Props {
  variations: ProductVariation[];
  selected: Record<string, number>;
  onChange: (attr: string, variationId: number) => void;
}

export default function ProductVariations({ variations, selected, onChange }: Props) {
  if (!variations?.length) return null;

  const grouped = variations.reduce<Record<string, ProductVariation[]>>((acc, v) => {
    (acc[v.attribute_name] ||= []).push(v);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([attr, opts]) => (
        <div key={attr}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-dark uppercase tracking-wide">
              {attr}:
            </span>
            <span className="text-xs text-gold">
              {opts.find((o) => o.id === selected[attr])?.attribute_value || ""}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {opts.map((o) => {
              const active = selected[attr] === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => onChange(attr, o.id)}
                  className={cn(
                    "px-4 py-2 text-xs font-medium rounded-pill border transition-all",
                    active
                      ? "bg-gold text-white border-gold shadow-sm"
                      : "bg-white text-dark border-border hover:border-gold hover:text-gold"
                  )}
                >
                  {o.attribute_value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
