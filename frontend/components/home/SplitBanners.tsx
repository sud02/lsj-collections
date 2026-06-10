"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";
import { Advertisement } from "@/types/product";

const fallback: Advertisement[] = [
  {
    id: -10,
    title: "Diamond Rings",
    subtitle: "Certified brilliance for every finger",
    image_url:
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1200&q=80",
    cta_text: "Shop Diamonds",
    link_url: "/products?search=diamond",
    position: "split",
  },
  {
    id: -11,
    title: "Festive Gifting",
    subtitle: "Handpicked silver & gold gifting pieces",
    image_url:
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=1200&q=80",
    cta_text: "Explore Gifts",
    link_url: "/products?search=gift",
    position: "split",
  },
];

export default function SplitBanners() {
  const [banners, setBanners] = useState<Advertisement[]>([]);

  useEffect(() => {
    api
      .get<Advertisement[]>("/advertisements")
      .then((r) => {
        const split = r.data.filter((a) => a.position === "split");
        setBanners(split.length >= 2 ? split.slice(0, 2) : fallback);
      })
      .catch(() => setBanners(fallback));
  }, []);

  if (banners.length === 0) return null;

  return (
    <section className="py-8">
      <div className="container-lsj grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners.map((b) => (
          <Link
            key={b.id}
            href={b.link_url || "/products"}
            className="relative group h-64 md:h-72 rounded-lg overflow-hidden block"
          >
            <Image
              src={b.image_url}
              alt={b.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="px-8 text-white">
                <p className="text-xs tracking-[0.2em] uppercase text-gold-light mb-2">
                  Limited Edition
                </p>
                <h3 className="font-serif text-2xl md:text-3xl mb-2">{b.title}</h3>
                {b.subtitle && (
                  <p className="text-sm text-white/80 mb-4 max-w-xs">{b.subtitle}</p>
                )}
                <span className="inline-block bg-white text-dark px-5 py-2 rounded-pill text-xs font-medium group-hover:bg-gold group-hover:text-white transition-colors">
                  {b.cta_text || "Shop Now"} →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
