"use client";

import { useStore, WishlistItem } from "@/lib/store/useStore";
import { Heart } from "lucide-react";
import { useState, useEffect } from "react";

export function WishlistButton({
  item,
  className = "",
  size = "md",
  showText = false,
}: {
  item: WishlistItem;
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}) {
  const { toggleWishlist, isInWishlist } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const active = mounted ? isInWishlist(item.id) : false;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(item);
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      className={`group transition-transform active:scale-90 flex items-center gap-1.5 ${
        showText
          ? "border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
          : "rounded-full p-2 bg-white/90 backdrop-blur shadow-sm hover:bg-white text-gray-700"
      } ${className}`}
    >
      <Heart
        className={`${iconSizes[size]} transition-colors duration-200 ${
          active
            ? "fill-rose-500 text-rose-500"
            : "text-gray-500 group-hover:text-rose-500"
        }`}
      />
      {showText && (
        <span className={active ? "text-rose-600 font-medium" : "text-gray-700"}>
          {active ? "Wishlisted" : "Add to Wishlist"}
        </span>
      )}
    </button>
  );
}
