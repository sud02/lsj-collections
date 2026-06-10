"use client";
import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { Product } from "@/types/product";
import ProductCard from "./ProductCard";

interface Props {
  productId: number;
  subcategoryId?: number;
}

export default function RelatedProducts({ productId, subcategoryId }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: false });

  useEffect(() => {
    const fetch = async () => {
      try {
        if (subcategoryId) {
          const { data } = await api.get<Product[]>(`/subcategories/${subcategoryId}/products`);
          setProducts(data.filter((p) => p.id !== productId).slice(0, 12));
        } else {
          const { data } = await api.get<Product[]>("/products/popular");
          setProducts(data.filter((p) => p.id !== productId).slice(0, 12));
        }
      } catch {
        setProducts([]);
      }
    };
    fetch();
  }, [productId, subcategoryId]);

  if (products.length === 0) return null;

  return (
    <section className="py-14 bg-cream">
      <div className="container-lsj">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h3 className="font-serif text-2xl md:text-3xl text-dark">You May Also Like</h3>
            <div className="w-16 h-[2px] bg-gold mt-2" />
          </div>
          <div className="hidden sm:flex gap-2">
            <button
              onClick={() => emblaApi?.scrollPrev()}
              aria-label="Previous"
              className="w-10 h-10 rounded-full border border-border bg-white flex items-center justify-center hover:bg-gold hover:text-white hover:border-gold transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => emblaApi?.scrollNext()}
              aria-label="Next"
              className="w-10 h-10 rounded-full border border-border bg-white flex items-center justify-center hover:bg-gold hover:text-white hover:border-gold transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="shrink-0 w-[45%] sm:w-[32%] md:w-[24%] lg:w-[20%]"
              >
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
