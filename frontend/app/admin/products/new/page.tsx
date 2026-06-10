"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

interface RefData {
  categories: { id: number; name: string }[];
  subcategories: { id: number; category_id: string; name: string }[];
  ornaments: { id: number; name: string; price: string }[];
}

export default function NewProductPage() {
  const router = useRouter();
  const [ref, setRef] = useState<RefData | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [featured, setFeatured] = useState<File | null>(null);
  const [additional, setAdditional] = useState<File[]>([]);
  const featuredInput = useRef<HTMLInputElement>(null);
  const additionalInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get<RefData>("/admin/reference-data")
      .then((r) => setRef(r.data))
      .catch((e) => toast.error((e as Error).message));
  }, []);

  const subOptions = ref?.subcategories.filter((s) => Number(s.category_id) === Number(categoryId)) || [];

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!featured) return toast.error("Featured image is required");

    const fd = new FormData(e.currentTarget);
    fd.append("featured_image", featured);
    additional.forEach((f) => fd.append("additional_images", f));

    setSubmitting(true);
    try {
      const { data } = await api.post<{ id: number; slug: string }>("/admin/products", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Product created");
      router.push(`/admin/products/${data.id}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!ref) return <p className="text-gray text-sm">Loading…</p>;

  return (
    <div className="max-w-3xl">
      <button onClick={() => router.back()} className="text-sm text-gray hover:text-dark inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>
      <h1 className="font-serif text-3xl text-dark mb-1">New product</h1>
      <p className="text-sm text-gray mb-6">All fields marked * are required</p>

      <form onSubmit={onSubmit} className="space-y-5 bg-white border border-border rounded-lg p-6">
        <Field label="Product name *">
          <input name="product_name" required maxLength={250} className={inputCls} placeholder="e.g. 22K Lakshmi Coin Necklace" />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Product code">
            <input name="product_code" maxLength={100} className={inputCls} placeholder="auto-generated if blank" />
          </Field>
          <Field label="Slug (URL)">
            <input name="slug" maxLength={250} className={inputCls} placeholder="auto-generated from name if blank" />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Category *">
            <select name="category_id" required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
              <option value="">Select category</option>
              {ref.categories.map((c) => <option key={c.id} value={c.id}>{c.name.trim()}</option>)}
            </select>
          </Field>
          <Field label="Subcategory">
            <select name="subcategory_id" disabled={!categoryId} className={inputCls}>
              <option value="">— Optional —</option>
              {subOptions.map((s) => <option key={s.id} value={s.id}>{s.name.trim()}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Ornament type *">
            <select name="ornament_type" required className={inputCls}>
              <option value="">Select metal</option>
              {ref.ornaments.map((o) => <option key={o.id} value={o.id}>{o.name.trim()} (₹{Number(o.price).toLocaleString()}/g)</option>)}
            </select>
          </Field>
          <Field label="Weight (grams) *">
            <input name="ornament_weight" required className={inputCls} placeholder="e.g. 22.5" />
          </Field>
          <Field label="Stock *">
            <input name="stock" required defaultValue="1" className={inputCls} placeholder="quantity available" />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Discount %">
            <input name="discount_percentage" defaultValue="0" className={inputCls} placeholder="0–100" />
          </Field>
          <Field label="Making/misc charges (₹)">
            <input name="miscalleneous_price" defaultValue="0" className={inputCls} placeholder="0" />
          </Field>
        </div>

        <Field label="Short description">
          <textarea name="short_description" rows={2} maxLength={2000} className={inputCls} placeholder="One-line summary shown in product cards" />
        </Field>

        <Field label="Description (HTML allowed)">
          <textarea name="description" rows={5} className={inputCls} placeholder="Full description, can include <p>, <ul>, etc." />
        </Field>

        <Field label="Features">
          <textarea name="features" rows={3} className={inputCls} />
        </Field>

        <fieldset className="grid grid-cols-3 gap-3 text-sm">
          <Toggle name="is_lakshmi_kubera" label="Lakshmi Kubera" />
          <Toggle name="is_popular_collection" label="Popular collection" />
          <Toggle name="is_recommended" label="Recommended" />
        </fieldset>

        <Field label="Featured image *">
          <input ref={featuredInput} type="file" accept="image/*" hidden onChange={(e) => setFeatured(e.target.files?.[0] || null)} />
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => featuredInput.current?.click()} className="px-4 py-2 border border-border rounded text-sm hover:bg-gray-light inline-flex items-center gap-2">
              <Upload className="w-3.5 h-3.5" /> Choose file
            </button>
            {featured && (
              <div className="flex items-center gap-2 text-xs text-gray">
                <img src={URL.createObjectURL(featured)} alt="" className="w-10 h-10 rounded object-cover" />
                {featured.name}
                <button type="button" onClick={() => setFeatured(null)} className="text-red-600"><X className="w-3 h-3" /></button>
              </div>
            )}
          </div>
        </Field>

        <Field label="Additional images (up to 8)">
          <input ref={additionalInput} type="file" accept="image/*" multiple hidden onChange={(e) => setAdditional(Array.from(e.target.files || []).slice(0, 8))} />
          <button type="button" onClick={() => additionalInput.current?.click()} className="px-4 py-2 border border-border rounded text-sm hover:bg-gray-light inline-flex items-center gap-2">
            <Upload className="w-3.5 h-3.5" /> Choose files
          </button>
          {additional.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {additional.map((f, i) => (
                <div key={i} className="relative">
                  <img src={URL.createObjectURL(f)} alt="" className="w-16 h-16 rounded object-cover" />
                  <button type="button" onClick={() => setAdditional((a) => a.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">×</button>
                </div>
              ))}
            </div>
          )}
        </Field>

        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-gold text-white rounded text-sm hover:bg-gold-dark disabled:opacity-50">
            {submitting ? "Saving…" : "Create product"}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 border border-border rounded text-sm hover:bg-gray-light">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls = "w-full h-10 px-3 bg-gray-light border border-border rounded text-sm text-dark focus:outline-none focus:border-gold focus:bg-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-dark uppercase tracking-wide">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Toggle({ name, label }: { name: string; label: string }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" name={name} value="1" className="w-4 h-4 accent-gold" />
      <span className="text-dark">{label}</span>
    </label>
  );
}
