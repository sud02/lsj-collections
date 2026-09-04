"use client";
import { useEffect, useState } from "react";
import SafeImage from "@/components/ui/SafeImage";
import Link from "next/link";
import api from "@/lib/api";
import { Category } from "@/types/product";

export default function CategoryStrip() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api
      .get<Category[]>("/categories")
      .then((r) => setCategories(r.data))
      .catch(() => setCategories([]));
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="py-10 bg-white">
      <div className="container-lsj">
        <div className="text-center mb-8">
          <h2 className="font-serif text-2xl md:text-3xl text-dark">Shop by Category</h2>
          <div className="w-16 h-[2px] bg-gold mx-auto mt-2" />
        </div>

        <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-2 snap-x">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/categories/${c.id}`}
              className="group flex flex-col items-center shrink-0 snap-start"
            >
              <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-gold-bg border-2 border-transparent group-hover:border-gold transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md">
                {c.image_url && (
                  <SafeImage
                    src={c.image_url}
                    alt={c.name}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                )}
              </div>
              <p className="mt-3 text-xs md:text-sm font-medium text-dark group-hover:text-gold transition-colors text-center max-w-[110px] line-clamp-1">
                {c.name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
