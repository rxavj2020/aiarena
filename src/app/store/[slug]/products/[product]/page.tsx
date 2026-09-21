import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, Truck } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/format";
import { getSiteProduct, getTenantSite, siteDiscount, siteHref, siteVariants } from "@/lib/tenant-site";
import { AddToSiteCart } from "@/components/store/tenant/AddToSiteCart";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; product: string }> }) {
  const { slug, product } = await params;
  const site = await getTenantSite(slug);
  const p = site ? await getSiteProduct(site.tenant.id, product) : null;
  return p ? { title: `${p.name} · ${site!.name}`, description: p.description.slice(0, 150) } : { title: "Product" };
}

export default async function TenantProductPage({ params }: { params: Promise<{ slug: string; product: string }> }) {
  const { slug, product } = await params;
  const site = await getTenantSite(slug);
  if (!site) notFound();
  const p = await getSiteProduct(site.tenant.id, product);
  if (!p) notFound();

  const settings = await getSettings();
  const currency = settings.currency;
  const base = site.basePath;
  const variants = p.source === "db" ? siteVariants(p.id).map((v) => ({ id: v.id, title: v.title, stock: v.stock })) : [];
  const discount = siteDiscount(p);

  return (
    <div className="s-container s-section">
      <Link href={siteHref(base, "/shop")} className="s-link s-link-back"><ArrowLeft className="h-4 w-4" /> All products</Link>
      <div className="s-product-page">
        <div className="s-product-gallery">
          {p.images[0] ? <img src={p.images[0]} alt={p.name} className="s-product-hero-img" /> : <div className="s-product-empty s-product-empty-lg">No image</div>}
        </div>
        <div className="s-product-info">
          <div className="s-eyebrow">{site.name}</div>
          <h1 className="s-h1">{p.name}</h1>
          <div className="s-product-price-row s-product-price-row-lg">
            <span className="s-price s-price-lg">{formatMoney(p.price, currency)}</span>
            {p.compareAtPrice && p.compareAtPrice > p.price ? (
              <>
                <span className="s-price-old s-price-old-lg">{formatMoney(p.compareAtPrice, currency)}</span>
                <span className="s-badge s-badge-accent">−{discount}%</span>
              </>
            ) : null}
          </div>
          {p.description ? <p className="s-product-desc">{p.description}</p> : null}
          <AddToSiteCart productId={p.id} tenantId={site.tenant.id} base={base} variants={variants} stock={p.stock} buyable={p.buyable} />
          <div className="s-product-notes">
            <p><Truck className="h-4 w-4" /> {settings.shipping.estimateText}</p>
            <p><ShieldCheck className="h-4 w-4" /> Secure payments · Easy support from {site.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
