import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, SearchX } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { getTenantSite, listSiteProducts, siteHref } from "@/lib/tenant-site";
import { TenantProductCard } from "@/components/store/tenant/TenantProductCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const site = await getTenantSite((await params).slug);
  return site ? { title: `Shop · ${site.name}`, description: site.tagline } : { title: "Shop" };
}

export default async function TenantShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const site = await getTenantSite(slug);
  if (!site) notFound();
  const settings = await getSettings();
  const sort = (["newest", "price-asc", "price-desc", "discount"] as const).includes(sp.sort as never) ? (sp.sort as "newest" | "price-asc" | "price-desc" | "discount") : "newest";
  const products = await listSiteProducts(site.tenant.id, { limit: 48, search: sp.q, sort });
  const base = site.basePath;

  return (
    <div className="s-container s-section">
      <Link href={siteHref(base, "/")} className="s-link s-link-back"><ArrowLeft className="h-4 w-4" /> Back home</Link>
      <div className="s-section-head">
        <div>
          <div className="s-eyebrow">The collection</div>
          <h1 className="s-h1">All products</h1>
        </div>
        <form className="s-sort" action={siteHref(base, "/shop")}>
          {sp.q ? <input type="hidden" name="q" value={sp.q} /> : null}
          <select name="sort" defaultValue={sort} className="s-input s-input-sm" aria-label="Sort products">
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="discount">Biggest discount</option>
          </select>
          <button className="s-btn s-btn-outline">Apply</button>
        </form>
      </div>

      {sp.q ? <p className="s-note s-note-inline"><SearchX className="h-4 w-4" /> Results for “{sp.q}”</p> : null}

      {products.length ? (
        <div className="s-grid-products">
          {products.map((p) => <TenantProductCard key={p.id} site={site} product={p} currency={settings.currency} />)}
        </div>
      ) : (
        <div className="s-empty">
          <h3 className="s-h3">Nothing here yet</h3>
          <p className="s-note">{sp.q ? "Try a different search." : "The collection is being curated. Check back soon."}</p>
          {sp.q ? <Link href={siteHref(base, "/shop")} className="s-btn s-btn-primary">Clear search</Link> : null}
        </div>
      )}
    </div>
  );
}
