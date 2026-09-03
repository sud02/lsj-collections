"use client";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import EmailStep from "./EmailStep";
import OTPStep from "./OTPStep";
import ProfileStep from "./ProfileStep";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";

type Step = "email" | "otp" | "profile";

export default function AuthModal() {
  const { isModalOpen, closeAuthModal, isLoggedIn } = useAuthStore();
  const syncCart = useCartStore((s) => s.syncWithServer);
  const syncWishlist = useWishlistStore((s) => s.syncWithServer);

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otpToken, setOtpToken] = useState("");

  useEffect(() => {
    if (!isModalOpen) {
      setStep("email");
      setEmail("");
      setOtpToken("");
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
      {step === "email" && (
        <EmailStep
          onSent={(res) => {
            setEmail(res.email);
            setOtpToken(res.otp_token);
            setStep("otp");
          }}
        />
      )}
      {step === "otp" && (
        <OTPStep
          email={email}
          otpToken={otpToken}
          onBack={() => setStep("email")}
          onTokenRefresh={setOtpToken}
          // First-time accounts land on the profile step to add a name + mobile.
          onComplete={(isNew) => (isNew ? setStep("profile") : closeAuthModal())}
        />
      )}
      {step === "profile" && <ProfileStep email={email} onDone={closeAuthModal} />}
    </Modal>
  );
}
