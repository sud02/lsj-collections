"use client";
import Link from "next/link";
import { X, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import CartItem from "./CartItem";
import Button from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: Props) {
  const { items, total } = useCartStore();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.aside
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-lg flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
          >
            <header className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-gold" />
                <h4 className="font-serif text-lg text-dark">
                  Your Cart ({items.length})
                </h4>
              </div>
              <button onClick={onClose} aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {items.length === 0 ? (
                <p className="text-center text-gray py-12 text-sm">
                  Your cart is empty.
                </p>
              ) : (
                items.map((i) => <CartItem key={i.id} item={i} />)
              )}
            </div>

            {items.length > 0 && (
              <footer className="p-5 border-t border-border bg-gold-bg/40">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray">Subtotal</span>
                  <span className="font-serif text-xl text-gold font-semibold">
                    {formatINR(total)}
                  </span>
                </div>
                <Link href="/cart" onClick={onClose}>
                  <Button fullWidth>View Cart &amp; Checkout</Button>
                </Link>
              </footer>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
