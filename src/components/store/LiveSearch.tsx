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

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) setRecentSearches(JSON.parse(stored).slice(0, 5));
    } catch {}
  }, []);

  const saveRecent = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    try {
      const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {}
  };

  const clearRecent = () => {
    setRecentSearches([]);
    try { localStorage.removeItem(RECENT_KEY); } catch {}
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      } catch {}
      finally { setLoading(false); }
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
        <Search className="absolute left-3.5 h-4 w-4 text-[#878787] pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search for clothing, jewellery, brands…"
          className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg bg-[#f0f5ff] hover:bg-[#e8f0fe] border border-[#e0e0e0] focus:border-[#2874f0] focus:bg-white focus:outline-none transition-all placeholder:text-[#878787]"
        />
        {query ? (
          <button type="button" onClick={() => { setQuery(""); inputRef.current?.focus(); }} className="absolute right-3 p-1 text-[#878787] hover:text-[#212121]">
            <X className="h-3.5 w-3.5" />
          </button>
        ) : loading ? (
          <Loader2 className="absolute right-3.5 h-4 w-4 animate-spin text-[#878787] pointer-events-none" />
        ) : null}
      </form>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-[#e0e0e0] overflow-hidden z-50 text-left">
          {query.trim().length < 2 && (
            <div className="p-4 space-y-4">
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-[#878787] uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Recent</span>
                    <button type="button" onClick={clearRecent} className="text-[#878787] hover:text-red-600 text-[11px]">clear</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((s) => (
                      <button key={s} type="button" onClick={() => handleSelectRecent(s)} className="px-3 py-1.5 rounded-full bg-[#f1f2f4] hover:bg-[#e8f0fe] text-xs text-[#212121] transition">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#878787] uppercase tracking-wider mb-2">
                  <Flame className="h-3.5 w-3.5 text-[#fb641b]" /> Popular
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Link href="/shop?category=clothing" onClick={() => { setIsOpen(false); if (onClose) onClose(); }} className="px-3 py-1.5 rounded-full bg-[#e8f0fe] hover:bg-[#d0e1ff] text-xs font-medium text-[#2874f0]">Clothing</Link>
                  <Link href="/shop?category=jewellery" onClick={() => { setIsOpen(false); if (onClose) onClose(); }} className="px-3 py-1.5 rounded-full bg-[#fff8e1] hover:bg-[#ffecb3] text-xs font-medium text-[#e6a700]">Jewellery</Link>
                  <Link href="/shop?sort=discount" onClick={() => { setIsOpen(false); if (onClose) onClose(); }} className="px-3 py-1.5 rounded-full bg-[#fff3e0] hover:bg-[#ffe0b2] text-xs font-medium text-[#fb641b]">Offers %</Link>
                  <Link href="/shop?sort=newest" onClick={() => { setIsOpen(false); if (onClose) onClose(); }} className="px-3 py-1.5 rounded-full bg-[#f1f2f4] hover:bg-[#e0e0e0] text-xs font-medium text-[#212121]">New Arrivals</Link>
                </div>
              </div>
            </div>
          )}

          {query.trim().length >= 2 && (
            <div>
              {categories.length > 0 && (
                <div className="p-3 bg-[#f8f9fb] border-b border-[#f0f0f0] flex flex-wrap gap-2 items-center text-xs">
                  <span className="text-[#878787] font-medium">Categories:</span>
                  {categories.map((c) => (
                    <Link key={c.id} href={`/shop?category=${c.slug}`} onClick={() => { saveRecent(query); setIsOpen(false); if (onClose) onClose(); }} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#e0e0e0] text-[#212121] hover:border-[#2874f0] hover:text-[#2874f0] transition font-medium">
                      {c.name} <ArrowRight className="h-3 w-3 text-[#878787]" />
                    </Link>
                  ))}
                </div>
              )}

              {products.length > 0 ? (
                <div className="divide-y divide-[#f0f0f0] max-h-[360px] overflow-y-auto">
                  {products.map((p) => {
                    const discount = p.compareAtPrice && p.compareAtPrice > p.price ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100) : 0;
                    return (
                      <Link key={p.id} href={`/products/${p.slug}`} onClick={() => { saveRecent(query); setIsOpen(false); if (onClose) onClose(); }} className="flex items-center gap-3 p-3 hover:bg-[#f8f9fb] transition group">
                        <div className="relative h-12 w-12 rounded-lg bg-[#f8f9fb] overflow-hidden shrink-0 border border-[#f0f0f0]">
                          {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" /> : <div className="h-full w-full flex items-center justify-center text-[#878787] text-xs">No pic</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-[#212121] truncate group-hover:text-[#2874f0]">{p.name}</h4>
                          <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="text-xs font-bold text-[#212121]">{formatMoney(p.price, currency)}</span>
                            {discount > 0 && <><span className="text-[11px] text-[#878787] line-through">{formatMoney(p.compareAtPrice!, currency)}</span><span className="text-[10px] font-bold text-[#388e3c]">{discount}% off</span></>}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-[#878787] group-hover:text-[#2874f0] group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    );
                  })}
                </div>
              ) : !loading ? (
                <div className="p-6 text-center text-sm text-[#878787]">No products found for “<span className="font-semibold text-[#212121]">{query}</span>”</div>
              ) : (
                <div className="p-6 flex items-center justify-center gap-2 text-sm text-[#878787]"><Loader2 className="h-4 w-4 animate-spin" /> Searching…</div>
              )}

              <button type="button" onClick={() => handleSubmit()} className="w-full py-3 px-4 bg-[#f8f9fb] hover:bg-[#f1f2f4] text-xs font-bold text-[#2874f0] text-center border-t border-[#f0f0f0] flex items-center justify-center gap-1.5 transition">
                View all results for “{query}” <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
