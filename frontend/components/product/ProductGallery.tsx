"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  images: string[];
  video?: string;
  alt: string;
}

export default function ProductGallery({ images, video, alt }: Props) {
  const slides = video ? [...images, `video:${video}`] : images;
  const [active, setActive] = useState(0);
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number } | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActive(0);
  }, [images.join(",")]);

  const current = slides[active];
  const isVideo = current?.startsWith("video:");

  const onMouseMove = (e: React.MouseEvent) => {
    if (isVideo || !mainRef.current) return;
    const rect = mainRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const next = () => setActive((i) => (i + 1) % slides.length);
  const prev = () => setActive((i) => (i - 1 + slides.length) % slides.length);

  return (
    <div className="flex flex-col-reverse md:flex-row gap-3">
      {/* Thumbnails */}
      <div className="flex md:flex-col gap-2 md:gap-3 md:w-20 overflow-x-auto md:overflow-y-auto hide-scrollbar md:max-h-[520px]">
        {slides.map((src, i) => {
          const isVid = src.startsWith("video:");
          const thumb = isVid ? "" : src;
          return (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "relative shrink-0 w-16 h-16 md:w-20 md:h-20 rounded bg-gold-bg overflow-hidden border-2 transition-all",
                active === i ? "border-gold" : "border-transparent hover:border-gold-light"
              )}
              aria-label={`Thumbnail ${i + 1}`}
            >
              {isVid ? (
                <div className="absolute inset-0 bg-dark flex items-center justify-center">
                  <Play className="w-4 h-4 text-white fill-white" />
                </div>
              ) : (
                <Image src={thumb} alt={`${alt} ${i + 1}`} fill className="object-cover" />
              )}
            </button>
          );
        })}
      </div>

      {/* Main viewer */}
      <div className="relative flex-1">
        <div
          ref={mainRef}
          onMouseMove={onMouseMove}
          onMouseLeave={() => setZoomPos(null)}
          className="relative aspect-square bg-gold-bg rounded-lg overflow-hidden border border-border"
        >
          {isVideo ? (
            <video
              src={current.replace("video:", "")}
              controls
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : current ? (
            <Image
              src={current}
              alt={alt}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className={cn(
                "object-cover transition-transform duration-200",
                zoomPos && "scale-150"
              )}
              style={
                zoomPos
                  ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
                  : undefined
              }
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-mid text-sm">
              No image
            </div>
          )}
        </div>

        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur border border-border flex items-center justify-center hover:bg-gold hover:text-white transition-colors shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              aria-label="Next"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur border border-border flex items-center justify-center hover:bg-gold hover:text-white transition-colors shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
