"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { User } from "@/types/user";

export default function ProfileStep({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const updateUser = useAuthStore((s) => s.updateUser);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Enter your full name");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<User>("/auth/me", { name: name.trim(), email });
      updateUser(data);
      toast.success("Profile saved");
      onDone();
    } catch {
      updateUser({ name: name.trim(), email });
      toast.success("Welcome!");
      onDone();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={save} className="p-6 space-y-4">
      <div>
        <h4 className="font-serif text-lg text-dark mb-1">Complete your profile</h4>
        <p className="text-xs text-gray">A couple of quick details to personalise your experience.</p>
      </div>
      <Input
        label="Full Name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Lakshmi Devi"
      />
      <Input
        label="Email (optional)"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />
      <Button type="submit" fullWidth size="lg" loading={loading}>
        Save &amp; Continue
      </Button>
    </form>
  );
}
