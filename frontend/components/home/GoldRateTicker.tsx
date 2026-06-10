"use client";
import { useEffect, useState } from "react";
import { TrendingUp, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { GoldRate } from "@/types/product";
import { formatINR, formatDate } from "@/lib/utils";

export default function GoldRateTicker() {
  const [rate, setRate] = useState<GoldRate | null>(null);

  useEffect(() => {
    api
      .get<GoldRate>("/gold-rate")
      .then((r) => setRate(r.data))
      .catch(() =>
        setRate({
          rate_22k: 6480,
          rate_24k: 7065,
          updated_at: new Date().toISOString(),
        })
      );
  }, []);

  if (!rate) return null;

  return (
    <section className="py-6">
      <div className="container-lsj">
        <div className="bg-gradient-to-r from-gold-bg via-white to-gold-bg border border-gold-light/60 rounded-lg p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gold text-white flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gold font-medium">
                Today&apos;s Gold Rate
              </p>
              <p className="text-[11px] text-gray flex items-center gap-1 mt-0.5">
                <RefreshCw className="w-3 h-3" />
                Updated {formatDate(rate.updated_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 md:gap-10">
            <div className="text-center">
              <p className="text-[11px] uppercase tracking-wider text-gray">22K Gold</p>
              <p className="font-serif text-2xl md:text-3xl text-dark font-semibold">
                {formatINR(rate.rate_22k)}
                <span className="text-xs text-gray font-normal ml-1">/g</span>
              </p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <p className="text-[11px] uppercase tracking-wider text-gray">24K Gold</p>
              <p className="font-serif text-2xl md:text-3xl text-gold font-semibold">
                {formatINR(rate.rate_24k)}
                <span className="text-xs text-gray font-normal ml-1">/g</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
