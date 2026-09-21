import { notFound, redirect } from "next/navigation";
import { getSettings } from "@/lib/settings";
import { computeTotals, readCart, resolveCart } from "@/lib/cart";
import { getTenantSite, siteHref } from "@/lib/tenant-site";
import { TenantCartView } from "@/components/store/tenant/TenantCartView";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const site = await getTenantSite((await params).slug);
  return site ? { title: `Cart · ${site.name}` } : { title: "Cart" };
}

export default async function TenantCartPage({ params }: { params: Promise<{ slug: string }> }) {
  const site = await getTenantSite((await params).slug);
  if (!site) notFound();
  const raw = await readCart(site.tenant.id);
  const lines = await resolveCart(raw, site.tenant.id);
  const totals = await computeTotals(lines);
  const settings = await getSettings();

  return (
    <div className="s-container s-section">
      {!lines.length && raw.length ? redirect(siteHref(site.basePath, "/shop")) : null}
      <TenantCartView
        lines={lines.map((l) => ({ key: l.key, productId: l.productId, name: l.name, slug: l.slug, variantTitle: l.variantTitle, image: l.image, price: l.price, qty: l.qty }))}
        totals={totals}
        base={site.basePath}
        tenantId={site.tenant.id}
        currency={settings.currency}
      />
    </div>
  );
}
