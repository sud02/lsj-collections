"use client";
import Link from "next/link";
import { Clock, ArrowLeft } from "lucide-react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Button from "@/components/ui/Button";

export default function AccountPage() {
  return (
    <div className="bg-cream min-h-screen">
      <div className="container-lsj py-6">
        <Breadcrumb items={[{ label: "My Account" }]} />
      </div>

      <div className="container-lsj py-16 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-gold-bg flex items-center justify-center text-gold-dark mb-6">
          <Clock className="w-7 h-7" />
        </div>

        <h1 className="font-serif text-3xl md:text-4xl text-dark">
          My Account — Coming soon
        </h1>
        <div className="gold-divider" />

        <p className="text-sm text-gray max-w-md mt-4 leading-relaxed">
          We&apos;re putting the finishing touches on your account area —
          orders, addresses, wishlist, and profile will all live here.
          Please check back shortly.
        </p>

        <Link href="/" className="mt-8">
          <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to home
          </Button>
        </Link>
      </div>
    </div>
  );
}
