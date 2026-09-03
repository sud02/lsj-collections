"use client";
import { useState } from "react";
import Image from "next/image";
import { Mail } from "lucide-react";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import { requestEmailOtp, isValidEmail } from "@/lib/auth";
import type { RequestOtpResponse } from "@/types/user";

interface Props {
  onSent: (result: RequestOtpResponse) => void;
}

export default function EmailStep({ onSent }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      const res = await requestEmailOtp(email);
      toast.success(res.dev_bypass ? "Dev mode — use OTP 123456" : "Code sent to your inbox");
      onSent(res);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not send the code";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="p-6 space-y-5">
      <div>
        <Image src="/logo_lsj.png" alt="LSJ Collections" width={1508} height={1114} className="h-16 w-auto mb-3" />
        <h4 className="font-serif text-lg text-dark mb-1">Welcome to LSJ Collections</h4>
        <p className="text-xs text-gray">
          Enter your email — we&apos;ll send you a one-time password. No password to remember.
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium text-dark mb-1.5 uppercase tracking-wide">
          Email Address <span className="text-red-600">*</span>
        </label>
        <div className="flex">
          <span className="flex items-center px-4 bg-gray-light border border-r-0 border-border rounded-l text-sm text-gray">
            <Mail className="w-3.5 h-3.5" />
          </span>
          <input
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 h-12 px-4 bg-gray-light border border-border rounded-r text-dark placeholder:text-gray-mid focus:outline-none focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/20 transition-all"
          />
        </div>
      </div>

      <Button type="submit" fullWidth size="lg" loading={loading}>
        Send OTP
      </Button>

      <p className="text-[11px] text-gray text-center leading-relaxed">
        New here? Your account is created automatically once you verify the code.
        <br />
        By continuing, you agree to our{" "}
        <a href="/terms-conditions" className="text-gold underline">Terms</a> &{" "}
        <a href="/privacy-policy" className="text-gold underline">Privacy Policy</a>.
      </p>
    </form>
  );
}
