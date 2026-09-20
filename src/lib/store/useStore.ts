"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type WishlistItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  image?: string;
};

export type Toast = {
  id: string;
  message: string;
  type?: "success" | "info" | "error";
};

type AppState = {
  // Wishlist
  wishlist: WishlistItem[];
  toggleWishlist: (item: WishlistItem) => boolean; // returns true if added, false if removed
  isInWishlist: (id: string) => boolean;
  removeFromWishlist: (id: string) => void;

  // Cart Drawer
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;

  // Mobile Search Dialog
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;

  // Pincode memory
  savedPincode: string;
  setSavedPincode: (pin: string) => void;

  // Toasts
  toasts: Toast[];
  addToast: (message: string, type?: "success" | "info" | "error") => void;
  removeToast: (id: string) => void;
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      wishlist: [],
      toggleWishlist: (item) => {
        const current = get().wishlist;
        const exists = current.some((x) => x.id === item.id);
        if (exists) {
          set({ wishlist: current.filter((x) => x.id !== item.id) });
          get().addToast(`Removed from wishlist`, "info");
          return false;
        } else {
          set({ wishlist: [item, ...current] });
          get().addToast(`Added to wishlist!`, "success");
          return true;
        }
      },
      isInWishlist: (id) => get().wishlist.some((x) => x.id === id),
      removeFromWishlist: (id) => {
        set({ wishlist: get().wishlist.filter((x) => x.id !== id) });
        get().addToast(`Item removed from wishlist`, "info");
      },

      isCartOpen: false,
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),

      isSearchOpen: false,
      openSearch: () => set({ isSearchOpen: true }),
      closeSearch: () => set({ isSearchOpen: false }),

      savedPincode: "",
      setSavedPincode: (pin) => set({ savedPincode: pin }),

      toasts: [],
      addToast: (message, type = "success") => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast = { id, message, type };
        set((state) => ({ toasts: [...state.toasts, newToast] }));
        setTimeout(() => {
          get().removeToast(id);
        }, 3200);
      },
      removeToast: (id) => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      },
    }),
    {
      name: "aurelia_commerce_state",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        wishlist: state.wishlist,
        savedPincode: state.savedPincode,
      }),
    }
  )
);
