"use client";
import { useEffect, useState } from "react";
import { User as UserIcon, Upload } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Testimonial, RatingBreakdown } from "@/types/product";
import RatingStars from "@/components/product/RatingStars";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, isLoggedIn, openAuthModal } = useAuthStore();

  useEffect(() => {
    api
      .get<Testimonial[]>("/testimonials")
      .then((r) => setTestimonials(r.data))
      .catch(() => setTestimonials([]));
  }, []);

  const breakdown: RatingBreakdown = (() => {
    const total = testimonials.length;
    if (total === 0) return { average: 0, total: 0, distribution: {} };
    const sum = testimonials.reduce((a, t) => a + t.rating, 0);
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    testimonials.forEach((t) => {
      distribution[t.rating] = (distribution[t.rating] || 0) + 1;
    });
    return { average: sum / total, total, distribution };
  })();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      openAuthModal();
      return;
    }
    if (review.trim().length < 10) {
      toast.error("Review must be at least 10 characters");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<Testimonial>("/testimonials", {
        name: name || user?.name,
        rating,
        review: review.trim(),
      });
      setTestimonials((prev) => [data, ...prev]);
      setReview("");
      setName("");
      setRating(5);
      toast.success("Thanks for your feedback!");
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-14 bg-cream">
      <div className="container-lsj">
        <div className="text-center mb-10">
          <h2 className="font-serif text-2xl md:text-3xl text-dark">
            What Our Customers Say
          </h2>
          <div className="w-16 h-[2px] bg-gold mx-auto mt-2" />
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left: ratings */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg p-6 border border-border sticky top-24">
              <div className="text-center mb-6 pb-6 border-b border-border">
                <p className="font-serif text-5xl text-gold font-semibold">
                  {breakdown.average.toFixed(1)}
                </p>
                <RatingStars value={breakdown.average} size={18} className="mt-2" />
                <p className="text-xs text-gray mt-2">
                  Based on {breakdown.total} verified reviews
                </p>
              </div>

              <ul className="space-y-2">
                {[5, 4, 3, 2, 1].map((n) => {
                  const count = breakdown.distribution[n] || 0;
                  const pct = breakdown.total ? (count / breakdown.total) * 100 : 0;
                  return (
                    <li key={n} className="flex items-center gap-2 text-xs">
                      <span className="w-4 text-gray">{n}★</span>
                      <div className="flex-1 h-1.5 bg-gray-light rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gold rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-gray">{count}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Right: reviews */}
          <div className="lg:col-span-8">
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {testimonials.slice(0, 6).map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-lg p-5 border border-border hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gold-bg flex items-center justify-center text-gold shrink-0">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark">{t.name}</p>
                      <p className="text-[11px] text-gray">{formatDate(t.created_at)}</p>
                    </div>
                  </div>
                  <RatingStars value={t.rating} size={12} />
                  <p className="text-sm text-gray mt-2 leading-relaxed line-clamp-4">
                    {t.review}
                  </p>
                </div>
              ))}
              {testimonials.length === 0 && (
                <p className="md:col-span-2 text-center text-gray py-8">
                  No reviews yet — be the first to share your experience.
                </p>
              )}
            </div>

            {/* Submit form */}
            <form
              onSubmit={submit}
              className="bg-white rounded-lg p-6 border border-border"
            >
              <h4 className="font-serif text-lg text-dark mb-3">Share Your Review</h4>

              <div className="grid md:grid-cols-2 gap-3">
                <Input
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLoggedIn}
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray">Rate us:</span>
                  <RatingStars value={rating} size={24} interactive onChange={setRating} />
                </div>
              </div>

              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={3}
                required
                placeholder="Tell us about your LSJ Collections experience…"
                className="w-full p-3 mt-3 bg-gray-light border border-border rounded text-sm focus:outline-none focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/20"
              />

              <div className="flex items-center justify-between mt-3">
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs text-gray hover:text-gold"
                >
                  <Upload className="w-3.5 h-3.5" /> Add photo (optional)
                </button>
                <Button type="submit" loading={loading}>
                  Submit Review
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
