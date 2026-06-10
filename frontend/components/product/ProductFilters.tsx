"use client";
import { useState, useEffect } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import Button from "@/components/ui/Button";
import RatingStars from "./RatingStars";
import { formatINR, cn } from "@/lib/utils";

export interface Filters {
  priceMin: number;
  priceMax: number;
  rating: number;
  weightRange: [number, number];
  types: string[];
}

const DEFAULT_FILTERS: Filters = {
  priceMin: 0,
  priceMax: 500000,
  rating: 0,
  weightRange: [0, 200],
  types: [],
};

interface Props {
  onChange: (f: Filters) => void;
  typeOptions?: string[];
}

export default function ProductFilters({ onChange, typeOptions = [] }: Props) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    onChange(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const reset = () => setFilters(DEFAULT_FILTERS);

  const toggleType = (t: string) => {
    setFilters((f) => ({
      ...f,
      types: f.types.includes(t) ? f.types.filter((x) => x !== t) : [...f.types, t],
    }));
  };

  const Body = (
    <div className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-wide text-dark font-medium mb-3">
          Price Range
        </p>
        <div className="px-1">
          <input
            type="range"
            min={0}
            max={500000}
            step={1000}
            value={filters.priceMax}
            onChange={(e) =>
              setFilters((f) => ({ ...f, priceMax: Number(e.target.value) }))
            }
            className="w-full accent-gold"
          />
          <div className="flex justify-between text-xs text-gray mt-2">
            <span>{formatINR(filters.priceMin)}</span>
            <span>{formatINR(filters.priceMax)}</span>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-dark font-medium mb-3">
          Minimum Rating
        </p>
        <div className="flex flex-col gap-2">
          {[4, 3, 2, 1, 0].map((r) => (
            <label key={r} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rating"
                checked={filters.rating === r}
                onChange={() => setFilters((f) => ({ ...f, rating: r }))}
                className="accent-gold"
              />
              {r === 0 ? (
                <span className="text-sm text-gray">Any rating</span>
              ) : (
                <>
                  <RatingStars value={r} size={14} />
                  <span className="text-xs text-gray">&amp; up</span>
                </>
              )}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-dark font-medium mb-3">
          Weight (g)
        </p>
        <div className="px-1">
          <input
            type="range"
            min={0}
            max={200}
            value={filters.weightRange[1]}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                weightRange: [f.weightRange[0], Number(e.target.value)],
              }))
            }
            className="w-full accent-gold"
          />
          <div className="flex justify-between text-xs text-gray mt-2">
            <span>{filters.weightRange[0]} g</span>
            <span>{filters.weightRange[1]} g</span>
          </div>
        </div>
      </div>

      {typeOptions.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wide text-dark font-medium mb-3">
            Ornament Type
          </p>
          <div className="space-y-2">
            {typeOptions.map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.types.includes(t)}
                  onChange={() => toggleType(t)}
                  className="accent-gold w-4 h-4"
                />
                <span className="text-sm">{t}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t border-border">
        <Button onClick={() => onChange(filters)} fullWidth>
          Apply Filters
        </Button>
        <Button variant="ghost" onClick={reset}>
          Clear
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:block w-64 shrink-0 bg-white border border-border rounded-lg p-5 h-fit sticky top-28">
        <h4 className="font-serif text-lg text-dark mb-4 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gold" />
          Filters
        </h4>
        {Body}
      </aside>

      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-border rounded text-sm"
      >
        <SlidersHorizontal className="w-4 h-4 text-gold" />
        Filters
      </button>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden transition-opacity",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto bg-white rounded-t-lg p-5 transition-transform",
            mobileOpen ? "translate-y-0" : "translate-y-full"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-serif text-lg">Filters</h4>
            <button onClick={() => setMobileOpen(false)} aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
          {Body}
        </div>
      </div>
    </>
  );
}
