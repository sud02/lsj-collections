"use client";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { Advertisement } from "@/types/product";
import { cn } from "@/lib/utils";

const fallback: Advertisement[] = [
  {
    id: -1,
    title: "Signature Bridal Collection",
    subtitle: "Timeless designs crafted for your special day",
    image_url:
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1600&q=80",
    link_url: "/products",
    cta_text: "Shop Now",
    position: "hero",
  },
  {
    id: -2,
    title: "Hallmark Gold Edit",
    subtitle: "22K & 24K certified hallmark jewellery",
    image_url:
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1600&q=80",
    link_url: "/popular",
    cta_text: "Explore",
    position: "hero",
  },
];

export default function HeroBanner() {
  const [slides, setSlides] = useState<Advertisement[]>([]);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 30 }, [
    Autoplay({ delay: 4500, stopOnInteraction: false }),
  ]);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    api
      .get<Advertisement[]>("/advertisements")
      .then((r) => {
        const hero = r.data.filter((a) => !a.position || a.position === "hero");
        setSlides(hero.length ? hero : fallback);
      })
      .catch(() => setSlides(fallback));
  }, []);

  const onSelect = useCallback(() => {
    if (emblaApi) setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  if (slides.length === 0) {
    return <div className="container-lsj py-4"><div className="h-[520px] rounded-lg bg-gold-bg animate-pulse" /></div>;
  }

  return (
    <div className="container-lsj py-4">
      <div className="relative overflow-hidden rounded-lg" ref={emblaRef}>
        <div className="flex">
          {slides.map((s) => (
            <div
              key={s.id}
              className="relative shrink-0 grow-0 basis-full h-[380px] md:h-[520px]"
            >
              <Image
                src={s.image_url}
                alt={s.title}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-0 flex items-end">
                <div className="container-lsj pb-14 md:pb-20 text-white max-w-2xl">
                  <div className="inline-block bg-gold px-3 py-1 text-[11px] font-medium tracking-[0.2em] uppercase mb-3 rounded">
                    Premium Hallmark
                  </div>
                  <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl leading-tight text-white mb-3 text-balance">
                    {s.title}
                  </h1>
                  {s.subtitle && (
                    <p className="text-sm md:text-base text-white/80 mb-5 max-w-lg">
                      {s.subtitle}
                    </p>
                  )}
                  <Link
                    href={s.link_url || "/products"}
                    className="inline-flex items-center gap-2 bg-white text-dark px-7 py-3 rounded-pill font-medium text-sm hover:bg-gold hover:text-white transition-colors"
                  >
                    {s.cta_text || "Shop Now"}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {slides.length > 1 && (
          <>
            <button
              onClick={() => emblaApi?.scrollPrev()}
              aria-label="Previous"
              className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 backdrop-blur items-center justify-center shadow-md hover:bg-gold hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => emblaApi?.scrollNext()}
              aria-label="Next"
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 backdrop-blur items-center justify-center shadow-md hover:bg-gold hover:text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => emblaApi?.scrollTo(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    selected === i ? "w-8 bg-gold" : "w-1.5 bg-white/60"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
