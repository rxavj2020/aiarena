import Link from "next/link";
import { Search, ShoppingBag, PackageSearch } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { siteHref, type TenantSite } from "@/lib/tenant-site";
import type { Appearance } from "@/lib/themes";

/**
 * Chrome of one tenant website. The logo always returns to *this* website's
 * home — it never navigates to the Aurelia platform.
 */
export function TenantHeader({ site, cartCount, appearance }: { site: TenantSite; cartCount: number; appearance: Appearance }) {
  const { basePath: base, name, tagline, logoUrl } = site;
  const home = siteHref(base, "/");

  return (
    <header className="s-header">
      <div className="s-container s-header-row">
        <Link href={home} className="s-brand" aria-label={`${name} home`}>
          {logoUrl ? (
            <img src={logoUrl} alt={name} className="s-brand-logo-img" />
          ) : (
            <span className="s-brand-mark">{name.charAt(0).toUpperCase()}</span>
          )}
          <span className="s-brand-text">
            <span className="s-brand-name">{name}</span>
            {tagline ? <span className="s-brand-tag">{tagline}</span> : null}
          </span>
        </Link>

        <form action={siteHref(base, "/shop")} className="s-search" role="search">
          <Search className="s-search-icon" />
          <input name="q" type="search" placeholder={`Search ${name}…`} className="s-search-input" aria-label="Search products" />
        </form>

        <nav className="s-nav" aria-label="Store">
          <Link href={siteHref(base, "/shop")} className="s-nav-link">Shop</Link>
          <Link href={siteHref(base, "/track")} className="s-nav-link"><PackageSearch className="h-4 w-4" /><span>Track</span></Link>
          <ThemeToggle basePath={base} initial={appearance} />
          <Link href={siteHref(base, "/cart")} className="s-cart-btn" aria-label={`Cart, ${cartCount} items`}>
            <ShoppingBag className="h-[18px] w-[18px]" />
            <span className="s-cart-label">Cart</span>
            {cartCount > 0 ? <span className="s-cart-count">{cartCount}</span> : null}
          </Link>
        </nav>
      </div>

      <div className="s-container s-mobile-row">
        <form action={siteHref(base, "/shop")} className="s-search s-search-mobile" role="search">
          <Search className="s-search-icon" />
          <input name="q" type="search" placeholder={`Search ${name}…`} className="s-search-input" aria-label="Search products" />
        </form>
      </div>
    </header>
  );
}
