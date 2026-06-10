import HeroBanner from "@/components/home/HeroBanner";
import CategoryStrip from "@/components/home/CategoryStrip";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import SplitBanners from "@/components/home/SplitBanners";
import GoldRateTicker from "@/components/home/GoldRateTicker";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import TrustStrip from "@/components/home/TrustStrip";

export const revalidate = 3600;

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <CategoryStrip />
      <FeaturedProducts
        title="Popular Collections"
        subtitle="Best-loved pieces from our hallmark catalogue — handcrafted, certified, ready to ship."
        endpoint="/products/popular"
        viewAllHref="/popular"
      />
      <SplitBanners />
      <FeaturedProducts
        title="New Arrivals"
        subtitle="Freshly added designs — be the first to take one home."
        endpoint="/products/new-arrivals"
        viewAllHref="/new-arrivals"
      />
      <GoldRateTicker />
      <TestimonialsSection />
      <TrustStrip />
    </>
  );
}
