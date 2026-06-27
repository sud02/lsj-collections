"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Printer } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  product_type: string | null;
  quantity: number;
  product_weight: string | null;
  price_per_gram: string | null;
  product_actual_price: string | null;
  product_price: string | null;
  product_image_url: string | null;
}

interface Order {
  id: number;
  order_id: string;
  user_id: string;
  subtotal: string | null;
  gst: string | null;
  total: string | null;
  grandtotal: string;
  discount: string | null;
  coupon: string | null;
  payment_status: string;
  order_status: string;
  payment_mode: string | null;
  payment_reference: string | null;
  payment_id: string | null;
  payment_date: string | null;
  remarks: string | null;
  created_at: string;
  billing_fullname: string;
  billing_email: string;
  billing_mobile: string;
  billing_address1: string | null;
  billing_address2: string | null;
  billing_city: string | null;
  billing_state: string | null;
  billing_pincode: string | null;
  shipping_fullname: string | null;
  shipping_mobile: string | null;
  shipping_address1: string | null;
  shipping_address2: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_pincode: string | null;
}

const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["pending", "paid", "failed"];

const inr = (v: string | number | null | undefined) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

export default function AdminOrderDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ order: Order; items: OrderItem[] }>(`/admin/orders/${id}`)
      .then((r) => {
        setOrder(r.data.order);
        setItems(r.data.items);
        setRemarks(r.data.order.remarks || "");
      })
      .catch((e) => {
        const msg = (e as Error).message;
        setError(msg);
        toast.error(msg);
      });
  }, [id]);

  const patch = async (body: Record<string, string>) => {
    if (!order) return;
    try {
      await api.patch(`/admin/orders/${order.id}`, body);
      setOrder({ ...order, ...body });
      toast.success("Updated");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!order) return <p className="text-gray text-sm">Loading…</p>;

  const addr = (p: "billing" | "shipping") => {
    const g = (k: string) => (order as unknown as Record<string, string | null>)[`${p}_${k}`];
    const line = [g("address1"), g("address2"), g("city"), g("state"), g("pincode")].filter(Boolean).join(", ");
    return { name: g("fullname"), mobile: g("mobile"), line };
  };
  const billing = addr("billing");
  const shipping = addr("shipping");
  const hasShipping = shipping.name || shipping.line;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Controls (not printed) */}
      <div className="no-print space-y-4">
        <Link href="/admin/orders" className="text-sm text-gray hover:text-dark inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to orders
        </Link>
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-3xl text-dark">Order #{order.id}</h1>
            <p className="text-sm text-gray">{order.order_id} · {new Date(order.created_at).toLocaleString()}</p>
          </div>
          <button onClick={() => window.print()} className="px-4 py-2 border border-border rounded text-sm hover:bg-gray-light inline-flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print invoice
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 bg-white border border-border rounded-lg p-4">
          <label className="block">
            <span className="text-xs font-medium text-dark uppercase tracking-wide">Order status</span>
            <select value={order.order_status || "pending"} onChange={(e) => patch({ order_status: e.target.value })}
              className="mt-1.5 w-full h-10 px-3 border border-border rounded text-sm bg-white">
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-dark uppercase tracking-wide">Payment status</span>
            <select value={order.payment_status || "pending"} onChange={(e) => patch({ payment_status: e.target.value })}
              className="mt-1.5 w-full h-10 px-3 border border-border rounded text-sm bg-white">
              {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-dark uppercase tracking-wide">Internal remarks</span>
            <div className="mt-1.5 flex gap-2">
              <input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Admin notes (not shown to customer)"
                className="flex-1 h-10 px-3 bg-gray-light border border-border rounded text-sm focus:outline-none focus:border-gold focus:bg-white" />
              <button onClick={() => patch({ remarks })} className="px-4 py-2 bg-gold text-white rounded text-sm hover:bg-gold-dark">Save</button>
            </div>
          </label>
        </div>
      </div>

      {/* Invoice (printable) */}
      <div className="print-area bg-white border border-border rounded-lg p-6 md:p-8 space-y-6">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <Image src="/logo_lsj.png" alt="LSJ Collections" width={1508} height={1114} className="h-14 w-auto" />
          </div>
          <div className="text-right text-xs text-gray">
            <p className="font-serif text-lg text-dark">Invoice</p>
            <p>{order.order_id}</p>
            <p>{new Date(order.created_at).toLocaleDateString()}</p>
            <p className="mt-1 capitalize">Payment: <span className="font-medium text-dark">{order.payment_status}</span></p>
            <p className="capitalize">Status: <span className="font-medium text-dark">{order.order_status || "pending"}</span></p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray mb-1">Billed to</p>
            <p className="font-medium text-dark">{billing.name}</p>
            <p className="text-gray">{order.billing_email}</p>
            <p className="text-gray">+91 {billing.mobile}</p>
            {billing.line && <p className="text-gray mt-1">{billing.line}</p>}
          </div>
          {hasShipping && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray mb-1">Ship to</p>
              <p className="font-medium text-dark">{shipping.name || billing.name}</p>
              {shipping.mobile && <p className="text-gray">+91 {shipping.mobile}</p>}
              {shipping.line && <p className="text-gray mt-1">{shipping.line}</p>}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-gray border-b border-border">
              <tr>
                <th className="py-2">Item</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Unit price</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const unit = Number(it.product_price || 0);
                return (
                  <tr key={it.id} className="border-b border-border/60">
                    <td className="py-2.5">
                      <p className="text-dark">{it.product_name}</p>
                      <p className="text-[11px] text-gray">
                        {[it.product_type, it.product_weight ? `${it.product_weight} g` : null].filter(Boolean).join(" · ")}
                      </p>
                    </td>
                    <td className="py-2.5 text-center">{it.quantity}</td>
                    <td className="py-2.5 text-right">{inr(unit)}</td>
                    <td className="py-2.5 text-right">{inr(unit * it.quantity)}</td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr><td colSpan={4} className="py-4 text-center text-gray text-xs">No line items recorded for this order.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-full sm:w-64 text-sm space-y-1.5">
            {order.subtotal != null && (
              <Row label="Subtotal" value={inr(order.subtotal)} />
            )}
            {order.discount && Number(order.discount) > 0 && (
              <Row label={`Discount${order.coupon ? ` (${order.coupon})` : ""}`} value={`– ${inr(order.discount)}`} />
            )}
            {order.gst != null && <Row label="GST" value={inr(order.gst)} />}
            <div className="flex justify-between border-t border-border pt-2 mt-1 font-medium text-dark">
              <span>Grand total</span>
              <span>{inr(order.grandtotal)}</span>
            </div>
          </div>
        </div>

        {(order.payment_mode || order.payment_reference || order.payment_id) && (
          <div className="text-[11px] text-gray border-t border-border pt-4">
            {order.payment_mode && <p>Payment mode: {order.payment_mode}</p>}
            {order.payment_reference && <p>Reference: {order.payment_reference}</p>}
            {order.payment_id && <p>Payment ID: {order.payment_id}</p>}
            {order.payment_date && <p>Paid on: {new Date(order.payment_date).toLocaleString()}</p>}
          </div>
        )}

        <p className="text-center text-[11px] text-gray-mid pt-2">
          Thank you for shopping with LSJ Collections · Tirupati
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-gray">
      <span>{label}</span>
      <span className="text-dark">{value}</span>
    </div>
  );
}
