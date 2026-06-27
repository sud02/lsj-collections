"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import { AxiosError } from "axios";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { adminLogin } from "@/lib/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const { isLoggedIn, user, hydrated, login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in as admin → skip the form
  useEffect(() => {
    if (hydrated && isLoggedIn && user?.role === "admin") {
      router.replace("/admin");
    }
  }, [hydrated, isLoggedIn, user, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, user: admin } = await adminLogin(email.trim(), password);
      login(token, admin);
      router.replace("/admin");
    } catch (err) {
      const ax = err as AxiosError<{ error?: string }>;
      setError(ax.response?.data?.error || ax.message || "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-border rounded-lg shadow-md p-8">
          <div className="flex flex-col items-center text-center mb-7">
            <Image
              src="/logo_lsj.png"
              alt="LSJ Collections"
              width={1508}
              height={1114}
              priority
              className="h-16 w-auto mb-4"
            />
            <h1 className="font-serif text-xl text-dark">Admin Sign In</h1>
            <p className="text-xs text-gray mt-1">Authorized personnel only</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-dark mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-mid" />
                <input
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@lsjcollections.com"
                  className="input-lsj pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-dark mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-mid" />
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-lsj pl-10"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" fullWidth loading={loading} disabled={!email || !password}>
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-center text-[11px] text-gray-mid mt-5">
          LSJ Collections · Admin Portal
        </p>
      </div>
    </div>
  );
}
