"use client";
import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * next/image with a graceful fallback.
 *
 * Most product rows still carry filenames from the old PHP site, whose image
 * host no longer exists, so those requests 404 and the browser paints its
 * broken-image icon. This swaps in a quiet branded placeholder instead, and
 * also covers the ordinary cases of an empty column or a file removed later.
 */
export default function SafeImage({ alt, className, ...props }: ImageProps) {
  const [failed, setFailed] = useState(false);
  const src = props.src;
  const missing = !src || (typeof src === "string" && src.trim() === "");

  if (missing || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex items-center justify-center bg-gold-bg text-gold-light",
          // `fill` images are positioned by their parent; sized ones are not.
          props.fill ? "absolute inset-0" : "w-full h-full",
          className
        )}
      >
        <ImageOff className="w-1/3 h-1/3 max-w-6 max-h-6" aria-hidden />
      </div>
    );
  }

  return (
    <Image
      alt={alt}
      className={className}
      {...props}
      onError={() => setFailed(true)}
    />
  );
}
