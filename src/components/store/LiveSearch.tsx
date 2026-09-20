"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X, Loader2, ArrowRight, Clock, Flame } from "lucide-react";
import { formatMoney } from "@/lib/format";

type SearchResultProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  images: string[];
  stock: number;
  trackStock: boolean;
};

type SearchResultCategory = {
  id: string;
  name: string;
  slug: string;
};

const RECENT_KEY = "aurelia_recent_searches";

export function LiveSearch({
  currency = "INR",
  isMobileModal = false,
  onClose,
}: {
  currency?: string;
  isMobileModal?: boolean;
  onClose?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<SearchResultProduct[]>([]);
  const [categories, setCategories] = useState<SearchResultCategory[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) setRecentSearches(JSON.parse(stored).slice(0, 5));
    } catch {
      // ignore
    }
  }, []);

  const saveRecent = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    try {
      const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const clearRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      // ignore
    }
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setProducts([]);
      setCategories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error("Search fetch failed", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    saveRecent(query);
    setIsOpen(false);
    if (onClose) onClose();
    router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
  };

  const handleSelectRecent = (term: string) => {
    setQuery(term);
    saveRecent(term);
    setIsOpen(false);
    if (onClose) onClose();
    router.push(`/shop?q=${encodeURIComponent(term)}`);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${isMobileModal ? "" : "max-w-md"}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center w-full">
        <Search className="absolute left-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search products, brands, essentials…"
          className="w-full pl-10 pr-10 py-2 text-sm rounded-full bg-gray-100/80 hover:bg-gray-100 border border-transparent focus:border-gray-900 focus:bg-white focus:outline-none transition-all"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 p-1 text-gray-400 hover:text-gray-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : loading ? (
          <Loader2 className="absolute right-3.5 h-4 w-4 animate-spin text-gray-400 pointer-events-none" />
        ) : null}
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 text-left fade-up">
          {/* Recent searches when query is empty */}
          {query.trim().length < 2 && (
            <div className="p-4 space-y-4">
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Recent Searches
                    </span>
                    <button
                      type="button"
                      onClick={clearRecent}
                      className="text-gray-400 hover:text-red-600 lowercase text-[11px]"
                    >
                      clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleSelectRecent(s)}
                        className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-xs text-gray-700 transition"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  <Flame className="h-3.5 w-3.5 text-amber-500" /> Popular Categories
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Link
                    href="/shop"
                    onClick={() => {
                      setIsOpen(false);
                      if (onClose) onClose();
                    }}
                    className="px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-xs font-medium text-amber-900 transition"
                  >
                    All Items
                  </Link>
                  <Link
                    href="/shop?sort=discount"
                    onClick={() => {
                      setIsOpen(false);
                      if (onClose) onClose();
                    }}
                    className="px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-xs font-medium text-rose-900 transition"
                  >
                    Special Offers %
                  </Link>
                  <Link
                    href="/shop?sort=newest"
                    onClick={() => {
                      setIsOpen(false);
                      if (onClose) onClose();
                    }}
                    className="px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-xs font-medium text-blue-900 transition"
                  >
                    New Arrivals
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Results when typing */}
          {query.trim().length >= 2 && (
            <div>
              {categories.length > 0 && (
                <div className="p-3 bg-gray-50/70 border-b border-gray-100 flex flex-wrap gap-2 items-center text-xs">
                  <span className="text-gray-400 font-medium">Categories:</span>
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      href={`/shop?category=${c.slug}`}
                      onClick={() => {
                        saveRecent(query);
                        setIsOpen(false);
                        if (onClose) onClose();
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-gray-200 text-gray-800 hover:border-gray-900 transition font-medium"
                    >
                      {c.name} <ArrowRight className="h-3 w-3 text-gray-400" />
                    </Link>
                  ))}
                </div>
              )}

              {products.length > 0 ? (
                <div className="divide-y divide-gray-100 max-h-[360px] overflow-y-auto">
                  {products.map((p) => {
                    const discount =
                      p.compareAtPrice && p.compareAtPrice > p.price
                        ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)
                        : 0;
                    return (
                      <Link
                        key={p.id}
                        href={`/products/${p.slug}`}
                        onClick={() => {
                          saveRecent(query);
                          setIsOpen(false);
                          if (onClose) onClose();
                        }}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 transition group"
                      >
                        <div className="relative h-12 w-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                          {p.images?.[0] ? (
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-300 text-xs">
                              No pic
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-primary">
                            {p.name}
                          </h4>
                          <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="text-xs font-semibold text-gray-900">
                              {formatMoney(p.price, currency)}
                            </span>
                            {discount > 0 && (
                              <>
                                <span className="text-[11px] text-gray-400 line-through">
                                  {formatMoney(p.compareAtPrice!, currency)}
                                </span>
                                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                                  {discount}% off
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    );
                  })}
                </div>
              ) : !loading ? (
                <div className="p-6 text-center text-sm text-gray-500">
                  No products found for &ldquo;<span className="font-semibold">{query}</span>&rdquo;
                </div>
              ) : (
                <div className="p-6 flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" /> Searching...
                </div>
              )}

              <button
                type="button"
                onClick={() => handleSubmit()}
                className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-primary text-center border-t border-gray-100 flex items-center justify-center gap-1.5 transition"
              >
                View all results for &ldquo;{query}&rdquo; <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
