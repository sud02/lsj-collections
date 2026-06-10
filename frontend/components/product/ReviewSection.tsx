"use client";
import { useState } from "react";
import { ProductReview } from "@/types/product";
import RatingStars from "./RatingStars";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { User as UserIcon } from "lucide-react";

interface Props {
  productId: number;
  reviews: ProductReview[];
  onAdded: (r: ProductReview) => void;
}

export default function ReviewSection({ productId, reviews, onAdded }: Props) {
  const { isLoggedIn, openAuthModal } = useAuthStore();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      openAuthModal();
      return;
    }
    if (text.trim().length < 10) {
      toast.error("Review must be at least 10 characters");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<ProductReview & { status: number; message?: string }>(
        `/products/${productId}/reviews`,
        { rating, review: text.trim() }
      );
      // Only show optimistically if it's already approved (auto-approve mode)
      if (data.status === 1) onAdded(data);
      setText("");
      setRating(5);
      toast.success(data.message || "Review submitted");
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div>
        <h4 className="font-serif text-xl text-dark mb-4">
          Customer Reviews ({reviews.length})
        </h4>
        {reviews.length === 0 ? (
          <p className="text-sm text-gray italic">
            Be the first to review this product.
          </p>
        ) : (
          <ul className="space-y-5">
            {reviews.map((r) => (
              <li key={r.id} className="pb-5 border-b border-border last:border-0">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold-bg flex items-center justify-center text-gold shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-dark">{r.user_name}</span>
                      <span className="text-[11px] text-gray">{formatDate(r.created_at)}</span>
                    </div>
                    <RatingStars value={r.rating} size={12} className="mt-0.5" />
                    <p className="text-sm text-gray mt-1.5 leading-relaxed">{r.review}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-gold-bg rounded-lg p-6 h-fit">
        <h4 className="font-serif text-xl text-dark mb-2">Write a Review</h4>
        <p className="text-xs text-gray mb-4">
          Share your experience to help fellow shoppers.
        </p>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-dark mb-1.5 uppercase tracking-wide">
              Your Rating
            </label>
            <RatingStars value={rating} size={24} interactive onChange={setRating} />
          </div>

          <div>
            <label className="block text-xs font-medium text-dark mb-1.5 uppercase tracking-wide">
              Review
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="Tell us about the design, quality, craftsmanship…"
              className="w-full p-3 bg-white border border-border rounded text-sm placeholder:text-gray-mid focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
            />
          </div>

          <Button type="submit" loading={loading} fullWidth>
            {isLoggedIn ? "Submit Review" : "Login & Submit"}
          </Button>
        </form>
      </div>
    </div>
  );
}
