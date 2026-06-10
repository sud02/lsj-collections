import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="py-3">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-gray">
        <li>
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-gold transition-colors"
          >
            <Home className="w-3 h-3" />
            Home
          </Link>
        </li>
        {items.map((c, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
              <ChevronRight className="w-3 h-3 text-gray-mid" />
              {c.href && !isLast ? (
                <Link href={c.href} className="hover:text-gold transition-colors">
                  {c.label}
                </Link>
              ) : (
                <span className="text-dark font-medium line-clamp-1">
                  {c.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
