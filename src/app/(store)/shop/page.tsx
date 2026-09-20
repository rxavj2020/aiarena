import Link from "next/link";
import { queryProducts, listCategories } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { ShopClient } from "./ShopClient";

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
    perPage: 20,
    tag: sp.tag,
    inStock,
    minDiscount,
    minRating,
  });

  const activeCat = cats.find((c) => c.slug === sp.category);

  return (
    <div className="bg-[#f1f2f4] min-h-screen">
      <div className="container-x py-4 sm:py-6">
        {/* Breadcrumbs + Header */}
        <div className="flex flex-col gap-4 mb-6">
          <nav className="flex items-center gap-1.5 text-[11px] text-gray-500 overflow-x-auto no-scrollbar">
            <Link href="/" className="hover:text-gray-900 shrink-0">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-gray-900 shrink-0">Shop</Link>
            {activeCat && (
              <>
                <span>/</span>
                <span className="text-gray-900 font-medium truncate">{activeCat.name}</span>
              </>
            )}
            {sp.q && (
              <>
                <span>/</span>
                <span className="text-gray-900 font-medium">Search: {sp.q}</span>
              </>
            )}
          </nav>

          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                {sp.q ? `Search results for "${sp.q}"` : activeCat?.name ?? "All Products"}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-gray-500">
                  {res.total} {res.total === 1 ? "item" : "items"} found
                </span>
                {activeCat?.description && (
                  <span className="hidden sm:inline text-xs text-gray-400 truncate max-w-[400px]">· {activeCat.description}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="hidden sm:inline-flex items-center gap-1.5 bg-blue-50 text-[#2874f0] px-2.5 py-1 rounded-full font-medium border border-blue-100">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2874f0] animate-pulse" /> Flipkart Assured
              </span>
              <span className="inline-flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-full font-medium border">
                Page {res.page} of {res.pages || 1}
              </span>
            </div>
          </div>
        </div>

        <ShopClient
          categories={cats}
          searchParams={sp}
          activeCategory={activeCat}
          products={res.items}
          currency={s.currency}
          total={res.total}
          page={res.page}
          pages={res.pages}
          hasActiveFilters={Boolean(sp.category || sp.q || sp.min || sp.max || sp.rating || sp.discount || sp.inStock)}
        />
      </div>
    </div>
  );
}
