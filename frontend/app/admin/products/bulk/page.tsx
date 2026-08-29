"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, Download, CheckCircle2, AlertCircle } from "lucide-react";
import Papa from "papaparse";
import toast from "react-hot-toast";
import api from "@/lib/api";

interface RefData {
  categories: { id: number; name: string }[];
  subcategories: { id: number; category_id: string; name: string }[];
  ornaments: { id: number; name: string; price: string }[];
}

interface PreviewRow {
  index: number;
  product_name: string;
  category: string;
  ornament_type: string;
  weight: string;
  // resolved payload (when valid)
  payload?: Record<string, string | number | null>;
  error?: string;
}

const TEMPLATE_HEADERS = [
  "product_name",
  "product_code",
  "category",
  "subcategory",
  "ornament_type",
  "ornament_weight",
  "discount_percentage",
  "miscalleneous_price",
  "stock",
  "short_description",
  "description",
  "flags",
];

const TEMPLATE_SAMPLE = [
  "22K Lakshmi Coin Necklace,,Necklaces,,22K Gold,22.5,8,1200,3,Festive coin necklace,Detailed description here,popular",
  "Silver Kada,,Bangles,,Silver,40,0,500,10,Classic silver kada,,recommended,lakshmi_kubera",
];

const norm = (s: string) => s.trim().toLowerCase();

