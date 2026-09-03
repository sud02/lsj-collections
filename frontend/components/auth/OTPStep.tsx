"use client";
import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import { requestEmailOtp, verifyEmailOtp } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";

interface Props {
  email: string;
  otpToken: string;
  onBack: () => void;
  onTokenRefresh: (token: string) => void;
  onComplete: (isNew: boolean) => void;
}

const RESEND_SECONDS = 30;

export default function OTPStep({ email, otpToken, onBack, onTokenRefresh, onComplete }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
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
      toast.error("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const res = await verifyEmailOtp(otpToken, otp);
      login(res.token, res.user);
      toast.success(`Welcome${res.user.name ? `, ${res.user.name.split(" ")[0]}` : ""}!`);
      onComplete(Boolean(res.is_new));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid code";
      toast.error(message);
      setDigits(Array(6).fill(""));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      const res = await requestEmailOtp(email);
      onTokenRefresh(res.otp_token);
      setTimer(RESEND_SECONDS);
      setDigits(Array(6).fill(""));
      inputs.current[0]?.focus();
      toast.success(res.dev_bypass ? "Dev mode — use OTP 123456" : "New code sent");
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
        <h4 className="font-serif text-lg text-dark mb-1">Check your inbox</h4>
        <p className="text-xs text-gray">
          We sent a 6-digit code to <span className="font-medium text-dark">{email}</span>
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
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={1}
              className="w-12 h-12 text-center text-lg font-semibold border border-border rounded bg-gray-light focus:outline-none focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/20 transition-all"
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        {timer > 0 ? (
          <span className="text-gray">Resend code in {timer}s</span>
        ) : (
          <button
            type="button"
            onClick={resend}
            disabled={resending}
            className="text-gold font-medium hover:text-gold-dark"
          >
            {resending ? "Sending…" : "Resend code"}
          </button>
        )}
        <button type="button" onClick={onBack} className="text-gray hover:text-dark">
          Change Email
        </button>
      </div>

      <Button type="submit" fullWidth size="lg" loading={loading}>
        Verify &amp; Continue
      </Button>

      <p className="text-[11px] text-gray text-center">
        Can&apos;t find it? Check your spam or promotions folder.
      </p>
    </form>
  );
}
