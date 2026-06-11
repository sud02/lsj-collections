"use client";
import { useEffect, useState } from "react";
import { Coins, Save, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

interface GoldRate {
  rate_22k: number;
  rate_24k: number;
  has_explicit_22k: boolean;
  updated_at: string | null;
}

export default function AdminGoldRate() {
  const [current, setCurrent] = useState<GoldRate | null>(null);
  const [rate24, setRate24] = useState("");
  const [rate22, setRate22] = useState("");
  const [auto22, setAuto22] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get<GoldRate>("/admin/gold-rate");
      setCurrent(data);
      setRate24(String(data.rate_24k || ""));
      setRate22(String(data.rate_22k || ""));
      setAuto22(!data.has_explicit_22k);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  useEffect(() => { load(); }, []);

  // Auto-derive 22K from 24K when in auto mode
  useEffect(() => {
    if (!auto22) return;
    const n = parseFloat(rate24);
    if (Number.isFinite(n)) setRate22(String(Math.round(n * 0.916)));
  }, [rate24, auto22]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r24 = parseFloat(rate24);
    if (!Number.isFinite(r24) || r24 <= 0) {
      toast.error("Enter a valid 24K rate");
      return;
    }
    setSaving(true);
    try {
      const payload: { rate_24k: number; rate_22k?: number } = { rate_24k: r24 };
      if (!auto22) {
        const r22 = parseFloat(rate22);
        if (!Number.isFinite(r22) || r22 <= 0) {
          toast.error("Enter a valid 22K rate");
          setSaving(false);
          return;
        }
        payload.rate_22k = r22;
      }
      await api.patch("/admin/gold-rate", payload);
      toast.success("Gold rate updated");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-dark">Today&apos;s Gold Rate</h1>
        <p className="text-sm text-gray mt-1">Update the rates shown on the storefront</p>
      </div>

      {current && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gold-bg border border-border rounded-lg p-4">
            <p className="text-xs uppercase tracking-wide text-gray">Current 24K</p>
            <p className="font-serif text-2xl text-dark mt-1">₹{current.rate_24k.toLocaleString()}/g</p>
          </div>
          <div className="bg-gold-bg border border-border rounded-lg p-4">
            <p className="text-xs uppercase tracking-wide text-gray">
              Current 22K {!current.has_explicit_22k && <span className="text-gray-mid">(auto)</span>}
            </p>
            <p className="font-serif text-2xl text-dark mt-1">₹{current.rate_22k.toLocaleString()}/g</p>
          </div>
          {current.updated_at && (
            <p className="col-span-2 text-[11px] text-gray">
              Last updated {new Date(current.updated_at).toLocaleString("en-IN")}
            </p>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="bg-white border border-border rounded-lg p-6 space-y-5">
        <div className="flex items-center gap-3 pb-2 border-b border-border">
          <div className="w-10 h-10 rounded-full bg-gold-bg flex items-center justify-center text-gold-dark">
            <Coins className="w-4 h-4" />
          </div>
          <p className="font-medium text-dark">New rates</p>
        </div>

        <label className="block">
          <span className="text-xs font-medium text-dark uppercase tracking-wide">24K Gold (₹ per gram) *</span>
          <input
            type="number"
            step="1"
            min="1"
            required
            value={rate24}
            onChange={(e) => setRate24(e.target.value)}
            className="mt-1.5 w-full h-11 px-3 bg-gray-light border border-border rounded text-sm focus:outline-none focus:border-gold focus:bg-white"
            placeholder="e.g. 10500"
          />
        </label>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={auto22}
            onChange={(e) => setAuto22(e.target.checked)}
            className="w-4 h-4 accent-gold"
          />
          <span className="text-dark">Auto-calculate 22K from 24K</span>
          <span className="text-xs text-gray">(× 0.916, industry standard)</span>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-dark uppercase tracking-wide">
            22K Gold (₹ per gram) {!auto22 && "*"}
          </span>
          <input
            type="number"
            step="1"
            min="1"
            required={!auto22}
            disabled={auto22}
            value={rate22}
            onChange={(e) => setRate22(e.target.value)}
            className="mt-1.5 w-full h-11 px-3 bg-gray-light border border-border rounded text-sm focus:outline-none focus:border-gold focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </label>

        <div className="flex items-center gap-3 pt-3 border-t border-border">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-white rounded text-sm hover:bg-gold-dark disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save rate"}
          </button>
          <button type="button" onClick={load} className="inline-flex items-center gap-2 px-5 py-2.5 border border-border rounded text-sm hover:bg-gray-light">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </form>
    </div>
  );
}
