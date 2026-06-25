"use client";
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, MessageSquareQuote, Star, ShoppingBag, Plus, Coins, LogOut, ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/products/new", label: "Add product", icon: Plus },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/gold-rate", label: "Gold rate", icon: Coins },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoggedIn, hydrated, logout } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;
    if (!isLoggedIn || user?.role !== "admin") {
      router.replace("/");
    }
  }, [hydrated, isLoggedIn, user, router]);

  if (!hydrated || !isLoggedIn || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray text-sm">
        Checking admin access…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <aside className="fixed inset-y-0 left-0 w-60 bg-white border-r border-border hidden md:flex flex-col">
        <div className="p-5 border-b border-border">
          <Link href="/" aria-label="LSJ Collections — Home">
            <Image src="/logo_lsj.png" alt="LSJ Collections" width={1508} height={1114} className="h-11 w-auto" />
          </Link>
          <p className="text-[11px] text-gray mt-2">Admin · {user.name}</p>
        </div>
        <nav className="p-3 space-y-1 flex-1 overflow-auto">
          {NAV.map((n) => {
            const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors",
                  active ? "bg-gold-bg text-gold-dark font-medium" : "text-gray hover:bg-gray-light hover:text-dark"
                )}
              >
                <Icon className="w-4 h-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border space-y-1">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded text-sm text-gray hover:bg-gray-light hover:text-dark">
            <ArrowLeft className="w-4 h-4" /> Back to site
          </Link>
          <button
            onClick={() => { logout(); router.replace("/"); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-gray hover:bg-gray-light hover:text-dark"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>
      <main className="md:ml-60 p-6 md:p-8">{children}</main>
    </div>
  );
}
