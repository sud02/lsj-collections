import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/types/product";
import api from "@/lib/api";
import { useAuthStore } from "./authStore";

interface WishlistState {
  items: Product[];
  count: number;
  loading: boolean;

  addItem: (product: Product) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  toggle: (product: Product) => Promise<void>;
  isWishlisted: (productId: number) => boolean;
  syncWithServer: () => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      count: 0,
      loading: false,

      addItem: async (product) => {
        if (get().items.some((i) => i.id === product.id)) return;
        const isLoggedIn = useAuthStore.getState().isLoggedIn;
        if (isLoggedIn) {
          try {
            await api.post("/wishlist", { product_id: product.id });
          } catch {
            // no-op
          }
        }
        set((s) => ({ items: [...s.items, product], count: s.items.length + 1 }));
      },

      removeItem: async (productId) => {
        const isLoggedIn = useAuthStore.getState().isLoggedIn;
        if (isLoggedIn) {
          try {
            await api.delete(`/wishlist/${productId}`);
          } catch {
            // no-op
          }
        }
        set((s) => {
          const items = s.items.filter((i) => i.id !== productId);
          return { items, count: items.length };
        });
      },

      toggle: async (product) => {
        if (get().isWishlisted(product.id)) {
          await get().removeItem(product.id);
        } else {
          await get().addItem(product);
        }
      },

      isWishlisted: (productId) => get().items.some((i) => i.id === productId),

      syncWithServer: async () => {
        const isLoggedIn = useAuthStore.getState().isLoggedIn;
        if (!isLoggedIn) return;
        set({ loading: true });
        try {
          const { data } = await api.get<Product[]>("/wishlist");
          set({ items: data, count: data.length });
        } catch {
          // no-op
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "lsj_wishlist",
      partialize: (s) => ({ items: s.items }),
      onRehydrateStorage: () => (state) => {
        if (state) state.count = state.items.length;
      },
    }
  )
);
