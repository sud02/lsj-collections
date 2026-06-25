"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  ChevronDown,
  Menu,
  X,
  Phone,
  Mail,
  LogOut,
  Package,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { logoutApi } from "@/lib/auth";
import api from "@/lib/api";
import { Category } from "@/types/product";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function Header() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const accountRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);

  const { user, isLoggedIn, logout } = useAuthStore();
  const cartCount = useCartStore((s) => s.count);
  const wishlistCount = useWishlistStore((s) => s.count);

  useEffect(() => {
    api
      .get<Category[]>("/categories")
      .then((r) => setCategories(r.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
      setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    await logoutApi();
    logout();
    toast.success("Logged out successfully");
    setAccountOpen(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top bar */}
      <div className="hidden md:block bg-dark text-white text-xs">
        <div className="container-lsj flex items-center justify-between h-9">
          <div className="flex items-center gap-5 text-white/80">
            <a href="tel:+918309409007" className="flex items-center gap-1.5 hover:text-gold-light transition-colors">
              <Phone className="w-3 h-3" /> +91 83094 09007
            </a>
            <a href="mailto:support@lsjcollections.com" className="flex items-center gap-1.5 hover:text-gold-light transition-colors">
              <Mail className="w-3 h-3" /> support@lsjcollections.com
            </a>
          </div>
          <div className="flex items-center gap-5">
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setAccountOpen((o) => !o)}
                className="flex items-center gap-1 hover:text-gold-light transition-colors"
              >
                <User className="w-3 h-3" />
                {isLoggedIn ? `Hi, ${user?.name?.split(" ")[0]}` : "My Account"}
                <ChevronDown className="w-3 h-3" />
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white text-dark shadow-lg rounded w-48 py-2 border border-border">
                  {isLoggedIn ? (
                    <>
                      <Link href="/account" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-4 py-2 text-xs hover:bg-gold-bg">
                        <Package className="w-3 h-3" /> My Orders
                      </Link>
                      <Link href="/wishlist" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-4 py-2 text-xs hover:bg-gold-bg">
                        <Heart className="w-3 h-3" /> Wishlist
                      </Link>
                      {user?.role === "admin" && (
                        <Link href="/admin" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-4 py-2 text-xs hover:bg-gold-bg text-gold-dark border-t border-border">
                          <Package className="w-3 h-3" /> Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2 text-xs hover:bg-gold-bg text-red-600 border-t border-border"
                      >
                        <LogOut className="w-3 h-3" /> Logout
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/account"
                      onClick={() => setAccountOpen(false)}
                      className="block w-full text-left px-4 py-2 text-xs hover:bg-gold-bg"
                    >
                      Login / Register <span className="text-gold-dark">(coming soon)</span>
                    </Link>
                  )}
                </div>
              )}
            </div>
            <Link href="/wishlist" className="flex items-center gap-1 hover:text-gold-light transition-colors">
              <Heart className="w-3 h-3" /> Wishlist
              {wishlistCount > 0 && (
                <span className="bg-gold text-white rounded-full px-1.5 text-[10px] min-w-[16px] text-center">
                  {wishlistCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Logo bar */}
      <div className="container-lsj flex items-center gap-4 py-4">
        <button
          className="lg:hidden p-2 -ml-2"
          onClick={() => setMobileOpen(true)}
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link href="/" className="shrink-0" aria-label="LSJ Collections — Home">
          <Image
            src="/logo_lsj.png"
            alt="LSJ Collections"
            width={1508}
            height={1114}
            priority
            className="h-16 md:h-20 w-auto"
          />
        </Link>

        <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-2xl mx-auto">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-mid" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for hallmark gold, silver & diamond jewellery..."
              className="w-full h-11 pl-11 pr-4 bg-gray-light border border-border rounded-pill text-sm focus:outline-none focus:bg-white focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
            />
          </div>
        </form>

        <div className="flex items-center gap-2 ml-auto lg:ml-0">
          <Link href="/wishlist" className="hidden md:flex relative p-2 text-dark hover:text-gold transition-colors" aria-label="Wishlist">
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gold text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>
          <Link href="/cart" className="relative p-2 text-dark hover:text-gold transition-colors" aria-label="Cart">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gold text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center animate-bounce-soft">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile search */}
      <form onSubmit={onSearch} className="md:hidden container-lsj pb-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-mid" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jewellery..."
            className="w-full h-10 pl-11 pr-4 bg-gray-light rounded-pill text-sm focus:outline-none focus:border-gold"
          />
        </div>
      </form>

      {/* Navigation bar */}
      <div className="hidden lg:block bg-gold text-white">
        <div className="container-lsj flex items-center justify-between h-12">
          <div className="relative" ref={catRef}>
            <button
              onClick={() => setCatOpen((o) => !o)}
              className="flex items-center gap-2 px-4 py-2 bg-gold-dark text-white text-sm font-medium rounded hover:brightness-110"
            >
              <Menu className="w-4 h-4" />
              All Categories
              <ChevronDown className={cn("w-4 h-4 transition-transform", catOpen && "rotate-180")} />
            </button>
            {catOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white text-dark shadow-lg rounded min-w-[260px] py-2 border border-border z-50">
                {categories.length === 0 ? (
                  <div className="px-4 py-2 text-xs text-gray">No categories yet</div>
                ) : (
                  categories.map((c) => (
                    <Link
                      key={c.id}
                      href={`/categories/${c.id}`}
                      onClick={() => setCatOpen(false)}
                      className="block px-4 py-2 text-sm hover:bg-gold-bg hover:text-gold transition-colors"
                    >
                      {c.name}
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          <nav className="flex items-center gap-1">
            <Link href="/" className="px-4 py-2 text-sm font-medium hover:bg-gold-dark rounded transition-colors">Home</Link>
            <Link href="/popular" className="px-4 py-2 text-sm font-medium hover:bg-gold-dark rounded transition-colors">Popular Collections</Link>
            <Link href="/new-arrivals" className="px-4 py-2 text-sm font-medium hover:bg-gold-dark rounded transition-colors">New Arrivals</Link>
            <Link href="/lakshmi-kubera" className="px-4 py-2 text-sm font-medium hover:bg-gold-dark rounded transition-colors">Lakshmi Kubera</Link>
            <Link href="/contact" className="px-4 py-2 text-sm font-medium hover:bg-gold-dark rounded transition-colors">Contact</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/cart" className="flex items-center gap-1.5 text-sm">
              <ShoppingBag className="w-4 h-4" /> Cart
              {cartCount > 0 && <span className="bg-white text-gold rounded-full px-1.5 text-[10px]">{cartCount}</span>}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[85vw] max-w-sm bg-white shadow-lg overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <Link href="/" onClick={() => setMobileOpen(false)} aria-label="LSJ Collections — Home">
                <Image src="/logo_lsj.png" alt="LSJ Collections" width={1508} height={1114} className="h-12 w-auto" />
              </Link>
              <button onClick={() => setMobileOpen(false)} aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-1">
              <Link href="/" onClick={() => setMobileOpen(false)} className="block py-3 border-b border-border/50 text-sm">Home</Link>
              <Link href="/products" onClick={() => setMobileOpen(false)} className="block py-3 border-b border-border/50 text-sm">All Products</Link>
              <Link href="/popular" onClick={() => setMobileOpen(false)} className="block py-3 border-b border-border/50 text-sm">Popular Collections</Link>
              <Link href="/new-arrivals" onClick={() => setMobileOpen(false)} className="block py-3 border-b border-border/50 text-sm">New Arrivals</Link>
              <Link href="/lakshmi-kubera" onClick={() => setMobileOpen(false)} className="block py-3 border-b border-border/50 text-sm">Lakshmi Kubera</Link>
              <Link href="/contact" onClick={() => setMobileOpen(false)} className="block py-3 border-b border-border/50 text-sm">Contact</Link>
              <div className="pt-3">
                <p className="text-xs uppercase text-gray mb-2">Categories</p>
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/categories/${c.id}`}
                    onClick={() => setMobileOpen(false)}
                    className="block py-2 text-sm text-gray hover:text-gold"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
              <div className="pt-4 border-t border-border">
                {isLoggedIn ? (
                  <>
                    <Link href="/account" onClick={() => setMobileOpen(false)} className="block py-2 text-sm">My Orders</Link>
                    <Link href="/wishlist" onClick={() => setMobileOpen(false)} className="block py-2 text-sm">Wishlist</Link>
                    <button onClick={handleLogout} className="block py-2 text-sm text-red-600">Logout</button>
                  </>
                ) : (
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className="btn-primary w-full text-center"
                  >
                    Login / Register
                  </Link>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
