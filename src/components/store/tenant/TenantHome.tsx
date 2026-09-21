import Link from "next/link";
import { ArrowRight, Check, ChevronRight, ShieldCheck, ShoppingBag, Sparkles, Truck } from "lucide-react";
import { listSiteProducts, siteHref, type TenantSite } from "@/lib/tenant-site";
import { TenantProductCard } from "./TenantProductCard";

/**
 * Home content of one tenant website. Pure sections — the chrome (header with
 * the home-linking logo, footer, theme) comes from `TenantShell`.
 */
export async function TenantHome({ site, currency = "INR" }: { site: TenantSite; currency?: string }) {
  const products = await listSiteProducts(site.tenant.id, { limit: 8, sort: "newest" });
  const base = site.basePath;
  const status = site.tenant.status;

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
      {status === "setup" ? (
        <div className="s-banner">This store is still being prepared. The owner will open it to customers soon.</div>
      ) : null}

      <section className="s-hero">
        <div className="s-container s-hero-grid">
          <div>
            <span className="s-pill"><Sparkles className="h-3.5 w-3.5" /> {site.tagline || "Welcome"}</span>
            <h1 className="s-hero-title">{site.name}</h1>
            <p className="s-hero-sub">A considered collection, delivered with care. Explore what we have made for you.</p>
            <div className="s-hero-actions">
              <Link href={siteHref(base, "/shop")} className="s-btn s-btn-hero">Explore collection <ArrowRight className="h-4 w-4" /></Link>
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

      <section className="s-container s-trust">
        <Trust icon={<Truck className="h-4 w-4" />} title="Careful delivery" text="Tracked to your door" />
        <Trust icon={<ShieldCheck className="h-4 w-4" />} title="Secure checkout" text="Your data stays private" />
        <Trust icon={<Check className="h-4 w-4" />} title="Quality checked" text="Made with intention" />
        <Trust icon={<Sparkles className="h-4 w-4" />} title="Personal support" text="Here when you need us" />
      </section>

      <section id="collection" className="s-container s-section">
        <div className="s-section-head">
          <div>
            <div className="s-eyebrow">The collection</div>
            <h2 className="s-h2">Pieces worth discovering</h2>
          </div>
          {products.length ? (
            <Link href={siteHref(base, "/shop")} className="s-link">View all <ChevronRight className="h-4 w-4" /></Link>
          ) : null}
        </div>
        {products.length ? (
          <div className="s-grid-products">
            {products.map((p) => <TenantProductCard key={p.id} site={site} product={p} currency={currency} />)}
          </div>
        ) : (
          <div className="s-empty">
            <span className="s-brand-mark s-brand-mark-lg"><ShoppingBag className="h-5 w-5" /></span>
            <h3 className="s-h3">The collection is being curated</h3>
            <p className="s-note">{status === "active" ? "This store is connected and ready for the owner’s real catalogue." : "The owner is finishing setup. Come back soon to see the first collection."}</p>
          </div>
        )}
      </section>

      <section id="story" className="s-story">
        <div className="s-container s-story-grid">
          <div>
            <div className="s-eyebrow">Our story</div>
            <h2 className="s-h2">Small batches.<br />Big intention.</h2>
          </div>
          <div>
            <p className="s-story-text">
              {site.name} exists for people who care about what they bring home. Every piece is chosen for the way it feels,
              lasts and lives with you — never for a season, always for a reason.
            </p>
            <Link href={siteHref(base, "/shop")} className="s-link">Shop the collection <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <section id="support" className="s-container s-section">
        <div className="s-grid-2">
          <div className="s-card s-pad">
            <div className="s-eyebrow">01</div>
            <h3 className="s-h3">Human support</h3>
            <p className="s-note">Questions answered by the team behind the brand.</p>
          </div>
          <div className="s-card s-pad">
            <div className="s-eyebrow">02</div>
            <h3 className="s-h3">Thoughtful design</h3>
            <p className="s-note">A calm, considered way to shop online.</p>
          </div>
        </div>
      </section>
    </>
  );
}

function Trust({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="s-trust-item">
      <span className="s-trust-icon">{icon}</span>
      <div className="min-w-0">
        <div className="truncate text-sm font-bold">{title}</div>
        <div className="truncate text-xs opacity-60">{text}</div>
      </div>
    </div>
  );
}
