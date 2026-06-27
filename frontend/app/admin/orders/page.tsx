"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

interface AdminOrder {
  id: number;
  order_id: string;
  user_id: string;
  billing_fullname: string;
  billing_email: string;
  billing_mobile: string;
  grandtotal: string;
  payment_mode: string | null;
  payment_status: string;
  order_status: string;
  coupon: string | null;
  created_at: string;
}

const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["pending", "paid", "failed"];

export default function AdminOrders() {
  const [paymentFilter, setPaymentFilter] = useState("");
  const [items, setItems] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = paymentFilter ? `?payment=${paymentFilter}` : "";
      const { data } = await api.get<AdminOrder[]>(`/admin/orders${params}`);
      setItems(data);
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setLoading(false); }
  }, [paymentFilter]);

  useEffect(() => { load(); }, [load]);

  const updateField = async (id: number, field: "order_status" | "payment_status", value: string) => {
    try {
      await api.patch(`/admin/orders/${id}`, { [field]: value });
      toast.success("Updated");
      setItems((s) => s.map((o) => (o.id === id ? { ...o, [field]: value } : o)));
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-3xl text-dark">Orders</h1>
          <p className="text-sm text-gray mt-1">{items.length} orders</p>
        </div>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="h-9 px-3 border border-border rounded text-sm bg-white">
          <option value="">All payments</option>
          {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-gray text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-gray text-sm bg-white border border-border rounded-lg p-6 text-center">No orders.</p>
      ) : (
        <div className="bg-white border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-light text-xs uppercase text-gray text-left">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id} className="border-t border-border align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-dark">#{o.id}</p>
                    <p className="text-[11px] text-gray">{o.order_id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-dark">{o.billing_fullname}</p>
                    <p className="text-[11px] text-gray">{o.billing_email}</p>
                    <p className="text-[11px] text-gray">+91 {o.billing_mobile}</p>
                  </td>
                  <td className="px-4 py-3 font-medium">₹{Number(o.grandtotal).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <select value={o.payment_status} onChange={(e) => updateField(o.id, "payment_status", e.target.value)}
                      className="h-8 px-2 border border-border rounded text-xs bg-white">
                      {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select value={o.order_status || "pending"} onChange={(e) => updateField(o.id, "order_status", e.target.value)}
                      className="h-8 px-2 border border-border rounded text-xs bg-white">
                      {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="text-gold-dark hover:text-gold inline-flex items-center gap-1 text-xs">
                      <Eye className="w-3.5 h-3.5" /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
