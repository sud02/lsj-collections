"use client";
import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import type { ConfirmationResult } from "firebase/auth";
import { phoneLogin, formatPhoneE164 } from "@/lib/auth";
import { sendOTP, resetRecaptcha } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";

interface Props {
  phone: string;
  confirmation: ConfirmationResult;
  onBack: () => void;
  onComplete: (isNew: boolean) => void;
}

export default function OTPStep({ phone, confirmation, onBack, onComplete }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const currentConfirm = useRef(confirmation);
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    if (timer === 0) return;
    const id = setInterval(() => setTimer((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [timer]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const onChange = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 5) inputs.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const t = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    if (t.length) {
      setDigits((p) => p.map((_, i) => t[i] ?? ""));
      inputs.current[Math.min(t.length, 5)]?.focus();
      e.preventDefault();
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const cred = await currentConfirm.current.confirm(otp);
      const firebaseToken = await cred.user.getIdToken();
      const res = await phoneLogin(firebaseToken, phone);
      login(res.token, res.user);
      toast.success(`Welcome${res.user.name ? `, ${res.user.name.split(" ")[0]}` : ""}!`);
      onComplete(Boolean(res.is_new));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid OTP";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      resetRecaptcha();
      const conf = await sendOTP(formatPhoneE164(phone), "recaptcha-container");
      currentConfirm.current = conf;
      setTimer(30);
      setDigits(Array(6).fill(""));
      toast.success("OTP resent");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Resend failed";
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={verify} className="p-6 space-y-5">
      <div>
        <h4 className="font-serif text-lg text-dark mb-1">Verify OTP</h4>
        <p className="text-xs text-gray">
          OTP sent to <span className="font-medium text-dark">+91 {phone}</span>
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium text-dark mb-1.5 uppercase tracking-wide">
          One-Time Password
        </label>
        <div className="flex gap-2 justify-between">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              value={d}
              onChange={(e) => onChange(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              onPaste={i === 0 ? onPaste : undefined}
              inputMode="numeric"
              maxLength={1}
              className="w-12 h-12 text-center text-lg font-semibold border border-border rounded bg-gray-light focus:outline-none focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/20 transition-all"
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        {timer > 0 ? (
          <span className="text-gray">Resend OTP in {timer}s</span>
        ) : (
          <button
            type="button"
            onClick={resend}
            disabled={resending}
            className="text-gold font-medium hover:text-gold-dark"
          >
            {resending ? "Sending…" : "Resend OTP"}
          </button>
        )}
        <button type="button" onClick={onBack} className="text-gray hover:text-dark">
          Change Number
        </button>
      </div>

      <Button type="submit" fullWidth size="lg" loading={loading}>
        Verify &amp; Login
      </Button>

      <div id="recaptcha-container" />
    </form>
  );
}
