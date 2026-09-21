import Link from "next/link";
import { siteHref, type TenantSite } from "@/lib/tenant-site";

/**
 * Footer of one website — Colour 2 · GROUND, with the store's details laid out
 * like a boutique site's footer. Platform attribution is text-only and tiny.
 */
export function TenantFooter({ site, supportEmail, supportPhone, address }: { site: TenantSite; supportEmail?: string; supportPhone?: string; address?: string }) {
  const { basePath: base, name, tagline } = site;
  const year = new Date().getFullYear();

  return (
    <footer className="s-footer">
      <div className="s-container s-footer-grid">
        <div>
          <Link href={siteHref(base, "/")} className="s-brand s-footer-brand">
            <span className="s-brand-mark">{name.charAt(0).toUpperCase()}</span>
            <span className="s-brand-name">{name}</span>
          </Link>
          {tagline ? <p className="s-footer-tag">{tagline}</p> : null}
        </div>
        <nav aria-label="Footer">
          <div className="s-footer-title">Shop</div>
          <ul className="s-footer-list">
            <li><Link href={siteHref(base, "/")}>Home</Link></li>
            <li><Link href={siteHref(base, "/shop")}>All products</Link></li>
            <li><Link href={siteHref(base, "/cart")}>Your cart</Link></li>
            <li><Link href={siteHref(base, "/track")}>Track order</Link></li>
          </ul>
        </nav>
        <div>
          <div className="s-footer-title">Support</div>
          <ul className="s-footer-list">
            {supportEmail ? <li><a href={`mailto:${supportEmail}`}>{supportEmail}</a></li> : null}
            {supportPhone ? <li><a href={`tel:${supportPhone.replace(/\s/g, "")}`}>{supportPhone}</a></li> : null}
          </ul>
        </div>
        <div>
          <div className="s-footer-title">Store</div>
          <ul className="s-footer-list">
            {address ? <li>{address}</li> : null}
            {address ? (
              <li>
                <a href={`https://maps.google.com/?q=${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer">Open in Maps</a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
      <div className="s-container s-footer-bottom">
        <span>© {year} {name}. All rights reserved.</span>
        <span className="s-powered">Powered by Aurelia Studio</span>
      </div>
    </footer>
  );
}
