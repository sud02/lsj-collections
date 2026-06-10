import { ShieldCheck, Award, Truck, Undo2, BadgeIndianRupee, Gem } from "lucide-react";

const badges = [
  { icon: Award, label: "BIS Hallmark Certified" },
  { icon: ShieldCheck, label: "Lifetime Exchange" },
  { icon: Truck, label: "Free Shipping ₹5000+" },
  { icon: Undo2, label: "15-Day Easy Returns" },
  { icon: BadgeIndianRupee, label: "Transparent Pricing" },
  { icon: Gem, label: "100% Pure Gold" },
];

export default function TrustStrip() {
  return (
    <section className="py-10 bg-gold-bg/60 border-y border-border">
      <div className="container-lsj">
        <p className="text-center text-[11px] uppercase tracking-[0.3em] text-gold font-medium mb-6">
          Trusted by jewellery lovers across India
        </p>
        <div className="flex items-center justify-between gap-4 overflow-x-auto hide-scrollbar">
          {badges.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.label}
                className="flex items-center gap-2 shrink-0 px-3 py-2 bg-white rounded-pill border border-border"
              >
                <Icon className="w-4 h-4 text-gold" />
                <span className="text-xs text-dark whitespace-nowrap">{b.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
