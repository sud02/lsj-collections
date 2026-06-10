"use client";
import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { LogOut, Package, FileText, Search } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Order } from "@/types/order";
import { useAuthStore } from "@/store/authStore";
import { logoutApi } from "@/lib/auth";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import {
  formatINR,
  formatDate,
  statusLabel,
  statusColorClass,
  cn,
} from "@/lib/utils";

export default function AccountPage() {
  const { user, isLoggedIn, logout, openAuthModal, hydrated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOrder, setModalOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    if (hydrated && !isLoggedIn) openAuthModal();
  }, [hydrated, isLoggedIn, openAuthModal]);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    api
      .get<Order[]>("/orders")
      .then((r) => setOrders(r.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  const filtered = useMemo(() => {
    if (!search) return orders;
    const q = search.toLowerCase();
    return orders.filter(
      (o) =>
        (o.order_number || String(o.id)).toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q)
    );
  }, [orders, search]);

  const pageOrders = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  const handleLogout = async () => {
    await logoutApi();
    logout();
    toast.success("Logged out");
  };

  return (
    <div className="bg-cream min-h-screen">
      <div className="container-lsj py-6">
        <Breadcrumb items={[{ label: "My Account" }]} />

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mt-2 mb-8">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl text-dark">My Orders</h1>
            <div className="w-16 h-[2px] bg-gold mt-2" />
            {user && (
              <p className="text-sm text-gray mt-3">
                Welcome back,{" "}
                <span className="text-dark font-medium">{user.name}</span>
                {user.mobile && <> · +91 {user.mobile}</>}
              </p>
            )}
          </div>

          <Button
            variant="outline"
            onClick={handleLogout}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Logout
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size={32} />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-border rounded-lg">
            <EmptyState
              icon={<Package className="w-8 h-8" />}
              title="No orders yet"
              description="Your order history will appear here once you've made a purchase."
              actionLabel="Browse Products"
              actionHref="/products"
            />
          </div>
        ) : (
          <div className="bg-white border border-border rounded-lg overflow-hidden">
            <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-mid" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by order ID or status…"
                  className="w-full h-10 pl-9 pr-3 bg-gray-light border border-border rounded text-xs focus:outline-none focus:border-gold focus:bg-white"
                />
              </div>
              <p className="text-xs text-gray">
                {filtered.length} order{filtered.length !== 1 && "s"}
              </p>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gold-bg/40 text-left">
                  <tr>
                    <th className="px-4 py-3 text-xs uppercase tracking-wide text-dark">S.No</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wide text-dark">Order ID</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wide text-dark">Date</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wide text-dark">Products</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wide text-dark">Amount</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wide text-dark">Status</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wide text-dark text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {pageOrders.map((o, i) => (
                    <tr key={o.id} className="border-t border-border hover:bg-gold-bg/30">
                      <td className="px-4 py-3 text-gray">{(page - 1) * perPage + i + 1}</td>
                      <td className="px-4 py-3 font-medium text-dark">#{o.order_number || o.id}</td>
                      <td className="px-4 py-3 text-gray text-xs">{formatDate(o.created_at)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setModalOrder(o)}
                          className="text-gold hover:text-gold-dark underline text-xs"
                        >
                          View {o.items?.length ?? 0} item{o.items && o.items.length !== 1 && "s"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-dark font-medium">
                        {formatINR(o.grand_total)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-pill text-[11px] border font-medium",
                            statusColorClass(o.status)
                          )}
                        >
                          {statusLabel(o.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/account/orders/${o.id}`}
                          className="inline-flex items-center gap-1 text-xs text-gold hover:text-gold-dark"
                        >
                          <FileText className="w-3.5 h-3.5" /> Invoice
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border">
              {pageOrders.map((o) => (
                <div key={o.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-dark text-sm">
                      #{o.order_number || o.id}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-pill text-[11px] border font-medium",
                        statusColorClass(o.status)
                      )}
                    >
                      {statusLabel(o.status)}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray">{formatDate(o.created_at)}</p>
                  <div className="flex items-center justify-between mt-2">
                    <button
                      onClick={() => setModalOrder(o)}
                      className="text-gold underline text-xs"
                    >
                      View {o.items?.length ?? 0} item{o.items && o.items.length !== 1 && "s"}
                    </button>
                    <span className="text-dark font-medium">{formatINR(o.grand_total)}</span>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t border-border flex items-center justify-between">
                <p className="text-xs text-gray">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 border border-border rounded text-xs disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 border border-border rounded text-xs disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        open={!!modalOrder}
        onClose={() => setModalOrder(null)}
        title={`Order #${modalOrder?.order_number || modalOrder?.id}`}
        size="lg"
      >
        <div className="p-6">
          {modalOrder?.items?.length ? (
            <table className="w-full text-sm">
              <thead className="bg-gold-bg/40 text-left">
                <tr>
                  <th className="px-3 py-2 text-xs uppercase text-dark">Item</th>
                  <th className="px-3 py-2 text-xs uppercase text-dark">Qty</th>
                  <th className="px-3 py-2 text-xs uppercase text-dark">Unit</th>
                  <th className="px-3 py-2 text-xs uppercase text-dark text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {modalOrder.items.map((it) => (
                  <tr key={it.id} className="border-t border-border">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        {it.product_image && (
                          <div className="relative w-12 h-12 rounded bg-gold-bg overflow-hidden border border-border shrink-0">
                            <Image
                              src={it.product_image}
                              alt={it.product_name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-dark line-clamp-1">{it.product_name}</p>
                          {it.variation_label && (
                            <p className="text-[11px] text-gray">{it.variation_label}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">{it.quantity}</td>
                    <td className="px-3 py-3">{formatINR(it.unit_price)}</td>
                    <td className="px-3 py-3 text-right font-medium">
                      {formatINR(it.total_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray">No items found.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
