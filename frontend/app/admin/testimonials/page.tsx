"use client";
import { useCallback, useEffect, useState } from "react";
import { Check, X, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

interface Testimonial {
  id: number;
  name: string;
  subject: string;
  message: string;
  rating: number;
  image_url: string | null;
  status: number;
  created_at: string;
}

export default function AdminTestimonials() {
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Testimonial[]>(`/admin/testimonials?status=${filter}`);
      setItems(data);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: number, status: number) => {
    try {
      await api.patch(`/admin/testimonials/${id}`, { status });
      toast.success(status === 1 ? "Approved" : "Unapproved");
      load();
    } catch (e) { toast.error((e as Error).message); }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this testimonial permanently?")) return;
    try {
      await api.delete(`/admin/testimonials/${id}`);
      toast.success("Deleted");
      load();
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-3xl text-dark">Testimonials</h1>
          <p className="text-sm text-gray mt-1">Approve or reject customer testimonials</p>
        </div>
        <div className="flex gap-2 text-sm">
          {(["pending", "approved", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-pill border ${filter === f ? "bg-gold text-white border-gold" : "border-border text-gray hover:text-dark"}`}
            >
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
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((t) => (
            <div key={t.id} className="bg-white border border-border rounded-lg p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-dark">{t.name}</p>
                  <p className="text-[11px] text-gray">{new Date(t.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-1 text-gold">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < t.rating ? "text-gold" : "text-gray-mid"}>★</span>
                  ))}
                </div>
              </div>
              {t.subject && t.subject !== "Testimonial" && (
                <p className="text-sm font-medium text-dark mb-1">{t.subject}</p>
              )}
              <p className="text-sm text-gray leading-relaxed">{t.message}</p>
              {t.image_url && (
                <img src={t.image_url} alt="" className="mt-3 rounded max-h-32 object-cover" />
              )}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                {t.status === 0 ? (
                  <button onClick={() => setStatus(t.id, 1)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gold text-white rounded hover:bg-gold-dark">
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                ) : (
                  <button onClick={() => setStatus(t.id, 0)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-gray-light">
                    <X className="w-3.5 h-3.5" /> Unapprove
                  </button>
                )}
                <button onClick={() => remove(t.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50 ml-auto">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
