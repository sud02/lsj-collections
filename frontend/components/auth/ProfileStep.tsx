"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { isValidIndianMobile } from "@/lib/auth";
import { User } from "@/types/user";

interface Props {
  /** Verified address from the OTP step — shown read-only, already on the account. */
  email?: string;
  onDone: () => void;
}

export default function ProfileStep({ email, onDone }: Props) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const updateUser = useAuthStore((s) => s.updateUser);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Enter your full name");
      return;
    }
    if (mobile && !isValidIndianMobile(mobile)) {
      toast.error("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<{ user: User }>("/auth/complete-profile", {
        name: name.trim(),
        ...(mobile ? { mobile } : {}),
      });
      updateUser(data.user);
      toast.success("Profile saved");
      onDone();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not save your profile";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={save} className="p-6 space-y-4">
      <div>
        <h4 className="font-serif text-lg text-dark mb-1">Complete your profile</h4>
        <p className="text-xs text-gray">
          A couple of quick details to personalise your experience.
        </p>
      </div>

      {email && (
        <div>
          <label className="block text-xs font-medium text-dark mb-1.5 uppercase tracking-wide">
            Email
          </label>
          <div className="h-12 px-4 flex items-center bg-gray-light border border-border rounded text-sm text-gray">
            {email} <span className="ml-2 text-[11px] text-green-700">Verified</span>
          </div>
        </div>
      )}

      <Input
        label="Full Name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Lakshmi Devi"
      />
      <Input
        label="Mobile (optional)"
        type="tel"
        inputMode="numeric"
        maxLength={10}
        value={mobile}
        onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
        placeholder="98765 43210"
      />
      <p className="text-[11px] text-gray -mt-1">
        We use this only for delivery updates on your orders.
      </p>

      <Button type="submit" fullWidth size="lg" loading={loading}>
        Save &amp; Continue
      </Button>

      <button
        type="button"
        onClick={onDone}
        className="w-full text-xs text-gray hover:text-dark"
      >
        Skip for now
      </button>
    </form>
  );
}
