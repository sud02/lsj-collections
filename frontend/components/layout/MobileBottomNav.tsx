"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid3x3, ShoppingBag, User } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.count);
  const { isLoggedIn, openAuthModal } = useAuthStore();

  const items = [
    { href: "/", label: "Home", icon: Home },
    { href: "/products", label: "Shop", icon: Grid3x3 },
    { href: "/cart", label: "Cart", icon: ShoppingBag, badge: cartCount },
    {
      href: isLoggedIn ? "/account" : "#login",
      label: isLoggedIn ? "Account" : "Login",
      icon: User,
    },
  ] as const;

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-border pb-safe">
      <ul className="grid grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const content = (
            <>
              <div className="relative">
                <Icon className={cn("w-5 h-5", isActive ? "text-gold" : "text-gray")} />
                {"badge" in item && item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 bg-gold text-white rounded-full min-w-[16px] h-4 px-1 text-[9px] flex items-center justify-center">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className={cn("text-[10px] mt-0.5", isActive ? "text-gold font-medium" : "text-gray")}>
                {item.label}
              </span>
            </>
          );
          return (
            <li key={item.label} className="flex">
              {item.href === "#login" ? (
                <button
                  onClick={openAuthModal}
                  className="flex-1 flex flex-col items-center justify-center py-2.5"
                >
                  {content}
                </button>
              ) : (
                <Link
                  href={item.href}
                  className="flex-1 flex flex-col items-center justify-center py-2.5"
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
