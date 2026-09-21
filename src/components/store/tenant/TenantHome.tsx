import Link from "next/link";
import { ArrowRight, Check, ChevronRight, MapPin, Phone, Mail, Search, ShieldCheck, ShoppingBag, Sparkles, Truck } from "lucide-react";
import type { StoreSettings } from "@/lib/settings";
import { listCategories } from "@/lib/catalog";
import { listSiteProducts, siteHref, type TenantSite } from "@/lib/tenant-site";
import { TenantProductCard } from "./TenantProductCard";

/**
 * Home content of one website — the reference-site structure (see PLAN.md):
 * poster hero → ✦ marquee → editorial story → category browse → value trio →
 * curated products → visit / contact. Pure sections; the chrome and the role
 * colours (header = Colour 1, footer = Colour 2, buttons = Colour 3) come
 * from `TenantShell`.
 */
export async function TenantHome({ site, settings }: { site: TenantSite; settings: StoreSettings }) {
  const products = await listSiteProducts(site.tenant.id, { limit: 8, sort: "newest" });
  const categories = listCategories().filter((c) => !c.parentId).slice(0, 4);
  const base = site.basePath;
  const status = site.tenant.status;
  const heroTitle = settings.hero.title || "A collection worth discovering.";
  const heroSub = settings.hero.subtitle || site.tagline;
  const pillars = [site.tagline, ...settings.usps.map((u) => u.title).filter(Boolean)].filter(Boolean).slice(0, 4);
  const storyImage = settings.heroBanners.find((b) => b.image)?.image || settings.hero.image;
  const storyTitle = settings.heroBanners[0]?.title || "A considered edit";
  const storyText = settings.heroBanners[0]?.subtitle || `${site.name} exists for people who care about what they bring home. Every piece is chosen for the way it feels, lasts and lives with you.`;

  if (status === "paused") {
    return (
      <div className="s-paused">
        <div>
          <span className="s-brand-mark s-brand-mark-lg">{site.name.charAt(0).toUpperCase()}</span>
          <h1 className="s-h1">{site.name} is taking a short pause.</h1>
          <p className="s-note">Please check back soon.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {status === "setup" ? <div className="s-banner">This store is still being prepared. The owner will open it to customers soon.</div> : null}

      {/* 1 · Poster hero — serif headline, two CTAs (filled Action + ghost) */}
      <section className="s-hero">
        <div className="s-container s-hero-grid">
          <div>
            <span className="s-pill"><Sparkles className="h-3.5 w-3.5" /> {site.name}</span>
            <h1 className="s-hero-title">{heroTitle}</h1>
            <p className="s-hero-sub">{heroSub}</p>
            <div className="s-hero-actions">
              <Link href={siteHref(base, "/shop")} className="s-btn s-btn-hero">Explore Catalogue <ArrowRight className="h-4 w-4" /></Link>
              <Link href="#story" className="s-btn s-btn-hero-ghost">Our story</Link>
            </div>
          </div>
          <div className="s-hero-art" aria-hidden>
            <div>
              <div className="s-hero-art-label">The edit</div>
              <div className="s-hero-art-title">Made to be<br /><em>kept.</em></div>
              <div className="s-hero-art-note"><ShieldCheck className="h-4 w-4" /> Thoughtful, secure shopping</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2 · ✦ marquee band — Ground colour */}
      {pillars.length ? (
        <div className="s-marquee" aria-hidden>
          <div className="s-marquee-track">
            {[0, 1].map((copy) => (
              <div className="s-marquee-group" key={copy}>
                {pillars.map((p, i) => (
                  <span className="s-marquee-item" key={i}><em>✦</em> {p}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* 3 · Editorial story — "A considered edit" */}
      <section id="story" className="s-story">
        <div className="s-container s-story-grid">
          <div>
            <div className="s-eyebrow">A considered edit</div>
            <h2 className="s-h2">{storyTitle}</h2>
            <p className="s-story-text">{storyText}</p>
            <Link href={siteHref(base, "/shop")} className="s-link">Explore the collections <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div>
            {storyImage ? (
              <img src={storyImage} alt="" className="s-story-img" loading="lazy" />
            ) : (
              <div className="s-product-empty s-product-empty-lg">Your story image</div>
            )}
          </div>
        </div>
      </section>

      {/* 4 · Category browse — "a quieter way to browse" */}
      {categories.length ? (
        <section className="s-container s-section">
          <div className="s-section-head">
            <div>
              <div className="s-eyebrow">Shop by category</div>
              <h2 className="s-h2">A quieter way to browse.</h2>
            </div>
            <Link href={siteHref(base, "/shop")} className="s-link">View all <ChevronRight className="h-4 w-4" /></Link>
          </div>
          <div className="s-cat-grid">
            {categories.map((c) => (
              <Link key={c.id} href={siteHref(base, `/shop?category=${encodeURIComponent(c.slug)}`)} className="s-cat-card">
                <Search className="h-4 w-4 text-[color:var(--site-action)]" />
                {c.name}
                <span>{c.description || "Explore the edit"}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* 5 · Value trio */}
      {settings.usps.length ? (
        <section className="s-container s-section">
          <div className="s-values">
            {settings.usps.slice(0, 3).map((u, i) => (
              <div className="s-value-card" key={i}>
                <span className="s-trust-icon">{u.icon === "truck" ? <Truck className="h-4 w-4" /> : u.icon === "shield" ? <ShieldCheck className="h-4 w-4" /> : u.icon === "refresh" ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}</span>
                <h3 className="s-h3">{u.title}</h3>
                <p className="s-note">{u.text}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* 6 · Curated highlights */}
      <section id="collection" className="s-container s-section">
        <div className="s-section-head">
          <div>
            <div className="s-eyebrow">Curated highlights</div>
            <h2 className="s-h2">Shop the edit</h2>
          </div>
          {products.length ? (
            <Link href={siteHref(base, "/shop")} className="s-link">View Full Shop <ChevronRight className="h-4 w-4" /></Link>
          ) : null}
        </div>
        {products.length ? (
          <div className="s-grid-products">
            {products.map((p) => <TenantProductCard key={p.id} site={site} product={p} currency={settings.currency} />)}
          </div>
        ) : (
          <div className="s-empty">
            <span className="s-brand-mark s-brand-mark-lg"><ShoppingBag className="h-5 w-5" /></span>
            <h3 className="s-h3">The collection is being curated</h3>
            <p className="s-note">{status === "active" ? "This store is connected and ready for the owner’s real catalogue." : "The owner is finishing setup. Come back soon to see the first collection."}</p>
          </div>
        )}
      </section>

      {/* 7 · Visit us / get in touch */}
      <section className="s-visit">
        <div className="s-container s-visit-grid">
          <div>
            <div className="s-eyebrow">Experience {site.name}</div>
            <h2 className="s-h2">See the finish, scale, and shine in person.</h2>
            <p className="s-story-text">Questions, close-up details or custom requests — reach the team directly and we&apos;ll take care of it.</p>
            <div className="s-hero-actions">
              {settings.supportPhone ? <a href={`tel:${settings.supportPhone.replace(/\s/g, "")}`} className="s-btn s-btn-primary"><Phone className="h-4 w-4" /> Call the store</a> : null}
              {settings.supportEmail ? <a href={`mailto:${settings.supportEmail}`} className="s-btn s-btn-accent"><Mail className="h-4 w-4" /> Email us</a> : null}
            </div>
          </div>
          <div className="s-visit-card">
            <h3 className="s-h3">Store details</h3>
            <dl>
              <div><dt>Store</dt><dd>{site.name}</dd></div>
              {settings.address ? <div><dt>Address</dt><dd className="s-right">{settings.address}</dd></div> : null}
              {settings.supportPhone ? <div><dt>Phone</dt><dd>{settings.supportPhone}</dd></div> : null}
              {settings.supportEmail ? <div><dt>Email</dt><dd>{settings.supportEmail}</dd></div> : null}
            </dl>
            {settings.address ? (
              <a href={`https://maps.google.com/?q=${encodeURIComponent(settings.address)}`} target="_blank" rel="noopener noreferrer" className="s-link"><MapPin className="h-4 w-4" /> Open in Maps</a>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}

export function TrustRow({ settings }: { settings: StoreSettings }) {
  return (
    <section className="s-container s-trust">
      {settings.usps.slice(0, 4).map((u, i) => (
        <div className="s-trust-item" key={i}>
          <span className="s-trust-icon"><Truck className="h-4 w-4" /></span>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">{u.title}</div>
            <div className="truncate text-xs opacity-60">{u.text}</div>
          </div>
        </div>
      ))}
    </section>
  );
}
