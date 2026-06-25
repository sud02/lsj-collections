"use client";
import { useState } from "react";
import Image from "next/image";
import { Phone } from "lucide-react";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import { sendOTP, resetRecaptcha } from "@/lib/firebase";
import { formatPhoneE164, isValidIndianMobile, isBypassMode } from "@/lib/auth";
import type { ConfirmationResult } from "firebase/auth";

interface Props {
  onSent: (confirmation: ConfirmationResult | null, phone: string) => void;
}

export default function PhoneStep({ onSent }: Props) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidIndianMobile(phone)) {
      toast.error("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setLoading(true);
    try {
      if (isBypassMode()) {
        toast.success("Use OTP 123456");
        onSent(null, phone);
      } else {
        const confirmation = await sendOTP(formatPhoneE164(phone), "recaptcha-container");
        toast.success("OTP sent to your mobile");
        onSent(confirmation, phone);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send OTP";
      toast.error(message);
      resetRecaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="p-6 space-y-5">
      <div>
        <Image src="/logo_lsj.png" alt="LSJ Collections" width={1508} height={1114} className="h-12 w-auto mb-3" />
        <h4 className="font-serif text-lg text-dark mb-1">Welcome to LSJ Collections</h4>
        <p className="text-xs text-gray">
          Enter your mobile number — we&apos;ll send you a one-time password to verify.
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium text-dark mb-1.5 uppercase tracking-wide">
          Mobile Number <span className="text-red-600">*</span>
        </label>
        <div className="flex">
          <span className="flex items-center gap-1 px-4 bg-gray-light border border-r-0 border-border rounded-l text-sm text-gray">
            <Phone className="w-3.5 h-3.5" /> +91
          </span>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="98765 43210"
            className="flex-1 h-12 px-4 bg-gray-light border border-border rounded-r text-dark placeholder:text-gray-mid focus:outline-none focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/20 transition-all"
          />
        </div>
      </div>

      <Button type="submit" fullWidth size="lg" loading={loading}>
        Send OTP
      </Button>

      <div id="recaptcha-container" />

      <p className="text-[11px] text-gray text-center leading-relaxed">
        By continuing, you agree to our{" "}
        <a href="/terms-conditions" className="text-gold underline">Terms</a> &{" "}
        <a href="/privacy-policy" className="text-gold underline">Privacy Policy</a>.
      </p>
    </form>
  );
}
