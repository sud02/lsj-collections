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

export default function HeroBanner() {
  const [slides, setSlides] = useState<Advertisement[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 30 }, [
    Autoplay({ delay: 4500, stopOnInteraction: false }),
  ]);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    api
      .get<Advertisement[]>("/advertisements")
      .then((r) => {
        setSlides(r.data.filter((a) => !a.position || a.position === "hero"));
      })
      .catch(() => setSlides([]))
      .finally(() => setLoaded(true));
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

  if (!loaded) {
    return (
      <div className="container-lsj py-4">
        <div className="h-[520px] rounded-lg bg-gold-bg animate-pulse" />
      </div>
    );
  }

  // No banners configured. Show the shop's own identity rather than inventing
  // collections over stock imagery.
  if (slides.length === 0) {
    return (
      <div className="container-lsj py-4">
        <div className="h-[360px] md:h-[440px] rounded-lg bg-gradient-to-br from-gold-bg via-white to-gold-bg border border-gold-light/60 flex flex-col items-center justify-center text-center px-6">
          <Image
            src="/logo_lsj.png"
            alt="LSJ Collections"
            width={1508}
            height={1114}
            priority
            className="h-20 w-auto mb-5"
          />
          <h1 className="font-serif text-3xl md:text-4xl text-dark">
            Hallmark Gold &amp; Silver Jewellery
          </h1>
          <div className="w-16 h-[2px] bg-gold my-4" />
          <p className="text-sm text-gray max-w-md">
            BIS-certified pieces handcrafted in Tirupati — bangles, harams,
            necklaces and more.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 px-6 h-11 rounded bg-gold text-white text-sm font-medium hover:bg-gold-dark transition-colors"
          >
            Browse the collection
          </Link>
        </div>
      </div>
    );
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
