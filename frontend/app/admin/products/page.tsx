"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

interface AdminProduct {
  id: number;
  product_name: string;
  product_code: string;
  slug: string;
  category_name: string | null;
  subcategory_name: string | null;
  stock: string;
  price: number;
  mrp: number;
  status: number;
  featured_image_url: string | null;
}

export default function AdminProducts() {
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("active");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: filter });
      if (search) params.set("search", search);
      const { data } = await api.get<AdminProduct[]>(`/admin/products?${params}`);
      setItems(data);
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setLoading(false); }
  }, [filter, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const remove = async (id: number, name: string) => {
    if (!confirm(`Hide "${name}" from the storefront? (soft delete — can be reactivated)`)) return;
    try {
      await api.delete(`/admin/products/${id}`);
      toast.success("Hidden from storefront");
      load();
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-3xl text-dark">Products</h1>
          <p className="text-sm text-gray mt-1">{items.length} products</p>
        </div>
        <Link href="/admin/products/new" className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-white rounded text-sm hover:bg-gold-dark">
          <Plus className="w-4 h-4" /> Add product
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or code…"
            className="w-full h-10 pl-10 pr-4 bg-white border border-border rounded text-sm focus:outline-none focus:border-gold"
          />
        </div>
        <div className="flex gap-2 text-sm">
          {(["active", "inactive", "all"] as const).map((f) => (
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
        <p className="text-gray text-sm bg-white border border-border rounded-lg p-6 text-center">No products.</p>
      ) : (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-light text-xs uppercase text-gray text-left">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-gray-light/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.featured_image_url ? (
                        <img src={p.featured_image_url} alt="" className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-light" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-dark truncate max-w-[260px]">{p.product_name}</p>
                        <p className="text-[11px] text-gray">{p.product_code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray">
                    {p.category_name}
                    {p.subcategory_name && <><br /><span className="text-gray-mid">{p.subcategory_name}</span></>}
                  </td>
                  <td className="px-4 py-3 text-xs">{p.stock}</td>
                  <td className="px-4 py-3 text-xs">₹{p.price.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-pill ${p.status === 1 ? "bg-green-50 text-green-700" : "bg-gray-light text-gray"}`}>
                      {p.status === 1 ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Link href={`/admin/products/${p.id}`} className="p-1.5 hover:bg-gold-bg rounded text-gold-dark">
                        <Pencil className="w-3.5 h-3.5" />
                      </Link>
                      <button onClick={() => remove(p.id, p.product_name)} className="p-1.5 hover:bg-red-50 rounded text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
