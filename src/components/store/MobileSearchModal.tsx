"use client";

import { useStore } from "@/lib/store/useStore";
import { LiveSearch } from "./LiveSearch";
import { X } from "lucide-react";

export function MobileSearchModal({ currency }: { currency: string }) {
  const { isSearchOpen, closeSearch } = useStore();

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1">
          <LiveSearch currency={currency} isMobileModal onClose={closeSearch} />
        </div>
        <button
          type="button"
          onClick={closeSearch}
          className="p-2 text-gray-500 hover:text-gray-900"
          aria-label="Close search"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
