"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, X, SlidersHorizontal, Check, LayoutGrid, List, Star } from "lucide-react";
import { ProductCard } from "@/components/store/ProductCard";
import type { Category, Product } from "@/lib/db/schema";

type Props = {
  categories: Category[];
  searchParams: Record<string, string | undefined>;
  activeCategory?: Category;
  products: (Product & { rating: number; reviewCount: number })[];
  currency: string;
  total: number;
  page: number;
  pages: number;
  hasActiveFilters: boolean;
};

function Collapsible({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left group">
        <span className="text-[12px] font-bold tracking-widest uppercase text-gray-900">{title}</span>
        <span className="h-6 w-6 rounded-full bg-gray-50 group-hover:bg-gray-100 flex items-center justify-center transition">
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </span>
      </button>
      {open && <div className="pb-5">{children}</div>}
    </div>
  );
}

export function ShopClient({ categories, searchParams: sp, activeCategory, products, currency, page, pages, hasActiveFilters }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopHidden, setDesktopHidden] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

  const mk = useMemo(() => {
    return (patch: Record<string, string | undefined>) => {
      const u = new URLSearchParams();
      for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) u.set(k, v);
      return `/shop?${u.toString()}`;
    };
  }, [sp]);

  return (
    <>
      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[20px] max-h-[86vh] flex flex-col animate-slide-up shadow-2xl">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-[20px]">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[#2874f0] text-white flex items-center justify-center">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>
                <span className="font-bold">Filters</span>
                {hasActiveFilters && <span className="bg-[#fb641b] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{Object.values(sp).filter(Boolean).length}</span>}
              </div>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Link href="/shop" onClick={() => setMobileOpen(false)} className="text-xs font-bold text-rose-600 px-3 py-1.5 rounded-full bg-rose-50">
                    Clear
                  </Link>
                )}
                <button onClick={() => setMobileOpen(false)} className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <FilterContent categories={categories} sp={sp} mk={mk} onLinkClick={() => setMobileOpen(false)} />
            </div>
            <div className="p-4 border-t bg-white flex gap-3">
              <Link href="/shop" className="btn-outline flex-1 justify-center rounded-full" onClick={() => setMobileOpen(false)}>
                Reset
              </Link>
              <button onClick={() => setMobileOpen(false)} className="btn-primary flex-1 justify-center rounded-full">
                Show {products.length} results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => (window.innerWidth < 1024 ? setMobileOpen(true) : setDesktopHidden(!desktopHidden))}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-semibold hover:border-[#2874f0] hover:text-[#2874f0] transition shadow-sm"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {desktopHidden ? "Show filters" : "Filters"}
            {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-[#fb641b] animate-pulse" />}
          </button>

          <div className="hidden sm:flex items-center gap-1 ml-2 bg-white border border-gray-200 rounded-full p-1">
            <button onClick={() => setView("grid")} className={`h-7 w-7 rounded-full flex items-center justify-center transition ${view === "grid" ? "bg-[#2874f0] text-white" : "text-gray-500 hover:text-gray-900"}`}>
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setView("list")} className={`h-7 w-7 rounded-full flex items-center justify-center transition ${view === "list" ? "bg-[#2874f0] text-white" : "text-gray-500 hover:text-gray-900"}`}>
              <List className="h-3.5 w-3.5" />
            </button>
          </div>

          {hasActiveFilters && (
            <Link href="/shop" className="hidden sm:inline-flex text-xs font-semibold text-gray-600 hover:text-gray-900 ml-2">
              Clear all filters
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 text-xs">
            <span className="text-gray-500 font-medium mr-1">Sort:</span>
            {[
              ["newest", "Newest"],
              ["price_asc", "Low → High"],
              ["price_desc", "High → Low"],
              ["discount", "Best discount"],
            ].map(([v, l]) => (
              <Link
                key={v}
                href={mk({ sort: v, page: undefined })}
                className={`px-3.5 py-2 rounded-full font-semibold transition whitespace-nowrap ${ (sp.sort ?? "newest") === v ? "bg-[#2874f0] text-white shadow-sm" : "bg-white border border-gray-200 text-gray-700 hover:border-[#2874f0] hover:text-[#2874f0]" }`}
              >
                {l}
              </Link>
            ))}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <select
              value={sp.sort ?? "newest"}
              onChange={(e) => (window.location.href = mk({ sort: e.target.value, page: undefined }))}
              className="rounded-full border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="discount">Discount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active chips */}
      {hasActiveFilters && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {sp.q && (
            <Link href={mk({ q: undefined, page: undefined })} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-3 py-1.5 text-xs font-medium hover:border-[#2874f0]">
              Search: {sp.q} <X className="h-3 w-3" />
            </Link>
          )}
          {sp.category && activeCategory && (
            <Link href={mk({ category: undefined, page: undefined })} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-3 py-1.5 text-xs font-medium hover:border-[#2874f0]">
              {activeCategory.name} <X className="h-3 w-3" />
            </Link>
          )}
          {sp.inStock === "1" && (
            <Link href={mk({ inStock: undefined, page: undefined })} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-3 py-1.5 text-xs font-medium hover:border-[#2874f0]">
              In stock <X className="h-3 w-3" />
            </Link>
          )}
          {sp.rating && (
            <Link href={mk({ rating: undefined, page: undefined })} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-3 py-1.5 text-xs font-medium hover:border-[#2874f0]">
              {sp.rating}★ & above <X className="h-3 w-3" />
            </Link>
          )}
          {sp.discount && (
            <Link href={mk({ discount: undefined, page: undefined })} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-3 py-1.5 text-xs font-medium hover:border-[#2874f0]">
              {sp.discount}% off <X className="h-3 w-3" />
            </Link>
          )}
          {(sp.min || sp.max) && (
            <Link href={mk({ min: undefined, max: undefined, page: undefined })} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-3 py-1.5 text-xs font-medium hover:border-[#2874f0]">
              ₹{sp.min || "0"} - ₹{sp.max || "∞"} <X className="h-3 w-3" />
            </Link>
          )}
        </div>
      )}

      <div className={`grid gap-6 ${desktopHidden ? "grid-cols-1" : "lg:grid-cols-[300px_1fr]"}`}>
        {/* Sidebar */}
        <aside className={`${desktopHidden ? "hidden" : "hidden lg:block"} shrink-0`}>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden sticky top-[88px] shadow-sm">
            <div className="p-4 border-b bg-[#f8f9fb] flex items-center justify-between">
              <span className="font-bold text-sm tracking-wide">FILTERS</span>
              {hasActiveFilters && (
                <Link href="/shop" className="text-xs font-bold text-[#2874f0] hover:underline">
                  CLEAR ALL
                </Link>
              )}
            </div>
            <div className="px-4">
              <FilterContent categories={categories} sp={sp} mk={mk} />
            </div>
          </div>
        </aside>

        {/* Products */}
        <div className="min-w-0">
          {products.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 sm:p-16 text-center">
              <div className="mx-auto h-20 w-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                <SlidersHorizontal className="h-8 w-8 text-gray-300" />
              </div>
              <div className="font-bold text-gray-900">No products found</div>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">We couldn&apos;t find anything matching your filters. Try adjusting or clearing them.</p>
              <Link href="/shop" className="btn-primary mt-5 rounded-full">Clear all filters</Link>
            </div>
          ) : (
            <>
              <div className={view === "grid" ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4" : "grid grid-cols-1 gap-3"}>
                {products.map((p) => (
                  <ProductCard key={p.id} p={p} currency={currency} variant={view === "list" ? "list" : "default"} />
                ))}
              </div>

              {pages > 1 && (
                <div className="mt-10 flex flex-wrap justify-center items-center gap-1.5">
                  <Link
                    href={mk({ page: String(Math.max(1, page - 1)) })}
                    className={`h-9 px-4 flex items-center justify-center rounded-full text-xs font-semibold border transition ${page === 1 ? "opacity-40 pointer-events-none bg-white border-gray-200" : "bg-white border-gray-200 hover:border-[#2874f0]"}`}
                  >
                    Previous
                  </Link>
                  {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                    let n = i + 1;
                    if (pages > 7) {
                      if (page <= 4) n = i + 1;
                      else if (page >= pages - 3) n = pages - 6 + i;
                      else n = page - 3 + i;
                    }
                    return (
                      <Link
                        key={n}
                        href={mk({ page: String(n) })}
                        className={`h-9 w-9 flex items-center justify-center rounded-full text-xs font-bold transition ${n === page ? "bg-[#2874f0] text-white shadow-sm" : "bg-white border border-gray-200 text-gray-700 hover:border-[#2874f0]"}`}
                      >
                        {n}
                      </Link>
                    );
                  })}
                  <Link
                    href={mk({ page: String(Math.min(pages, page + 1)) })}
                    className={`h-9 px-4 flex items-center justify-center rounded-full text-xs font-semibold border transition ${page === pages ? "opacity-40 pointer-events-none bg-white border-gray-200" : "bg-white border-gray-200 hover:border-[#2874f0]"}`}
                  >
                    Next
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile floating filter */}
      <div className="lg:hidden fixed bottom-[84px] left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        <button onClick={() => setMobileOpen(true)} className="bg-[#2874f0] text-white rounded-full pl-4 pr-5 py-3 shadow-[0_8px_24px_rgba(40,116,240,0.3)] flex items-center gap-2 text-sm font-bold">
          <SlidersHorizontal className="h-4 w-4" /> Filters
          {hasActiveFilters && <span className="bg-[#fb641b] text-white text-[10px] font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">{Object.values(sp).filter(Boolean).length}</span>}
        </button>
        <div className="bg-white border border-gray-200 rounded-full p-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)] flex items-center gap-1">
          <button onClick={() => setView("grid")} className={`h-8 w-8 rounded-full flex items-center justify-center ${view === "grid" ? "bg-[#2874f0] text-white" : "text-gray-500"}`}>
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button onClick={() => setView("list")} className={`h-8 w-8 rounded-full flex items-center justify-center ${view === "list" ? "bg-[#2874f0] text-white" : "text-gray-500"}`}>
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}

function FilterContent({
  categories,
  sp,
  mk,
  onLinkClick,
}: {
  categories: Category[];
  sp: Record<string, string | undefined>;
  mk: (patch: Record<string, string | undefined>) => string;
  onLinkClick?: () => void;
}) {
  return (
    <div>
      <Collapsible title="Categories" defaultOpen={true}>
        <ul className="space-y-1 text-sm">
          <li>
            <Link
              href={mk({ category: undefined, page: undefined })}
              onClick={onLinkClick}
              className={`flex items-center justify-between py-2 px-2.5 rounded-lg transition ${!sp.category ? "bg-[#2874f0] text-white font-semibold" : "hover:bg-gray-50 text-gray-700"}`}
            >
              All Categories
            </Link>
          </li>
          {categories
            .filter((c) => !c.parentId)
            .map((c) => {
              const children = categories.filter((x) => x.parentId === c.id);
              const isActive = sp.category === c.slug;
              return (
                <li key={c.id}>
                  <Link
                    href={mk({ category: c.slug, page: undefined })}
                    onClick={onLinkClick}
                    className={`flex items-center justify-between py-2 px-2.5 rounded-lg transition ${isActive ? "bg-blue-50 font-semibold text-[#2874f0]" : "hover:bg-gray-50 text-gray-600"}`}
                  >
                    <span className="flex items-center gap-2">
                      {c.image && <img src={c.image} alt="" className="h-5 w-5 rounded object-cover" />}
                      {c.name}
                    </span>
                    {isActive && <Check className="h-4 w-4" />}
                  </Link>
                  {children.length > 0 && isActive && (
                    <ul className="ml-4 mt-1 space-y-1 border-l border-gray-100 pl-3">
                      {children.map((ch) => (
                        <li key={ch.id}>
                          <Link
                            href={mk({ category: ch.slug, page: undefined })}
                            onClick={onLinkClick}
                            className={`block py-1.5 text-xs rounded-lg px-2.5 ${sp.category === ch.slug ? "bg-[#2874f0] text-white font-medium" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
                          >
                            {ch.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
        </ul>
      </Collapsible>

      <Collapsible title="Availability" defaultOpen={true}>
        <Link href={mk({ inStock: sp.inStock === "1" ? undefined : "1", page: undefined })} onClick={onLinkClick} className="flex items-center gap-3 py-2 group">
          <span className={`h-5 w-5 rounded border-2 flex items-center justify-center transition ${sp.inStock === "1" ? "bg-[#2874f0] border-[#2874f0] text-white" : "border-gray-300 bg-white group-hover:border-gray-400"}`}>
            {sp.inStock === "1" && <Check className="h-3 w-3" />}
          </span>
          <span className={`text-sm ${sp.inStock === "1" ? "font-semibold text-gray-900" : "text-gray-600"}`}>Exclude out of stock</span>
        </Link>
      </Collapsible>

      <Collapsible title="Customer Ratings" defaultOpen={true}>
        <div className="space-y-1">
          {[4, 3].map((stars) => {
            const active = sp.rating === String(stars);
            return (
              <Link
                key={stars}
                href={mk({ rating: active ? undefined : String(stars), page: undefined })}
                onClick={onLinkClick}
                className={`flex items-center gap-3 py-2 px-2.5 rounded-lg transition ${active ? "bg-blue-50" : "hover:bg-gray-50"}`}
              >
                <span className={`h-5 w-5 rounded border-2 flex items-center justify-center transition ${active ? "bg-[#2874f0] border-[#2874f0] text-white" : "border-gray-300 bg-white"}`}>
                  {active && <Check className="h-3 w-3" />}
                </span>
                <span className="flex items-center gap-1 text-sm">
                  <span className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < stars ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                    ))}
                  </span>
                  <span className={active ? "font-semibold" : "text-gray-600"}>& above</span>
                </span>
              </Link>
            );
          })}
        </div>
      </Collapsible>

      <Collapsible title="Discount" defaultOpen={false}>
        <div className="space-y-1">
          {[
            { v: "50", l: "50% or more" },
            { v: "30", l: "30% or more" },
            { v: "20", l: "20% or more" },
            { v: "10", l: "10% or more" },
          ].map((d) => {
            const active = sp.discount === d.v;
            return (
              <Link
                key={d.v}
                href={mk({ discount: active ? undefined : d.v, page: undefined })}
                onClick={onLinkClick}
                className={`flex items-center gap-3 py-2 px-2.5 rounded-lg transition ${active ? "bg-blue-50" : "hover:bg-gray-50"}`}
              >
                <span className={`h-5 w-5 rounded border-2 flex items-center justify-center transition ${active ? "bg-[#2874f0] border-[#2874f0] text-white" : "border-gray-300 bg-white"}`}>
                  {active && <Check className="h-3 w-3" />}
                </span>
                <span className={`text-sm ${active ? "font-semibold" : "text-gray-600"}`}>{d.l}</span>
              </Link>
            );
          })}
        </div>
      </Collapsible>

      <Collapsible title="Price Range" defaultOpen={true}>
        <form className="space-y-3">
          {sp.category && <input type="hidden" name="category" value={sp.category} />}
          {sp.q && <input type="hidden" name="q" value={sp.q} />}
          {sp.sort && <input type="hidden" name="sort" value={sp.sort} />}
          {sp.inStock && <input type="hidden" name="inStock" value={sp.inStock} />}
          {sp.rating && <input type="hidden" name="rating" value={sp.rating} />}
          {sp.discount && <input type="hidden" name="discount" value={sp.discount} />}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-wide">Min</label>
              <input name="min" defaultValue={sp.min} placeholder="₹0" className="input input-sm mt-1 rounded-full" inputMode="numeric" />
            </div>
            <div className="flex-1">
              <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-wide">Max</label>
              <input name="max" defaultValue={sp.max} placeholder="₹Max" className="input input-sm mt-1 rounded-full" inputMode="numeric" />
            </div>
          </div>
          <button className="btn-primary btn-sm w-full rounded-full bg-[#2874f0]">Apply</button>
        </form>
      </Collapsible>
    </div>
  );
}
