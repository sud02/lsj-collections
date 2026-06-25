"use client";
import { ReactNode, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import AuthModal from "@/components/auth/AuthModal";

export default function Providers({ children }: { children: ReactNode }) {
  const { hydrated, isLoggedIn, openAuthModal, logout } = useAuthStore();
  const syncCart = useCartStore((s) => s.syncWithServer);
  const syncWishlist = useWishlistStore((s) => s.syncWithServer);

  useEffect(() => {
    if (hydrated && isLoggedIn) {
      syncCart();
      syncWishlist();
    }
  }, [hydrated, isLoggedIn, syncCart, syncWishlist]);

  useEffect(() => {
    const onExpired = () => {
      logout();
      openAuthModal();
    };
    window.addEventListener("lsj:auth-expired", onExpired);
    return () => window.removeEventListener("lsj:auth-expired", onExpired);
  }, [logout, openAuthModal]);

  return (
    <>
      {children}
      <AuthModal />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "12px",
            background: "#221f1d",
            color: "#fff",
            fontSize: "13px",
            padding: "10px 16px",
          },
          success: {
            iconTheme: { primary: "#1b8a94", secondary: "#fff" },
          },
        }}
      />
    </>
  );
}
