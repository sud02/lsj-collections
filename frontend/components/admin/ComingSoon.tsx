import Link from "next/link";
import { Construction, ArrowLeft } from "lucide-react";

interface Props {
  title: string;
  description?: string;
}

export default function ComingSoon({ title, description }: Props) {
  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-3xl text-dark mb-1">{title}</h1>
      <div className="mt-6 bg-white border border-border rounded-lg p-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gold-bg text-gold-dark mb-4">
          <Construction className="w-7 h-7" />
        </div>
        <p className="font-serif text-xl text-dark mb-2">Coming soon</p>
        <p className="text-sm text-gray max-w-md mx-auto">
          {description || "This module is planned for a future release. The structure is in place — functionality will be added soon."}
        </p>
        <Link href="/admin" className="mt-6 inline-flex items-center gap-1.5 text-sm text-gold-dark hover:text-gold">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
        </Link>
      </div>
    </div>
  );
}
