"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Sparkles, Coins, Crown } from "lucide-react";
import api from "@/lib/api";
import { Product } from "@/types/product";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ProductGrid from "@/components/product/ProductGrid";
import Spinner from "@/components/ui/Spinner";

export default function LakshmiKuberaPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Product[]>("/products", { params: { is_lakshmi_kubera: 1 } })
      .then((r) => setProducts(r.data.filter((p) => p.is_lakshmi_kubera)))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-cream min-h-screen">
      <div className="container-lsj py-6">
        <Breadcrumb items={[{ label: "Lakshmi Kubera Collection" }]} />
      </div>

      {/* Hero */}
      <section className="relative h-[420px] md:h-[520px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1800&q=80"
          alt="Lakshmi Kubera Collection"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
        <div className="absolute inset-0 flex items-center">
          <div className="container-lsj text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-pill bg-gold/90 text-white text-[11px] tracking-[0.3em] uppercase mb-5">
              <Sparkles className="w-3 h-3" /> Auspicious Edit
            </div>
            <h1 className="font-serif text-4xl md:text-6xl mb-4 text-balance">
              Lakshmi Kubera Collection
            </h1>
            <div className="w-20 h-[2px] bg-gold mx-auto mb-5" />
            <p className="text-sm md:text-base text-white/85 max-w-2xl mx-auto leading-relaxed">
              Sacred coins, pendants and divine motifs — handcrafted to invite
              prosperity, abundance and divine grace into your home and life.
            </p>
          </div>
        </div>
      </section>

      {/* Intro panels */}
      <section className="py-12">
        <div className="container-lsj grid md:grid-cols-3 gap-5">
          {[
            {
              icon: Coins,
              title: "Auspicious Designs",
              text: "Inspired by traditional Goddess Lakshmi & Lord Kubera motifs — perfect for festive gifting & poojas.",
            },
            {
              icon: Crown,
              title: "Hallmark Certified",
              text: "BIS-certified 22K & 24K gold and pure silver coins, with purity stamped on every piece.",
            },
            {
              icon: Sparkles,
              title: "Crafted in Tirupati",
              text: "Handmade by our master craftsmen in the temple town of Tirupati — blessed and timeless.",
            },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="bg-white border border-border rounded-lg p-6 text-center hover:-translate-y-0.5 hover:shadow-sm transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-gold-bg text-gold flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg text-dark">{c.title}</h3>
                <p className="text-sm text-gray mt-2 leading-relaxed">{c.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Products */}
      <section className="pb-16">
        <div className="container-lsj">
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">
              Shop the Collection
            </p>
            <h2 className="font-serif text-2xl md:text-3xl text-dark mt-1">
              Sacred Pieces for Every Home
            </h2>
            <div className="w-16 h-[2px] bg-gold mx-auto mt-3" />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size={32} />
            </div>
          ) : (
            <ProductGrid
              products={products}
              columns={4}
              emptyTitle="Coming Soon"
              emptyDesc="Our Lakshmi Kubera collection is being curated. Please check back shortly."
            />
          )}
        </div>
      </section>
    </div>
  );
}
