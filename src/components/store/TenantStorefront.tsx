import Link from "next/link";
import { ArrowRight, Check, ChevronRight, Heart, Menu, Search, ShieldCheck, ShoppingBag, Sparkles, Truck } from "lucide-react";
import { DEFAULT_TENANT_ID } from "@/lib/platform";
import { db, schema } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { getSettings } from "@/lib/settings";
import { queryProducts } from "@/lib/catalog";
import { listTenantProducts } from "@/lib/tenant-firestore";
import { formatMoney } from "@/lib/format";

export async function TenantStorefront({ tenant }: { tenant: schema.Tenant }) {
  const base = await getSettings();
  const isLegacyCatalog = tenant.id === DEFAULT_TENANT_ID;
  const dbProducts = db.select().from(schema.products).where(and(eq(schema.products.tenantId, tenant.id), eq(schema.products.status, "active"))).all();
  const firestoreProducts = await listTenantProducts(tenant.id).catch(() => []);
  
  let products = dbProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    image: (p.images && Array.isArray(p.images) && p.images[0]) || "",
  }));

  if (!products.length && firestoreProducts.length) {
    products = firestoreProducts.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      image: p.image,
    }));
  }

  if (!products.length && isLegacyCatalog) {
    products = queryProducts({ perPage: 8, sort: "newest" }).items.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.images[0] ?? "",
    }));
  }

  const brand = { ...base, storeName: tenant.name, tagline: tenant.tagline, logoUrl: tenant.logoUrl ?? base.logoUrl, primaryColor: tenant.primaryColor, accentColor: tenant.accentColor };

  if (tenant.status === "paused") {
    return <div className="flex min-h-screen items-center justify-center bg-[#11110f] p-6 text-white"><div className="max-w-md text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9c78d] text-[#11110f]"><ShoppingBag className="h-6 w-6" /></div><h1 className="mt-6 font-display text-3xl font-bold">{tenant.name} is taking a short pause.</h1><p className="mt-3 text-sm leading-6 text-white/55">Please check back soon.</p></div></div>;
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#171715]" style={{ ["--site-primary" as string]: brand.primaryColor, ["--site-accent" as string]: brand.accentColor }}>
      <header className="sticky top-0 z-30 border-b border-black/10 bg-[#faf9f6]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center gap-5 px-5 sm:px-8">
          <Link href={`/store/${tenant.slug}`} className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white" style={{ backgroundColor: brand.primaryColor }}>{brand.logoUrl ? <img src={brand.logoUrl} alt="" className="h-full w-full rounded-2xl object-cover" /> : brand.storeName.charAt(0).toUpperCase()}</span><span className="truncate font-display text-lg font-bold tracking-tight">{brand.storeName}</span></Link>
          <nav className="ml-auto hidden items-center gap-6 text-sm font-semibold text-black/55 md:flex"><a href="#collection" className="transition hover:text-black">Collection</a><a href="#story" className="transition hover:text-black">Our story</a><a href="#support" className="transition hover:text-black">Support</a></nav>
          <div className="ml-auto flex items-center gap-1 md:ml-3"><button aria-label="Search" className="hidden h-10 w-10 items-center justify-center rounded-full transition hover:bg-black/5 sm:flex"><Search className="h-4 w-4" /></button><Link href="/wishlist" aria-label="Wishlist" className="hidden h-10 w-10 items-center justify-center rounded-full transition hover:bg-black/5 sm:flex"><Heart className="h-4 w-4" /></Link><Link href="/cart" className="flex h-10 items-center gap-2 rounded-full px-3 text-sm font-bold text-white" style={{ backgroundColor: brand.primaryColor }}><ShoppingBag className="h-4 w-4" /><span className="hidden sm:inline">Bag</span></Link><button aria-label="Menu" className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-black/5 md:hidden"><Menu className="h-5 w-5" /></button></div>
        </div>
      </header>

      {tenant.status === "setup" ? <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs font-semibold text-amber-800">This store is still being prepared. The owner will open it to customers soon.</div> : null}

      <main>
        <section className="relative overflow-hidden border-b border-black/10" style={{ background: `linear-gradient(115deg, ${brand.primaryColor} 0%, #292724 58%, ${brand.accentColor} 140%)` }}><div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" /><div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-16 text-white sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center"><div className="relative"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80"><Sparkles className="h-3.5 w-3.5" /> {brand.tagline}</div><h1 className="max-w-2xl font-display text-4xl font-bold leading-[0.98] tracking-tight sm:text-6xl">A storefront as distinctive as your brand.</h1><p className="mt-5 max-w-lg text-sm leading-6 text-white/65 sm:text-base">A considered collection, delivered with care. Explore what {brand.storeName} has made for you.</p><div className="mt-8 flex flex-wrap gap-3"><a href="#collection" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#171715] transition hover:bg-white/90">Explore collection <ArrowRight className="h-4 w-4" /></a><a href="#story" className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Our story</a></div></div><div className="relative hidden min-h-[270px] overflow-hidden rounded-[28px] border border-white/15 bg-white/10 p-6 lg:block"><div className="absolute inset-0 opacity-25" style={{ background: `radial-gradient(circle at 30% 20%, ${brand.accentColor}, transparent 50%), radial-gradient(circle at 75% 70%, white, transparent 40%)` }} /><div className="relative flex h-full flex-col justify-between"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">The edit</span><span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold">{products.length ? "New arrivals" : "Opening soon"}</span></div><div><div className="font-display text-4xl font-bold">Made to be<br /><span className="text-[#e9c78d]">kept.</span></div><div className="mt-3 flex items-center gap-2 text-xs text-white/55"><ShieldCheck className="h-4 w-4" /> Thoughtful, secure shopping</div></div></div></div></div></section>

        <section className="mx-auto grid max-w-[1240px] grid-cols-2 gap-3 px-5 py-5 sm:grid-cols-4 sm:px-8"><Trust icon={<Truck className="h-4 w-4" />} title="Careful delivery" text="Tracked to your door" /><Trust icon={<ShieldCheck className="h-4 w-4" />} title="Secure checkout" text="Your data stays private" /><Trust icon={<Check className="h-4 w-4" />} title="Quality checked" text="Made with intention" /><Trust icon={<Sparkles className="h-4 w-4" />} title="Personal support" text="Here when you need us" /></section>

        <section id="collection" className="mx-auto max-w-[1240px] px-5 pb-16 pt-8 sm:px-8 sm:pt-12"><div className="flex items-end justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/35">The collection</div><h2 className="mt-1 font-display text-3xl font-bold tracking-tight">Pieces worth discovering</h2></div>{products.length ? <Link href="/shop" className="inline-flex items-center gap-1 text-sm font-bold text-black/55 hover:text-black">View all <ChevronRight className="h-4 w-4" /></Link> : null}</div>{products.length ? <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{products.map((product) => <Link key={product.id} href={`/products/${product.slug}`} className="group overflow-hidden rounded-2xl border border-black/10 bg-white transition hover:-translate-y-1 hover:shadow-xl"><div className="aspect-[0.9] overflow-hidden bg-[#f1eee8]">{product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-xs text-black/35">No image</div>}</div><div className="p-3.5"><div className="line-clamp-2 min-h-10 text-sm font-semibold leading-5">{product.name}</div><div className="mt-3 flex items-center justify-between gap-2"><span className="text-sm font-bold">{formatMoney(product.price, brand.currency)}</span><span className="text-[10px] font-bold uppercase tracking-wider text-black/35">Explore</span></div></div></Link>)}</div> : <div className="mt-7 rounded-[24px] border border-dashed border-black/15 bg-white p-8 sm:p-12"><div className="mx-auto max-w-md text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f3eadb] text-[#9b682d]"><ShoppingBag className="h-6 w-6" /></div><h3 className="mt-5 font-display text-xl font-bold">The collection is being curated</h3><p className="mt-2 text-sm leading-6 text-black/50">{tenant.status === "active" ? "This store is connected and ready for the owner’s real catalogue." : "The owner is finishing setup. Come back soon to see the first collection."}</p></div></div>}</section>

        <section id="story" className="border-y border-black/10 bg-white"><div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-14 sm:px-8 lg:grid-cols-2 lg:items-center"><div><div className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/35">A little about us</div><h2 className="mt-2 font-display text-3xl font-bold leading-tight">Built around what matters to you.</h2><p className="mt-4 max-w-lg text-sm leading-6 text-black/55">{brand.tagline} We believe an online store should feel personal, move quickly and keep your information safe. Every detail here is shaped by the people behind {brand.storeName}.</p><a href="#support" className="mt-6 inline-flex items-center gap-2 text-sm font-bold hover:underline">Talk to us <ArrowRight className="h-4 w-4" /></a></div><div id="support" className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-[#f7f5f0] p-5"><div className="text-3xl font-bold">01</div><div className="mt-8 text-sm font-bold">Human support</div><div className="mt-1 text-xs leading-5 text-black/45">Questions answered by the team behind the brand.</div></div><div className="rounded-2xl bg-[#f7f5f0] p-5"><div className="text-3xl font-bold">02</div><div className="mt-8 text-sm font-bold">Thoughtful design</div><div className="mt-1 text-xs leading-5 text-black/45">A calm, considered way to shop online.</div></div></div></div></section>
      </main>
      <footer className="bg-[#11110f] px-5 py-8 text-white sm:px-8"><div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-3 text-xs sm:flex-row"><span className="font-semibold">{brand.storeName}</span><span className="text-white/40">A secure storefront powered by Aurelia Studio · <Link href="/platform/signup" className="hover:text-white">Build yours</Link></span></div></footer>
    </div>
  );
}

function Trust({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="rounded-2xl border border-black/10 bg-white p-3 sm:p-4"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/5 text-black/60">{icon}</span><div className="min-w-0"><div className="truncate text-xs font-bold">{title}</div><div className="truncate text-[10px] text-black/40">{text}</div></div></div></div>; }