export default function BulkUploadPage() {
  const [ref, setRef] = useState<RefData | null>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; failed: { row: number; reason: string }[] } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .get<RefData>("/admin/reference-data")
      .then((r) => setRef(r.data))
      .catch((e) => toast.error((e as Error).message));
  }, []);

  const downloadTemplate = () => {
    const csv = [TEMPLATE_HEADERS.join(","), ...TEMPLATE_SAMPLE].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lsj-products-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validateRow = (raw: Record<string, string>, index: number): PreviewRow => {
    if (!ref) return { index, product_name: "", category: "", ornament_type: "", weight: "", error: "Reference data not loaded" };
    const get = (k: string) => (raw[k] ?? "").toString().trim();

    const product_name = get("product_name");
    const categoryName = get("category");
    const ornamentName = get("ornament_type");
    const weight = get("ornament_weight");
    const base: PreviewRow = { index, product_name, category: categoryName, ornament_type: ornamentName, weight };

    if (!product_name || product_name.length < 2) return { ...base, error: "Product name is required (min 2 chars)" };

    const category = ref.categories.find((c) => norm(c.name) === norm(categoryName));
    if (!category) return { ...base, error: `Unknown category "${categoryName}"` };

    const ornament = ref.ornaments.find((o) => norm(o.name) === norm(ornamentName));
    if (!ornament) return { ...base, error: `Unknown ornament type "${ornamentName}"` };

    if (!weight) return { ...base, error: "Weight is required" };

    const subName = get("subcategory");
    const sub = subName
      ? ref.subcategories.find((s) => norm(s.name) === norm(subName) && Number(s.category_id) === category.id)
      : undefined;
    if (subName && !sub) return { ...base, error: `Unknown subcategory "${subName}" for ${categoryName}` };

    const flags = get("flags").split(/[,;|]/).map(norm);

    return {
      ...base,
      payload: {
        product_name,
        product_code: get("product_code") || "",
        category_id: category.id,
        subcategory_id: sub ? sub.id : "",
        ornament_type: ornament.id,
        ornament_weight: weight,
        discount_percentage: get("discount_percentage") || "0",
        miscalleneous_price: get("miscalleneous_price") || "0",
        stock: get("stock") || "1",
        short_description: get("short_description") || "",
        description: get("description") || "",
        is_lakshmi_kubera: flags.includes("lakshmi_kubera") ? "1" : "0",
        is_popular_collection: flags.includes("popular") ? "1" : "0",
        is_recommended: flags.includes("recommended") ? "1" : "0",
      },
    };
  };

  const onFile = (file: File) => {
    setResult(null);
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const parsed = res.data.map((raw, i) => validateRow(raw, i + 1));
        setRows(parsed);
        if (!parsed.length) toast.error("No rows found in the CSV");
      },
      error: (err) => toast.error(err.message),
    });
  };

  const valid = rows.filter((r) => r.payload);
  const invalid = rows.filter((r) => r.error);

  const doImport = async () => {
    if (!valid.length) return;
    setImporting(true);
    try {
      const { data } = await api.post<{ created: number; failed: { row: number; reason: string }[] }>(
        "/admin/products/bulk",
        { rows: valid.map((r) => r.payload) }
      );
      setResult(data);
      toast.success(`Imported ${data.created} product${data.created === 1 ? "" : "s"} as drafts`);
      setRows([]);
      setFileName("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link href="/admin/products" className="text-sm text-gray hover:text-dark inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to products
        </Link>
        <h1 className="font-serif text-3xl text-dark">Bulk upload products</h1>
        <p className="text-sm text-gray mt-1">
          Import many products at once from a CSV. Imported products are saved as{" "}
          <span className="font-medium text-dark">drafts (inactive)</span> — add a featured image via Edit to publish them.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={downloadTemplate} className="px-4 py-2 border border-border rounded text-sm hover:bg-gray-light inline-flex items-center gap-2">
          <Download className="w-4 h-4" /> Download CSV template
        </button>
        <input ref={fileInput} type="file" accept=".csv,text/csv" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        <button onClick={() => fileInput.current?.click()} disabled={!ref} className="px-4 py-2 bg-gold text-white rounded text-sm hover:bg-gold-dark disabled:opacity-50 inline-flex items-center gap-2">
          <Upload className="w-4 h-4" /> Choose CSV file
        </button>
        {fileName && <span className="text-xs text-gray">{fileName}</span>}
      </div>

      <div className="bg-gold-bg border border-border rounded-lg p-4 text-xs text-gray leading-relaxed">
        <p className="font-medium text-dark mb-1">Columns</p>
        <p>
          <code>product_name</code> (required), <code>product_code</code>, <code>category</code> (required, must match an
          existing category name), <code>subcategory</code>, <code>ornament_type</code> (required, must match a metal name),{" "}
          <code>ornament_weight</code> (required), <code>discount_percentage</code>, <code>miscalleneous_price</code>,{" "}
          <code>stock</code>, <code>short_description</code>, <code>description</code>, <code>flags</code> (comma list of{" "}
          <code>popular</code>, <code>recommended</code>, <code>lakshmi_kubera</code>).
        </p>
      </div>

      {rows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="inline-flex items-center gap-1.5 text-teal-dark">
              <CheckCircle2 className="w-4 h-4" /> {valid.length} valid
            </span>
            {invalid.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-red-600">
                <AlertCircle className="w-4 h-4" /> {invalid.length} with errors (will be skipped)
              </span>
            )}
          </div>

          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-light text-left text-xs uppercase text-gray">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Metal</th>
                  <th className="px-3 py-2">Weight</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.index} className={`border-t border-border ${r.error ? "bg-red-50" : ""}`}>
                    <td className="px-3 py-2 text-gray">{r.index}</td>
                    <td className="px-3 py-2 text-dark">{r.product_name || <span className="text-gray-mid">—</span>}</td>
                    <td className="px-3 py-2">{r.category}</td>
                    <td className="px-3 py-2">{r.ornament_type}</td>
                    <td className="px-3 py-2">{r.weight}</td>
                    <td className="px-3 py-2">
                      {r.error ? (
                        <span className="text-red-600 text-xs">{r.error}</span>
                      ) : (
                        <span className="text-teal-dark text-xs inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={doImport} disabled={importing || !valid.length} className="px-6 py-2.5 bg-gold text-white rounded text-sm hover:bg-gold-dark disabled:opacity-50">
            {importing ? "Importing…" : `Import ${valid.length} product${valid.length === 1 ? "" : "s"}`}
          </button>
        </div>
      )}

      {result && (
        <div className="border border-border rounded-lg p-5 space-y-2">
          <p className="text-sm text-dark font-medium inline-flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal" /> {result.created} product{result.created === 1 ? "" : "s"} imported as drafts
          </p>
          {result.failed.length > 0 && (
            <div className="text-xs text-red-600">
              <p className="font-medium">{result.failed.length} failed:</p>
              <ul className="list-disc ml-5">
                {result.failed.map((f, i) => (
                  <li key={i}>Row {f.row}: {f.reason}</li>
                ))}
              </ul>
            </div>
          )}
          <Link href="/admin/products?status=inactive" className="text-sm text-gold-dark hover:underline inline-block mt-2">
            View draft products →
          </Link>
        </div>
      )}
    </div>
  );
}
