"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Package, MessageSquareQuote, Star, ShoppingBag, Users, Mail, AtSign } from "lucide-react";

interface Stats {
  products: { active: number; inactive: number; total: number };
  testimonials: { pending: number; approved: number };
  reviews: { pending: number; approved: number };
  orders: { total: number; paid: number; pending: number };
  users: number;
  contacts: number;
  subscribers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Stats>("/admin/stats")
      .then((r) => setStats(r.data))
      .catch((e) => setError(e.message || "Failed to load"));
  }, []);

  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!stats) return <p className="text-gray text-sm">Loading…</p>;

  const cards = [
    { label: "Products", value: stats.products.total, sub: `${stats.products.active} active`, icon: Package },
    { label: "Pending testimonials", value: stats.testimonials.pending, sub: `${stats.testimonials.approved} approved`, icon: MessageSquareQuote, urgent: stats.testimonials.pending > 0 },
    { label: "Pending reviews", value: stats.reviews.pending, sub: `${stats.reviews.approved} approved`, icon: Star, urgent: stats.reviews.pending > 0 },
    { label: "Orders", value: stats.orders.total, sub: `${stats.orders.paid} paid · ${stats.orders.pending} pending`, icon: ShoppingBag },
    { label: "Users", value: stats.users, icon: Users },
    { label: "Subscribers", value: stats.subscribers, icon: AtSign },
    { label: "Contact messages", value: stats.contacts, icon: Mail },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-dark">Dashboard</h1>
        <p className="text-sm text-gray mt-1">Overview of your store</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className={`bg-white border rounded-lg p-5 ${c.urgent ? "border-gold" : "border-border"}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray uppercase tracking-wide">{c.label}</p>
                  <p className="font-serif text-3xl text-dark mt-2">{c.value.toLocaleString()}</p>
                  {c.sub && <p className="text-xs text-gray mt-1">{c.sub}</p>}
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${c.urgent ? "bg-gold text-white" : "bg-gold-bg text-gold-dark"}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
