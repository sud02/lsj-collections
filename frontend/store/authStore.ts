import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types/user";
import { setToken, clearToken, TOKEN_KEY } from "@/lib/api";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  isModalOpen: boolean;
  hydrated: boolean;

  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  setHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      isModalOpen: false,
      hydrated: false,

      login: (token, user) => {
        setToken(token);
        set({ token, user, isLoggedIn: true, isModalOpen: false });
      },
      logout: () => {
        clearToken();
        set({ token: null, user: null, isLoggedIn: false });
      },
      updateUser: (partial) =>
        set((s) => ({ user: s.user ? { ...s.user, ...partial } : null })),
      openAuthModal: () => set({ isModalOpen: true }),
      closeAuthModal: () => set({ isModalOpen: false }),
      setHydrated: (v) => set({ hydrated: v }),
    }),
    {
      name: "lsj_auth",
      partialize: (s) => ({ user: s.user, token: s.token, isLoggedIn: s.isLoggedIn }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          localStorage.setItem(TOKEN_KEY, state.token);
        }
        state?.setHydrated(true);
      },
    }
  )
);
