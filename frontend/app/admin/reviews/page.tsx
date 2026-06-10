"use client";
import { useCallback, useEffect, useState } from "react";
import { Check, X, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

interface Review {
  id: number;
  user_id: string;
  user_name: string | null;
  product_id: number;
  product_name: string | null;
  product_image_url: string | null;
  rating: number;
  review: string;
  status: number;
  created_at: string;
}

export default function AdminReviews() {
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Review[]>(`/admin/reviews?status=${filter}`);
      setItems(data);
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: number, status: number) => {
    try {
      await api.patch(`/admin/reviews/${id}`, { status });
      toast.success(status === 1 ? "Approved" : "Unapproved");
      load();
    } catch (e) { toast.error((e as Error).message); }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this review permanently?")) return;
    try {
      await api.delete(`/admin/reviews/${id}`);
      toast.success("Deleted");
      load();
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-3xl text-dark">Product reviews</h1>
          <p className="text-sm text-gray mt-1">Moderate ratings posted by customers</p>
        </div>
        <div className="flex gap-2 text-sm">
          {(["pending", "approved", "all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-pill border ${filter === f ? "bg-gold text-white border-gold" : "border-border text-gray hover:text-dark"}`}>
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-gray text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-gray text-sm bg-white border border-border rounded-lg p-6 text-center">Nothing here.</p>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <div key={r.id} className="bg-white border border-border rounded-lg p-4 flex gap-4">
              {r.product_image_url && <img src={r.product_image_url} alt="" className="w-16 h-16 rounded object-cover" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-dark truncate">{r.product_name || `Product #${r.product_id}`}</p>
                  <div className="text-gold text-sm shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < r.rating ? "text-gold" : "text-gray-mid"}>★</span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray mb-2">
                  {r.user_name || `User ${r.user_id}`} · {new Date(r.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm text-dark leading-relaxed">{r.review}</p>
                <div className="flex items-center gap-2 mt-3">
                  {r.status === 0 ? (
                    <button onClick={() => setStatus(r.id, 1)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gold text-white rounded hover:bg-gold-dark">
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                  ) : (
                    <button onClick={() => setStatus(r.id, 0)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-gray-light">
                      <X className="w-3.5 h-3.5" /> Unapprove
                    </button>
                  )}
                  <button onClick={() => remove(r.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50 ml-auto">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
