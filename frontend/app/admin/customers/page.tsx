"use client";
import { Fragment, useCallback, useEffect, useState } from "react";
import { Search, ChevronDown, UserX, UserCheck } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

interface AdminCustomer {
  id: number;
  name: string;
  email: string;
  mobile: string;
  status: number;
  created_at: string;
  order_count: number;
  total_spent: string;
  last_order_at: string | null;
}

interface CustomerOrder {
  id: number;
  order_id: string;
  grandtotal: string;
  payment_status: string;
  order_status: string | null;
  created_at: string;
}

const inr = (v: string | number) =>
  `₹${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const date = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const PAY_STYLES: Record<string, string> = {
  paid: "bg-green-50 text-green-700",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-700",
};

function OrderHistory({ id }: { id: number }) {
  const [orders, setOrders] = useState<CustomerOrder[] | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .get<{ customer: unknown; orders: CustomerOrder[] }>(`/admin/customers/${id}`)
      .then((r) => alive && setOrders(r.data.orders))
      .catch(() => alive && setOrders([]));
    return () => {
      alive = false;
    };
  }, [id]);

  if (orders === null) return <p className="text-xs text-gray py-2">Loading orders…</p>;
  if (!orders.length) return <p className="text-xs text-gray py-2">No orders placed yet.</p>;

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-gray text-left">
          <th className="py-1 font-medium">Order</th>
          <th className="py-1 font-medium">Date</th>
          <th className="py-1 font-medium">Payment</th>
          <th className="py-1 font-medium">Status</th>
          <th className="py-1 font-medium text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => (
          <tr key={o.id} className="border-t border-border/60">
            <td className="py-1.5 font-medium text-dark">{o.order_id}</td>
            <td className="py-1.5 text-gray">{date(o.created_at)}</td>
            <td className="py-1.5">
              <span className={`px-1.5 py-0.5 rounded ${PAY_STYLES[o.payment_status] || ""}`}>
                {o.payment_status}
              </span>
            </td>
            <td className="py-1.5 text-gray capitalize">{o.order_status || "—"}</td>
            <td className="py-1.5 text-right text-dark">{inr(o.grandtotal)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [items, setItems] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (search.trim()) qs.set("search", search.trim());
      if (status) qs.set("status", status);
      const { data } = await api.get<AdminCustomer[]>(
        `/admin/customers${qs.toString() ? `?${qs}` : ""}`
      );
      setItems(data);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  // Debounced so typing in the search box doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const toggleActive = async (c: AdminCustomer) => {
    const next = c.status === 1 ? 0 : 1;
    if (next === 0 && !confirm(`Deactivate ${c.name || c.email}? They will not be able to sign in.`)) return;
    try {
      await api.patch(`/admin/customers/${c.id}`, { status: next });
      setItems((s) => s.map((x) => (x.id === c.id ? { ...x, status: next } : x)));
      toast.success(next ? "Account activated" : "Account deactivated");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-3xl text-dark">Customers</h1>
          <p className="text-sm text-gray mt-1">
            {loading ? "Loading…" : `${items.length} customer${items.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-mid" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email or mobile"
              className="h-9 pl-9 pr-3 w-64 border border-border rounded text-sm bg-white focus:outline-none focus:border-gold"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-9 px-3 border border-border rounded text-sm bg-white"
          >
            <option value="">All accounts</option>
            <option value="active">Active</option>
            <option value="inactive">Deactivated</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gold-bg/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium text-center">Orders</th>
                <th className="px-4 py-3 font-medium text-right">Spent</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <Fragment key={c.id}>
                  <tr className="border-t border-border">
                    <td className="px-4 py-3">
                      <p className="font-medium text-dark">{c.name || "—"}</p>
                      <p className="text-[11px] text-gray">#{c.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-dark break-all">{c.email || "—"}</p>
                      <p className="text-[11px] text-gray">{c.mobile ? `+91 ${c.mobile}` : "No mobile"}</p>
                    </td>
                    <td className="px-4 py-3 text-gray text-xs">{date(c.created_at)}</td>
                    <td className="px-4 py-3 text-center">
                      {c.order_count > 0 ? (
                        <button
                          onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                          className="inline-flex items-center gap-1 text-gold-dark hover:text-gold"
                        >
                          {c.order_count}
                          <ChevronDown className={`w-3 h-3 transition-transform ${expanded === c.id ? "rotate-180" : ""}`} />
                        </button>
                      ) : (
                        <span className="text-gray">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{inr(c.total_spent)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] ${c.status === 1 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {c.status === 1 ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleActive(c)}
                        title={c.status === 1 ? "Deactivate account" : "Activate account"}
                        className="inline-flex items-center gap-1 text-xs text-gray hover:text-dark"
                      >
                        {c.status === 1 ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        {c.status === 1 ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                  {expanded === c.id && (
                    <tr className="bg-gold-bg/20">
                      <td colSpan={7} className="px-4 py-3">
                        <OrderHistory id={c.id} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && items.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-gray">
            {search || status ? "No customers match that filter." : "No customers yet."}
          </p>
        )}
      </div>
    </div>
  );
}
