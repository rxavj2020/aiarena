import Link from "next/link";
import { queryProducts, listCategories } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { ProductCard } from "@/components/store/ProductCard";
import { SlidersHorizontal, Star, X, Check } from "lucide-react";

export const metadata = { title: "Shop All Products" };

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const s = await getSettings();
  const cats = listCategories();

  const minRating = sp.rating ? Number(sp.rating) : undefined;
  const minDiscount = sp.discount ? Number(sp.discount) : undefined;
  const inStock = sp.inStock === "1";

  const res = queryProducts({
    q: sp.q,
    category: sp.category,
    sort: sp.sort,
    min: sp.min ? Number(sp.min) * 100 : undefined,
    max: sp.max ? Number(sp.max) * 100 : undefined,
    page: Number(sp.page || 1),
    tag: sp.tag,
    inStock,
    minDiscount,
    minRating,
  });

  const activeCat = cats.find((c) => c.slug === sp.category);

  const mk = (patch: Record<string, string | undefined>) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) u.set(k, v);
    return `/shop?${u.toString()}`;
  };

  const hasActiveFilters = Boolean(
    sp.category || sp.q || sp.min || sp.max || sp.rating || sp.discount || sp.inStock
  );

  return (
    <div className="container-x py-8 md:py-10">
      {/* Header & Breadcrumbs */}
      <div className="mb-6">
        <nav className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
          <Link href="/" className="hover:text-black">
            Home
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-black">
            Shop
          </Link>
          {activeCat && (
            <>
              <span>/</span>
              <span className="text-gray-900 font-medium">{activeCat.name}</span>
            </>
          )}
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h1 className="font-display text-2xl md:text-4xl font-semibold text-gray-900">
            {sp.q ? `Results for “${sp.q}”` : activeCat?.name ?? "All Products"}
          </h1>
          <span className="text-xs text-gray-500 font-medium">
            Showing {res.items.length} of {res.total} items
          </span>
        </div>
        {activeCat?.description && (
          <p className="mt-1 text-sm text-gray-600 max-w-2xl">{activeCat.description}</p>
        )}
      </div>

      {/* Active Filter Chips (Amazon / Flipkart standard) */}
      {hasActiveFilters && (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-gray-500 font-medium mr-1">Active filters:</span>
          {sp.q && (
            <Link
              href={mk({ q: undefined, page: undefined })}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition"
            >
              Search: {sp.q} <X className="h-3 w-3" />
            </Link>
          )}
          {sp.category && activeCat && (
            <Link
              href={mk({ category: undefined, page: undefined })}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition"
            >
              Category: {activeCat.name} <X className="h-3 w-3" />
            </Link>
          )}
          {sp.inStock === "1" && (
            <Link
              href={mk({ inStock: undefined, page: undefined })}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition"
            >
              In Stock Only <X className="h-3 w-3" />
            </Link>
          )}
          {sp.rating && (
            <Link
              href={mk({ rating: undefined, page: undefined })}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition"
            >
              {sp.rating}★ & above <X className="h-3 w-3" />
            </Link>
          )}
          {sp.discount && (
            <Link
              href={mk({ discount: undefined, page: undefined })}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition"
            >
              {sp.discount}% or more off <X className="h-3 w-3" />
            </Link>
          )}
          {(sp.min || sp.max) && (
            <Link
              href={mk({ min: undefined, max: undefined, page: undefined })}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition"
            >
              Price: ₹{sp.min || "0"} - ₹{sp.max || "Any"} <X className="h-3 w-3" />
            </Link>
          )}
          <Link
            href="/shop"
            className="text-rose-600 hover:underline font-semibold ml-2 text-xs"
          >
            Clear All
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-[240px_1fr] gap-8 lg:gap-10">
        {/* Filter Sidebar */}
        <aside className="space-y-6">
          {/* Categories */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3">
              Categories
            </div>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link
                  href={mk({ category: undefined, page: undefined })}
                  className={`block py-0.5 ${
                    !sp.category ? "font-bold text-primary" : "text-gray-600 hover:text-black"
                  }`}
                >
                  All Categories
                </Link>
              </li>
              {cats
                .filter((c) => !c.parentId)
                .map((c) => (
                  <li key={c.id}>
                    <Link
                      href={mk({ category: c.slug, page: undefined })}
                      className={`block py-0.5 ${
                        sp.category === c.slug
                          ? "font-bold text-primary"
                          : "text-gray-600 hover:text-black"
                      }`}
                    >
                      {c.name}
                    </Link>
                    {cats.filter((x) => x.parentId === c.id).length > 0 && (
                      <ul className="ml-3 mt-1 space-y-1">
                        {cats
                          .filter((x) => x.parentId === c.id)
                          .map((x) => (
                            <li key={x.id}>
                              <Link
                                href={mk({ category: x.slug, page: undefined })}
                                className={`block py-0.5 text-xs ${
                                  sp.category === x.slug
                                    ? "font-bold text-primary"
                                    : "text-gray-500 hover:text-black"
                                }`}
                              >
                                {x.name}
                              </Link>
                            </li>
                          ))}
                      </ul>
                    )}
                  </li>
                ))}
            </ul>
          </div>

          {/* Availability (In-Stock Only) */}
          <div className="pt-4 border-t border-gray-200">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3">
              Availability
            </div>
            <Link
              href={mk({ inStock: sp.inStock === "1" ? undefined : "1", page: undefined })}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-black cursor-pointer"
            >
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  sp.inStock === "1"
                    ? "bg-primary border-primary text-white"
                    : "border-gray-300 bg-white"
                }`}
              >
                {sp.inStock === "1" && <Check className="h-3 w-3" />}
              </span>
              <span>Exclude Out of Stock</span>
            </Link>
          </div>

          {/* Customer Rating Filter (Flipkart / Amazon standard) */}
          <div className="pt-4 border-t border-gray-200">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3">
              Customer Rating
            </div>
            <div className="space-y-1.5 text-sm">
              {[4, 3].map((stars) => (
                <Link
                  key={stars}
                  href={mk({ rating: sp.rating === String(stars) ? undefined : String(stars), page: undefined })}
                  className={`flex items-center gap-2 text-xs py-1 transition ${
                    sp.rating === String(stars) ? "font-bold text-primary" : "text-gray-600 hover:text-black"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      sp.rating === String(stars)
                        ? "bg-primary border-primary text-white"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {sp.rating === String(stars) && <Check className="h-3 w-3" />}
                  </span>
                  <span className="flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < stars ? "fill-amber-400 text-amber-400" : "text-gray-200"
                        }`}
                      />
                    ))}
                  </span>
                  <span>& above</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Discount Percentage Filter */}
          <div className="pt-4 border-t border-gray-200">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3">
              Discount
            </div>
            <div className="space-y-1.5 text-xs text-gray-700">
              {[
                { val: "50", label: "50% or more" },
                { val: "30", label: "30% or more" },
                { val: "10", label: "10% or more" },
              ].map((d) => (
                <Link
                  key={d.val}
                  href={mk({ discount: sp.discount === d.val ? undefined : d.val, page: undefined })}
                  className={`flex items-center gap-2 py-1 transition ${
                    sp.discount === d.val ? "font-bold text-primary" : "text-gray-600 hover:text-black"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      sp.discount === d.val
                        ? "bg-primary border-primary text-white"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {sp.discount === d.val && <Check className="h-3 w-3" />}
                  </span>
                  <span>{d.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="pt-4 border-t border-gray-200">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3">
              Price (₹)
            </div>
            <form className="space-y-2.5">
              {sp.category && <input type="hidden" name="category" value={sp.category} />}
              {sp.q && <input type="hidden" name="q" value={sp.q} />}
              {sp.sort && <input type="hidden" name="sort" value={sp.sort} />}
              {sp.inStock && <input type="hidden" name="inStock" value={sp.inStock} />}
              {sp.rating && <input type="hidden" name="rating" value={sp.rating} />}
              {sp.discount && <input type="hidden" name="discount" value={sp.discount} />}
              <div className="flex gap-2">
                <input
                  name="min"
                  defaultValue={sp.min}
                  placeholder="Min ₹"
                  className="input text-xs py-1.5"
                  inputMode="numeric"
                />
                <input
                  name="max"
                  defaultValue={sp.max}
                  placeholder="Max ₹"
                  className="input text-xs py-1.5"
                  inputMode="numeric"
                />
              </div>
              <button className="btn-outline w-full text-xs py-1.5">
                <SlidersHorizontal className="h-3 w-3" /> Apply Price
              </button>
            </form>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div>
          {/* Sorting Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100 text-xs">
            <span className="text-gray-500 font-medium">
              Sort by:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                ["newest", "Newest"],
                ["price_asc", "Price: Low to High"],
                ["price_desc", "Price: High to Low"],
                ["discount", "Discount %"],
                ["name", "Name"],
              ].map(([v, l]) => (
                <Link
                  key={v}
                  href={mk({ sort: v, page: undefined })}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    (sp.sort ?? "newest") === v
                      ? "bg-gray-900 text-white shadow-xs"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {l}
                </Link>
              ))}
            </div>
          </div>

          {/* Product Items */}
          {res.items.length === 0 ? (
            <div className="card p-16 text-center text-gray-500 space-y-3">
              <div className="text-base font-semibold text-gray-900">
                No products match your active filters
              </div>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Try clearing some filters or search for something else to see more products.
              </p>
              <Link href="/shop" className="btn-primary inline-flex text-xs mt-3">
                Reset All Filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {res.items.map((p) => (
                <ProductCard key={p.id} p={p} currency={s.currency} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {res.pages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-1.5">
              {Array.from({ length: res.pages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={mk({ page: String(n) })}
                  className={`h-9 w-9 flex items-center justify-center rounded-lg text-xs font-semibold transition ${
                    n === res.page
                      ? "bg-gray-900 text-white"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {n}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
