import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { featuredProducts, newestProducts, listCategories, categoryProductCounts, queryProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/store/ProductCard";
import { RecentlyViewed } from "@/components/store/RecentlyViewed";
import { ArrowRight, Truck, ShieldCheck, RefreshCw, Headphones, Sparkles, Zap, Star, ChevronRight } from "lucide-react";

const icons: Record<string, React.ComponentType<{ className?: string }>> = { truck: Truck, shield: ShieldCheck, refresh: RefreshCw, headset: Headphones, sparkles: Sparkles };

export default async function HomePage() {
  const s = await getSettings();
  const [featured, newest, cats, counts, deals] = [
    featuredProducts(8),
    newestProducts(12),
    listCategories().filter((c) => !c.parentId),
    categoryProductCounts(),
    queryProducts({ sort: "discount", perPage: 8 }).items,
  ];
  const countFor = (id: string) => counts.find((c) => c.categoryId === id)?.n ?? 0;

  return (
    <div className="bg-[#f8f9fb] min-h-screen">
      {/* Hero - Flipkart style */}
      <section className="relative overflow-hidden bg-gray-900 text-white">
        {s.hero.image && <img src={s.hero.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,107,0,0.15),_transparent_60%)]" />
        <div className="container-x relative py-12 sm:py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-3 py-1 text-xs font-semibold tracking-wide mb-4">
              <Zap className="h-3.5 w-3.5 text-amber-400" /> {s.tagline}
            </div>
            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold leading-[0.95] tracking-tight">
              {s.hero.title.split(" ").slice(0, 2).join(" ")} <br />
              <span className="text-white/60">{s.hero.title.split(" ").slice(2).join(" ") || "Collection"}</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-white/70 max-w-xl leading-relaxed">{s.hero.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={s.hero.ctaLink} className="bg-white text-gray-900 px-6 py-3 rounded-full font-bold text-sm inline-flex items-center gap-2 hover:bg-gray-100 transition shadow-lg">
                {s.hero.ctaText} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/shop" className="bg-white/10 backdrop-blur border border-white/20 text-white px-6 py-3 rounded-full font-semibold text-sm inline-flex items-center gap-2 hover:bg-white/20 transition">
                Explore all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-6 text-xs">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-400" /> 100% Genuine</span>
              <span className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-sky-400" /> Free delivery</span>
              <span className="flex items-center gap-1.5"><RefreshCw className="h-4 w-4 text-amber-400" /> Easy returns</span>
            </div>
          </div>
        </div>

        {/* Category quick pills over hero bottom - Flipkart style */}
        <div className="relative border-t border-white/10 bg-white/5 backdrop-blur">
          <div className="container-x py-3 flex gap-2 overflow-x-auto no-scrollbar">
            {cats.slice(0, 8).map((c) => (
              <Link key={c.id} href={`/shop?category=${c.slug}`} className="shrink-0 flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full px-3 py-1.5 text-xs font-medium transition">
                {c.image && <img src={c.image} alt="" className="h-5 w-5 rounded-full object-cover" />}
                {c.name}
                <span className="text-white/50 text-[10px]">({countFor(c.id)})</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* USP strip - Amazon style */}
      <section className="bg-white border-b border-gray-100">
        <div className="container-x grid grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-gray-100">
          {s.usps.slice(0, 4).map((u, i) => {
            const I = icons[u.icon] ?? Sparkles;
            return (
              <div key={i} className="flex items-center gap-3 p-4">
                <div className="h-10 w-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                  <I className="h-5 w-5 text-gray-700" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold leading-tight">{u.title}</div>
                  <div className="text-xs text-gray-500 truncate">{u.text}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Categories rail - Flipkart style */}
      <section className="container-x py-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg">Shop by Category</h2>
            <Link href="/categories" className="h-8 w-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center">
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {cats.map((c) => (
              <Link key={c.id} href={`/shop?category=${c.slug}`} className="group shrink-0 w-[92px] text-center">
                <div className="relative h-[92px] w-[92px] mx-auto rounded-2xl bg-[#f8f9fb] border border-gray-100 overflow-hidden group-hover:border-gray-900 transition">
                  {c.image ? (
                    <img src={c.image} alt={c.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center font-bold text-gray-400">{c.name[0]}</div>
                  )}
                </div>
                <div className="mt-2 text-xs font-semibold truncate">{c.name}</div>
                <div className="text-[11px] text-gray-500">{countFor(c.id)} items</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Deals - Flipkart style with timer */}
      {deals.length > 0 && (
        <section className="container-x pb-6">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-5 flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-amber-500 text-white flex items-center justify-center">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg leading-tight">Deals of the Day</h2>
                  <p className="text-xs text-gray-500">Limited time offers · Ends in 12:34:56</p>
                </div>
              </div>
              <Link href="/shop?sort=discount" className="btn-primary btn-sm rounded-full">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {deals.slice(0, 8).map((p) => (
                <ProductCard key={p.id} p={p} currency={s.currency} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Dynamic sections from settings */}
      {s.homeSections
        .filter((x) => x.enabled)
        .map((sec) => {
          if (sec.type === "featured")
            return (
              <section key={sec.id} className="container-x pb-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <SectionHead title={sec.title} href="/shop" subtitle="Handpicked for you" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{featured.map((p) => <ProductCard key={p.id} p={p} currency={s.currency} />)}</div>
                </div>
              </section>
            );
          if (sec.type === "newest")
            return (
              <section key={sec.id} className="container-x pb-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <SectionHead title={sec.title} href="/shop?sort=newest" subtitle="Fresh arrivals this week" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {newest.map((p) => (
                      <ProductCard key={p.id} p={p} currency={s.currency} />
                    ))}
                  </div>
                </div>
              </section>
            );
          if (sec.type === "banner")
            return (
              <section key={sec.id} className="container-x pb-6">
                <div className="relative overflow-hidden rounded-2xl bg-gray-900 text-white p-8 sm:p-12">
                  {sec.data?.image && <img src={sec.data.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
                  <div className="relative max-w-xl">
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs font-semibold mb-3">
                      <Sparkles className="h-3.5 w-3.5" /> Limited offer
                    </div>
                    <h2 className="font-display text-2xl sm:text-4xl font-bold leading-tight">{sec.title}</h2>
                    <p className="mt-3 text-white/70">{sec.data?.text}</p>
                    <Link href={sec.data?.link || "/shop"} className="inline-flex items-center gap-2 bg-white text-gray-900 px-5 py-2.5 rounded-full font-bold text-sm mt-6 hover:bg-gray-100 transition">
                      {sec.data?.cta || "Shop now"} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </section>
            );
          if (sec.type === "text")
            return (
              <section key={sec.id} className="container-x pb-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-3xl mx-auto text-center">
                  <h2 className="font-display text-2xl font-bold">{sec.title}</h2>
                  <div className="mt-4 prose-store text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: sec.data?.html ?? "" }} />
                </div>
              </section>
            );
          return null;
        })}

      <div className="container-x pb-12">
        <RecentlyViewed currency={s.currency} />
      </div>

      {/* Trust footer strip */}
      <section className="bg-white border-y border-gray-100">
        <div className="container-x py-10 grid sm:grid-cols-3 gap-8 text-center">
          <div>
            <div className="mx-auto h-12 w-12 rounded-full bg-gray-50 border flex items-center justify-center mb-3">
              <Truck className="h-6 w-6" />
            </div>
            <div className="font-bold text-sm">Fast & Free Delivery</div>
            <div className="text-xs text-gray-500 mt-1 max-w-[240px] mx-auto">Free shipping on orders over ₹500. Delivered in 2-4 business days.</div>
          </div>
          <div>
            <div className="mx-auto h-12 w-12 rounded-full bg-gray-50 border flex items-center justify-center mb-3">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="font-bold text-sm">Secure Payments</div>
            <div className="text-xs text-gray-500 mt-1 max-w-[240px] mx-auto">256-bit SSL encryption. Your payment info is safe with us.</div>
          </div>
          <div>
            <div className="mx-auto h-12 w-12 rounded-full bg-gray-50 border flex items-center justify-center mb-3">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div className="font-bold text-sm">Easy Returns</div>
            <div className="text-xs text-gray-500 mt-1 max-w-[240px] mx-auto">Not satisfied? Return within 7 days for a full refund.</div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHead({ title, href, subtitle }: { title: string; href: string; subtitle?: string }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <Link href={href} className="inline-flex items-center gap-1 text-xs font-bold bg-gray-900 text-white px-3.5 py-2 rounded-full hover:bg-black transition">
        View all <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
