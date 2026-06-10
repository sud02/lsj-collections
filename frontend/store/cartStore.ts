import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem } from "@/types/cart";
import { Product } from "@/types/product";
import api from "@/lib/api";
import { useAuthStore } from "./authStore";

interface ServerCart {
  items: CartItem[];
  subtotal: number;
  gst: number;
  grand_total: number;
  item_count: number;
  total_quantity: number;
}

interface CartState {
  items: CartItem[];
  count: number;
  total: number;
  subtotal: number;
  gst: number;
  grandTotal: number;
  loading: boolean;

  recompute: () => void;
  applyServer: (data: ServerCart) => void;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (cartId: number) => Promise<void>;
  updateQuantity: (cartId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  syncWithServer: () => Promise<void>;
}

const localId = (() => {
  let n = -1;
  return () => n--;
})();

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      count: 0,
      total: 0,
      subtotal: 0,
      gst: 0,
      grandTotal: 0,
      loading: false,

      recompute: () => {
        const items = Array.isArray(get().items) ? get().items : [];
        const count = items.reduce((a, it) => a + it.quantity, 0);
        const total = items.reduce((a, it) => a + it.unit_price * it.quantity, 0);
        set({ count, total });
      },

      applyServer: (data) => {
        const items = Array.isArray(data?.items) ? data.items : [];
        set({
          items,
          subtotal: data?.subtotal ?? 0,
          gst: data?.gst ?? 0,
          grandTotal: data?.grand_total ?? 0,
          count: data?.total_quantity ?? items.reduce((a, i) => a + i.quantity, 0),
          total: data?.subtotal ?? items.reduce((a, i) => a + i.unit_price * i.quantity, 0),
        });
      },

      addItem: async (product, quantity = 1) => {
        const isLoggedIn = useAuthStore.getState().isLoggedIn;
        if (isLoggedIn) {
          try {
            const { data } = await api.post<ServerCart>("/cart", {
              product_id: product.id,
              quantity,
            });
            get().applyServer(data);
            return;
          } catch {
            // fall through
          }
        } else {
          set((s) => {
            const existing = s.items.findIndex((i) => i.product_id === product.id);
            if (existing >= 0) {
              const items = s.items.map((i, idx) =>
                idx === existing
                  ? {
                      ...i,
                      quantity: i.quantity + quantity,
                      total_price: (i.quantity + quantity) * i.unit_price,
                    }
                  : i
              );
              return { items };
            }
            const item: CartItem = {
              id: localId(),
              product_id: product.id,
              product,
              quantity,
              unit_price: product.price,
              total_price: product.price * quantity,
            };
            return { items: [...s.items, item] };
          });
        }
        get().recompute();
      },

      removeItem: async (cartId) => {
        const isLoggedIn = useAuthStore.getState().isLoggedIn;
        if (isLoggedIn && cartId > 0) {
          try {
            const { data } = await api.delete<ServerCart>(`/cart/${cartId}`);
            get().applyServer(data);
            return;
          } catch {
            // fall through
          }
        }
        set((s) => ({ items: s.items.filter((i) => i.id !== cartId) }));
        get().recompute();
      },

      updateQuantity: async (cartId, quantity) => {
        if (quantity < 1) return get().removeItem(cartId);
        const isLoggedIn = useAuthStore.getState().isLoggedIn;
        if (isLoggedIn && cartId > 0) {
          try {
            const { data } = await api.put<ServerCart>(`/cart/${cartId}`, { quantity });
            get().applyServer(data);
            return;
          } catch {
            // fall through
          }
        }
        set((s) => ({
          items: s.items.map((i) =>
            i.id === cartId
              ? { ...i, quantity, total_price: i.unit_price * quantity }
              : i
          ),
        }));
        get().recompute();
      },

      clearCart: async () => {
        const isLoggedIn = useAuthStore.getState().isLoggedIn;
        if (isLoggedIn) {
          try {
            const { data } = await api.delete<ServerCart>("/cart");
            get().applyServer(data);
            return;
          } catch {
            // fall through
          }
        }
        set({ items: [], subtotal: 0, gst: 0, grandTotal: 0, count: 0, total: 0 });
      },

      syncWithServer: async () => {
        const isLoggedIn = useAuthStore.getState().isLoggedIn;
        if (!isLoggedIn) return;
        set({ loading: true });
        try {
          const localItems = get().items.filter((i) => i.id < 0);
          for (const it of localItems) {
            try {
              await api.post("/cart", {
                product_id: it.product_id,
                quantity: it.quantity,
              });
            } catch {
              // no-op
            }
          }
          const { data } = await api.get<ServerCart>("/cart");
          get().applyServer(data);
        } catch {
          // no-op
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "lsj_cart",
      partialize: (s) => ({ items: Array.isArray(s.items) ? s.items : [] }),
      onRehydrateStorage: () => (state) => {
        if (state && !Array.isArray(state.items)) state.items = [];
        state?.recompute();
      },
    }
  )
);
