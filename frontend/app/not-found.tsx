import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-cream py-16">
      <div className="container-lsj max-w-xl text-center">
        <p className="font-serif text-9xl text-gold/30 leading-none">404</p>
        <h1 className="font-serif text-3xl md:text-4xl text-dark mt-2">Page Not Found</h1>
        <div className="w-16 h-[2px] bg-gold mx-auto mt-3 mb-5" />
        <p className="text-sm text-gray max-w-sm mx-auto">
          The page you&apos;re looking for has wandered off. Let&apos;s get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link href="/" className="btn-primary">
            <Home className="w-4 h-4" /> Back to Home
          </Link>
          <Link href="/products" className="btn-outline">
            <Search className="w-4 h-4" /> Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}
