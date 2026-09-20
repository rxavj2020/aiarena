"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, X, SlidersHorizontal, Check } from "lucide-react";
import type { Category } from "@/lib/db/schema";

type Props = {
  categories: Category[];
  searchParams: Record<string, string | undefined>;
  mk: (patch: Record<string, string | undefined>) => string;
  hasActiveFilters: boolean;
  activeCategory?: Category;
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
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <span className="text-[13px] font-bold tracking-wide uppercase text-gray-900">{title}</span>
        <span className="h-6 w-6 rounded-full bg-gray-50 group-hover:bg-gray-100 flex items-center justify-center transition">
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </span>
      </button>
      {open && <div className="pb-5">{children}</div>}
    </div>
  );
}

export function ShopFilters({ categories, searchParams: sp, mk, hasActiveFilters, activeCategory }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  return (
    <>
      {/* Mobile filter drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[20px] max-h-[85vh] flex flex-col animate-slide-up">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-[20px]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="font-semibold">Filters</span>
                {hasActiveFilters && <span className="bg-gray-900 text-white text-xs px-2 py-0.5 rounded-full">Active</span>}
              </div>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Link href="/shop" onClick={() => setMobileOpen(false)} className="text-xs font-semibold text-rose-600">
                    Clear all
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
            <div className="p-4 border-t bg-white">
              <button onClick={() => setMobileOpen(false)} className="btn-primary w-full">
                Show results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar - Sort + View + Filter toggle */}
      <div className="flex items-center justify-between gap-3 mb-4 lg:mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => (window.innerWidth < 1024 ? setMobileOpen(true) : setDesktopCollapsed(!desktopCollapsed))}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium hover:border-gray-900 hover:bg-gray-50 transition lg:px-3.5"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            <span className="sm:hidden">Filter</span>
            {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-[#ff6b00] animate-pulse" />}
          </button>

          {hasActiveFilters && (
            <Link href="/shop" className="hidden sm:inline-flex text-xs font-medium text-gray-500 hover:text-gray-900">
              Clear all
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sort - Flipkart style pills on mobile, dropdown on desktop */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <span className="text-gray-500 font-medium mr-1 hidden lg:inline">Sort:</span>
            {[
              ["newest", "Newest"],
              ["price_asc", "Price ↑"],
              ["price_desc", "Price ↓"],
              ["discount", "Discount"],
            ].map(([v, l]) => (
              <Link
                key={v}
                href={mk({ sort: v, page: undefined })}
                className={`px-3 py-1.5 rounded-full font-medium transition whitespace-nowrap ${
                  (sp.sort ?? "newest") === v ? "bg-gray-900 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-700 hover:border-gray-900"
                }`}
              >
                {l}
              </Link>
            ))}
          </div>

          {/* Mobile sort select */}
          <div className="sm:hidden">
            <select
              value={sp.sort ?? "newest"}
              onChange={(e) => {
                window.location.href = mk({ sort: e.target.value, page: undefined });
              }}
              className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-medium"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="discount">Discount</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {sp.q && (
            <Link href={mk({ q: undefined, page: undefined })} className="filter-chip-light">
              Search: {sp.q} <X className="h-3 w-3" />
            </Link>
          )}
          {sp.category && activeCategory && (
            <Link href={mk({ category: undefined, page: undefined })} className="filter-chip-light">
              {activeCategory.name} <X className="h-3 w-3" />
            </Link>
          )}
          {sp.inStock === "1" && (
            <Link href={mk({ inStock: undefined, page: undefined })} className="filter-chip-light">
              In stock <X className="h-3 w-3" />
            </Link>
          )}
          {sp.rating && (
            <Link href={mk({ rating: undefined, page: undefined })} className="filter-chip-light">
              {sp.rating}★ & above <X className="h-3 w-3" />
            </Link>
          )}
          {sp.discount && (
            <Link href={mk({ discount: undefined, page: undefined })} className="filter-chip-light">
              {sp.discount}% off <X className="h-3 w-3" />
            </Link>
          )}
          {(sp.min || sp.max) && (
            <Link href={mk({ min: undefined, max: undefined, page: undefined })} className="filter-chip-light">
              ₹{sp.min || "0"} - ₹{sp.max || "∞"} <X className="h-3 w-3" />
            </Link>
          )}
        </div>
      )}

      <div className={`grid gap-6 lg:gap-8 ${desktopCollapsed ? "lg:grid-cols-1" : "lg:grid-cols-[280px_1fr]"}`}>
        {/* Sidebar - collapsible like Flipkart minimal */}
        <aside className={`${desktopCollapsed ? "hidden lg:hidden" : "hidden lg:block"} shrink-0`}>
          <div className="card-flat p-0 overflow-hidden sticky top-[88px]">
            <div className="p-4 border-b bg-gray-50/50 flex items-center justify-between">
              <span className="font-bold text-sm">Filters</span>
              {hasActiveFilters && (
                <Link href="/shop" className="text-xs font-semibold text-[#2874f0] hover:underline">
                  Clear all
                </Link>
              )}
            </div>
            <div className="px-4">
              <FilterContent categories={categories} sp={sp} mk={mk} />
            </div>
          </div>
        </aside>

        {/* This is placeholder for product grid - actual grid rendered by parent via children */}
        <div id="shop-products-slot" className="min-w-0" />
      </div>

      {/* Floating filter button for mobile - Flipkart style */}
      <div className="lg:hidden fixed bottom-[88px] left-1/2 -translate-x-1/2 z-30">
        <button
          onClick={() => setMobileOpen(true)}
          className="bg-gray-900 text-white rounded-full px-5 py-3 shadow-xl flex items-center gap-2 text-sm font-semibold"
        >
          <SlidersHorizontal className="h-4 w-4" /> Filters {hasActiveFilters && <span className="bg-white text-gray-900 text-xs px-1.5 py-0.5 rounded-full">•</span>}
        </button>
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
      {/* Categories - collapsible */}
      <Collapsible title="Categories" defaultOpen={true}>
        <ul className="space-y-1 text-sm">
          <li>
            <Link
              href={mk({ category: undefined, page: undefined })}
              onClick={onLinkClick}
              className={`flex items-center justify-between py-1.5 px-2 rounded-lg transition ${!sp.category ? "bg-gray-900 text-white font-semibold" : "hover:bg-gray-50 text-gray-700"}`}
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
                    className={`flex items-center justify-between py-1.5 px-2 rounded-lg transition ${isActive ? "bg-gray-100 font-semibold text-gray-900" : "hover:bg-gray-50 text-gray-600"}`}
                  >
                    <span className="flex items-center gap-2">
                      {c.image && <img src={c.image} alt="" className="h-5 w-5 rounded object-cover" />}
                      {c.name}
                    </span>
                    {isActive && <Check className="h-3.5 w-3.5" />}
                  </Link>
                  {children.length > 0 && (
                    <ul className="ml-4 mt-1 space-y-1 border-l border-gray-100 pl-3">
                      {children.map((ch) => (
                        <li key={ch.id}>
                          <Link
                            href={mk({ category: ch.slug, page: undefined })}
                            onClick={onLinkClick}
                            className={`block py-1 text-xs rounded px-2 ${sp.category === ch.slug ? "bg-gray-900 text-white font-medium" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
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

      {/* Availability */}
      <Collapsible title="Availability" defaultOpen={true}>
        <Link
          href={mk({ inStock: sp.inStock === "1" ? undefined : "1", page: undefined })}
          onClick={onLinkClick}
          className="flex items-center gap-3 py-1.5 group"
        >
          <span
            className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition ${sp.inStock === "1" ? "bg-gray-900 border-gray-900 text-white" : "border-gray-300 bg-white group-hover:border-gray-400"}`}
          >
            {sp.inStock === "1" && <Check className="h-3 w-3" />}
          </span>
          <span className={`text-sm ${sp.inStock === "1" ? "font-semibold text-gray-900" : "text-gray-600"}`}>In stock only</span>
        </Link>
      </Collapsible>

      {/* Rating */}
      <Collapsible title="Customer Ratings" defaultOpen={true}>
        <div className="space-y-2">
          {[4, 3].map((stars) => {
            const active = sp.rating === String(stars);
            return (
              <Link
                key={stars}
                href={mk({ rating: active ? undefined : String(stars), page: undefined })}
                onClick={onLinkClick}
                className={`flex items-center gap-3 py-1.5 px-2 rounded-lg transition ${active ? "bg-gray-50" : "hover:bg-gray-50"}`}
              >
                <span className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition ${active ? "bg-gray-900 border-gray-900 text-white" : "border-gray-300 bg-white"}`}>
                  {active && <Check className="h-3 w-3" />}
                </span>
                <span className="flex items-center gap-1 text-sm">
                  <span className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={`text-[13px] ${i < stars ? "text-amber-500" : "text-gray-200"}`}>★</span>
                    ))}
                  </span>
                  <span className={active ? "font-semibold" : "text-gray-600"}>& above</span>
                </span>
              </Link>
            );
          })}
        </div>
      </Collapsible>

      {/* Discount */}
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
                className={`flex items-center gap-3 py-1.5 px-2 rounded-lg transition ${active ? "bg-gray-50" : "hover:bg-gray-50"}`}
              >
                <span className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition ${active ? "bg-gray-900 border-gray-900 text-white" : "border-gray-300 bg-white"}`}>
                  {active && <Check className="h-3 w-3" />}
                </span>
                <span className={`text-sm ${active ? "font-semibold" : "text-gray-600"}`}>{d.l}</span>
              </Link>
            );
          })}
        </div>
      </Collapsible>

      {/* Price */}
      <Collapsible title="Price Range" defaultOpen={true}>
        <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
          {sp.category && <input type="hidden" name="category" value={sp.category} />}
          {sp.q && <input type="hidden" name="q" value={sp.q} />}
          {sp.sort && <input type="hidden" name="sort" value={sp.sort} />}
          {sp.inStock && <input type="hidden" name="inStock" value={sp.inStock} />}
          {sp.rating && <input type="hidden" name="rating" value={sp.rating} />}
          {sp.discount && <input type="hidden" name="discount" value={sp.discount} />}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[11px] text-gray-500 font-medium">Min</label>
              <input name="min" defaultValue={sp.min} placeholder="₹0" className="input input-sm mt-1" inputMode="numeric" />
            </div>
            <div className="flex-1">
              <label className="text-[11px] text-gray-500 font-medium">Max</label>
              <input name="max" defaultValue={sp.max} placeholder="₹Max" className="input input-sm mt-1" inputMode="numeric" />
            </div>
          </div>
          <button className="btn-primary btn-sm w-full rounded-full">Apply Price</button>
        </form>
      </Collapsible>
    </div>
  );
}
