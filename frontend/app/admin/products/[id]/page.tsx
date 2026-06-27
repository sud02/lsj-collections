"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/api";
import ProductForm, { ProductFormInitial } from "@/components/admin/ProductForm";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [product, setProduct] = useState<ProductFormInitial | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<ProductFormInitial>(`/admin/products/${id}`)
      .then((r) => setProduct(r.data))
      .catch((e) => {
        const msg = (e as Error).message;
        setError(msg);
        toast.error(msg);
      });
  }, [id]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!product) return <p className="text-gray text-sm">Loading…</p>;

  return <ProductForm mode="edit" initial={product} />;
}
