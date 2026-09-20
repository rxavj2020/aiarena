import Link from "next/link";
import { queryProducts, listCategories } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { ProductCard } from "@/components/store/ProductCard";
import { SlidersHorizontal } from "lucide-react";

export const metadata = { title: "Shop" };

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const s = await getSettings();
  const cats = listCategories();
  const res = queryProducts({ q: sp.q, category: sp.category, sort: sp.sort, min: sp.min ? Number(sp.min) * 100 : undefined, max: sp.max ? Number(sp.max) * 100 : undefined, page: Number(sp.page || 1), tag: sp.tag });
  const activeCat = cats.find((c) => c.slug === sp.category);
  const mk = (patch: Record<string, string | undefined>) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) u.set(k, v);
    return `/shop?${u.toString()}`;
  };

  return (
    <div className="container-x py-10">
      <div className="mb-8">
        <nav className="text-xs text-gray-500 mb-2"><Link href="/">Home</Link> / <span>Shop</span>{activeCat && <> / <span>{activeCat.name}</span></>}</nav>
        <h1 className="font-display text-3xl md:text-4xl font-semibold">{sp.q ? `Results for “${sp.q}”` : activeCat?.name ?? "All products"}</h1>
        {activeCat?.description && <p className="mt-2 text-gray-600 max-w-2xl">{activeCat.description}</p>}
      </div>
      <div className="grid lg:grid-cols-[240px_1fr] gap-10">
        <aside className="space-y-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Categories</div>
            <ul className="space-y-1.5 text-sm">
              <li><Link href={mk({ category: undefined, page: undefined })} className={!sp.category ? "font-semibold" : "text-gray-600 hover:text-black"}>All</Link></li>
              {cats.filter((c) => !c.parentId).map((c) => (
                <li key={c.id}>
                  <Link href={mk({ category: c.slug, page: undefined })} className={sp.category === c.slug ? "font-semibold" : "text-gray-600 hover:text-black"}>{c.name}</Link>
                  {cats.filter((x) => x.parentId === c.id).length > 0 && (
                    <ul className="ml-3 mt-1 space-y-1">
                      {cats.filter((x) => x.parentId === c.id).map((x) => <li key={x.id}><Link href={mk({ category: x.slug })} className={sp.category === x.slug ? "font-semibold" : "text-gray-500 hover:text-black"}>{x.name}</Link></li>)}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <form className="space-y-3">
            {sp.category && <input type="hidden" name="category" value={sp.category} />}
            {sp.q && <input type="hidden" name="q" value={sp.q} />}
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Price (₹)</div>
            <div className="flex gap-2">
              <input name="min" defaultValue={sp.min} placeholder="Min" className="input" inputMode="numeric" />
              <input name="max" defaultValue={sp.max} placeholder="Max" className="input" inputMode="numeric" />
            </div>
            <button className="btn-outline w-full btn-sm"><SlidersHorizontal className="h-3.5 w-3.5" /> Apply</button>
          </form>
        </aside>
        <div>
          <div className="flex items-center justify-between mb-5 text-sm">
            <span className="text-gray-600">{res.total} products</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Sort</span>
              {[["newest", "Newest"], ["price_asc", "Price ↑"], ["price_desc", "Price ↓"], ["discount", "Discount"], ["name", "Name"]].map(([v, l]) => (
                <Link key={v} href={mk({ sort: v, page: undefined })} className={`px-2.5 py-1 rounded-md ${(sp.sort ?? "newest") === v ? "bg-gray-900 text-white" : "hover:bg-gray-100"}`}>{l}</Link>
              ))}
            </div>
          </div>
          {res.items.length === 0 ? (
            <div className="card p-16 text-center text-gray-500">No products match your filters.<br /><Link href="/shop" className="underline mt-2 inline-block">Clear filters</Link></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">{res.items.map((p) => <ProductCard key={p.id} p={p} currency={s.currency} />)}</div>
          )}
          {res.pages > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              {Array.from({ length: res.pages }, (_, i) => i + 1).map((n) => (
                <Link key={n} href={mk({ page: String(n) })} className={`h-9 w-9 flex items-center justify-center rounded-lg text-sm ${n === res.page ? "bg-gray-900 text-white" : "bg-white border hover:bg-gray-50"}`}>{n}</Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
