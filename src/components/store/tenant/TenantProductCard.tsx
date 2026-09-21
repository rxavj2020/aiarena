import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { siteDiscount, siteHref, type SiteProduct, type TenantSite } from "@/lib/tenant-site";

export function TenantProductCard({ site, product, currency = "INR" }: { site: TenantSite; product: SiteProduct; currency?: string }) {
  const discount = siteDiscount(product);
  return (
    <Link href={siteHref(site.basePath, `/products/${product.slug}`)} className="s-card s-product-card group">
      <div className="s-product-media">
        {product.images[0] ? (
          <img src={product.images[0]} alt={product.name} className="s-product-img" loading="lazy" />
        ) : (
          <div className="s-product-empty">No image</div>
        )}
        {discount > 0 ? <span className="s-badge s-badge-accent">−{discount}%</span> : null}
      </div>
      <div className="s-product-body">
        <div className="s-product-name">{product.name}</div>
        <div className="s-product-price-row">
          <span className="s-price">{formatMoney(product.price, currency)}</span>
          {product.compareAtPrice && product.compareAtPrice > product.price ? (
            <span className="s-price-old">{formatMoney(product.compareAtPrice, currency)}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
