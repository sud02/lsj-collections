"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronDown,
  User as UserIcon,
  Mail,
  Phone,
  Pencil,
  ShoppingBag,
} from "lucide-react";
import toast from "react-hot-toast";

import api, { productImage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { isValidIndianMobile } from "@/lib/auth";
import { OrderDetailResponse, OrderItem } from "@/types/order";
import { User } from "@/types/user";

import Breadcrumb from "@/components/ui/Breadcrumb";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { formatINR, formatDate } from "@/lib/utils";

/** Shape of GET /orders — a lighter projection than the full order row. */
interface OrderSummary {
  id: number;
  order_id: string;
  total_products: string;
  grandtotal: string;
  payment_status: "pending" | "paid" | "failed";
  order_status: string | null;
  billing_fullname: string;
  billing_city: string;
  created_at: string;
}

const PAYMENT_STYLES: Record<string, string> = {
  paid: "bg-green-50 text-green-700 border-green-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-red-50 text-red-700 border-red-200",
};

const Badge = ({ label, className }: { label: string; className: string }) => (
  <span className={`inline-block px-2 py-0.5 rounded-full border text-[11px] font-medium capitalize ${className}`}>
    {label}
  </span>
);

function OrderCard({ order }: { order: OrderSummary }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<OrderItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  // Items are fetched only when a card is actually expanded — the list endpoint
  // doesn't carry them, and most people open one order, not twenty.
  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (!next || items) return;
    setLoading(true);
    try {
      const { data } = await api.get<OrderDetailResponse>(`/orders/${order.id}`);
      setItems(data.items);
    } catch {
      toast.error("Could not load the items for this order");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden">
      <div className="p-5 flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-dark text-sm truncate">{order.order_id}</p>
          <p className="text-xs text-gray mt-0.5">
            {formatDate(order.created_at)} · {order.total_products} item
            {Number(order.total_products) !== 1 && "s"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            label={order.payment_status}
            className={PAYMENT_STYLES[order.payment_status] || PAYMENT_STYLES.pending}
          />
          {order.order_status && (
            <Badge label={order.order_status.replace(/_/g, " ")} className="bg-gold-bg text-gold-dark border-gold-light/60" />
          )}
        </div>

        <p className="text-gold font-serif text-lg w-28 text-right">
          {formatINR(Number(order.grandtotal))}
        </p>

        <button
          onClick={toggle}
          aria-expanded={open}
          className="flex items-center gap-1 text-xs text-gray hover:text-dark transition-colors"
        >
          {open ? "Hide" : "View"} items
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-gold-bg/30 px-5 py-4">
          {loading ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : items && items.length ? (
            <ul className="space-y-3">
              {items.map((it) => (
                <li key={it.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 shrink-0 bg-white border border-border rounded overflow-hidden">
                    {it.product_image && (
                      <Image
                        src={it.featured_image_url || productImage(it.product_image)}
                        alt={it.product_name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-dark truncate">{it.product_name}</p>
                    <p className="text-xs text-gray">Qty {it.quantity}</p>
                  </div>
                  <p className="text-sm text-dark whitespace-nowrap">
                    {formatINR(Number(it.product_price))}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray text-center py-2">No items recorded on this order.</p>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileCard() {
  const { user, updateUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [mobile, setMobile] = useState(user?.mobile || "");
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Enter your full name");
      return;
    }
    if (mobile && !isValidIndianMobile(mobile)) {
      toast.error("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post<{ user: User }>("/auth/complete-profile", {
        name: name.trim(),
        ...(mobile ? { mobile } : {}),
      });
      updateUser(data.user);
      toast.success("Profile updated");
      setEditing(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not save your profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg text-dark">Profile</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs text-gold hover:text-gold-dark"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={save} className="space-y-3">
          <Input label="Full Name" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label="Mobile"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="98765 43210"
          />
          <div className="flex gap-2 pt-1">
            <Button type="submit" size="sm" loading={saving}>Save</Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setEditing(false);
                setName(user?.name || "");
                setMobile(user?.mobile || "");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <dl className="space-y-3 text-sm">
          <div className="flex items-center gap-2.5">
            <UserIcon className="w-4 h-4 text-gray-mid shrink-0" />
            <dd className="text-dark">{user?.name || "—"}</dd>
          </div>
          <div className="flex items-center gap-2.5">
            <Mail className="w-4 h-4 text-gray-mid shrink-0" />
            <dd className="text-dark break-all">{user?.email || "—"}</dd>
          </div>
          <div className="flex items-center gap-2.5">
            <Phone className="w-4 h-4 text-gray-mid shrink-0" />
            <dd className="text-dark">{user?.mobile ? `+91 ${user.mobile}` : "Not added"}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}

export default function AccountPage() {
  const { isLoggedIn, hydrated, openAuthModal } = useAuthStore();
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const { data } = await api.get<OrderSummary[]>("/orders");
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setFailed(true);
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isLoggedIn) {
      openAuthModal();
      return;
    }
    load();
  }, [hydrated, isLoggedIn, openAuthModal, load]);

  return (
    <div className="bg-cream min-h-screen">
      <div className="container-lsj py-6">
        <Breadcrumb items={[{ label: "My Account" }]} />

        <div className="mt-2 mb-8">
          <h1 className="font-serif text-3xl md:text-4xl text-dark">My Account</h1>
          <div className="w-16 h-[2px] bg-gold mt-2" />
        </div>

        {!hydrated ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : !isLoggedIn ? (
          <EmptyState
            icon={<UserIcon className="w-8 h-8" />}
            title="Sign in to view your orders"
            description="We'll email you a one-time code — no password needed. Your orders, wishlist and profile all live here."
            actionLabel="Sign in"
            onAction={openAuthModal}
          />
        ) : (
          <div className="grid lg:grid-cols-[320px_1fr] gap-6 pb-16">
            <div className="space-y-4">
              <ProfileCard />
              <Link href="/wishlist" className="block">
                <div className="bg-white border border-border rounded-lg p-5 hover:border-gold transition-colors">
                  <p className="font-serif text-lg text-dark">My Wishlist</p>
                  <p className="text-xs text-gray mt-1">Items you saved for later</p>
                </div>
              </Link>
            </div>

            <div>
              <h2 className="font-serif text-xl text-dark mb-4">
                My Orders {orders && orders.length > 0 && (
                  <span className="text-sm text-gray font-sans">({orders.length})</span>
                )}
              </h2>

              {orders === null ? (
                <div className="flex justify-center py-20"><Spinner /></div>
              ) : failed ? (
                <div className="bg-white border border-border rounded-lg p-8 text-center">
                  <p className="text-sm text-gray mb-4">We couldn&apos;t load your orders just now.</p>
                  <Button variant="outline" size="sm" onClick={load}>Try again</Button>
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white border border-border rounded-lg">
                  <EmptyState
                    icon={<ShoppingBag className="w-8 h-8" />}
                    title="No orders yet"
                    description="When you place an order it will appear here, with its items and delivery status."
                    actionLabel="Start shopping"
                    actionHref="/products"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((o) => <OrderCard key={o.id} order={o} />)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
