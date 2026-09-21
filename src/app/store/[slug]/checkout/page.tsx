import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { activePaymentGateway } from "@/lib/plugins/store";
import { computeTotals, readCart, resolveCart } from "@/lib/cart";
import { getTenantSite, siteHref } from "@/lib/tenant-site";
import { TenantCheckoutForm } from "@/components/store/tenant/TenantCheckoutForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const site = await getTenantSite((await params).slug);
  return site ? { title: `Checkout · ${site.name}` } : { title: "Checkout" };
}

export default async function TenantCheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const site = await getTenantSite((await params).slug);
  if (!site) notFound();
  const raw = await readCart(site.tenant.id);
  const lines = await resolveCart(raw, site.tenant.id);
  if (!lines.length) redirect(siteHref(site.basePath, "/cart"));

  const totals = await computeTotals(lines, undefined, undefined);
  const settings = await getSettings();
  const gateway = activePaymentGateway();

  return (
    <div className="s-container s-section">
      <Link href={siteHref(site.basePath, "/cart")} className="s-link s-link-back"><ArrowLeft className="h-4 w-4" /> Back to cart</Link>
      <h1 className="s-h1 s-mb-2">Checkout</h1>
      <p className="s-note s-mb-4">You are checking out with {site.name}.</p>
      <TenantCheckoutForm
        base={site.basePath}
        tenantId={site.tenant.id}
        initialTotals={totals}
        currency={settings.currency}
        gateway={gateway}
        codEnabled={settings.shipping.codEnabled}
        codFee={settings.shipping.codFee}
        estimateText={settings.shipping.estimateText}
        taxLabel={settings.tax.label || "Tax"}
        taxInclusive={settings.tax.inclusive}
        storeName={site.name}
      />
    </div>
  );
}
