"use client";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import PhoneStep from "./PhoneStep";
import OTPStep from "./OTPStep";
import ProfileStep from "./ProfileStep";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { resetRecaptcha } from "@/lib/firebase";
import type { ConfirmationResult } from "firebase/auth";

type Step = "phone" | "otp" | "profile";

export default function AuthModal() {
  const { isModalOpen, closeAuthModal, isLoggedIn } = useAuthStore();
  const syncCart = useCartStore((s) => s.syncWithServer);
  const syncWishlist = useWishlistStore((s) => s.syncWithServer);

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    if (!isModalOpen) {
      setStep("phone");
      setPhone("");
      setConfirmation(null);
      resetRecaptcha();
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (isLoggedIn) {
      syncCart();
      syncWishlist();
    }
  }, [isLoggedIn, syncCart, syncWishlist]);

  return (
    <Modal open={isModalOpen} onClose={closeAuthModal} size="sm">
      {step === "phone" && (
        <PhoneStep
          onSent={(c, p) => {
            setConfirmation(c);
            setPhone(p);
            setStep("otp");
          }}
        />
      )}
      {step === "otp" && confirmation && (
        <OTPStep
          phone={phone}
          confirmation={confirmation}
          onBack={() => setStep("phone")}
          onComplete={(isNew) => (isNew ? setStep("profile") : closeAuthModal())}
        />
      )}
      {step === "profile" && <ProfileStep onDone={closeAuthModal} />}
    </Modal>
  );
}
