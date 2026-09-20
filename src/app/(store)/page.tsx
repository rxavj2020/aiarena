import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { featuredProducts, newestProducts, listCategories, categoryProductCounts, queryProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/store/ProductCard";
import { RecentlyViewed } from "@/components/store/RecentlyViewed";
import { ArrowRight, Truck, ShieldCheck, RefreshCw, Headphones, Sparkles, Zap, ChevronRight, Gem } from "lucide-react";
import { HeroBanners } from "@/components/store/HeroBanners";

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

  const enabledHeroBanners = s.heroBanners.filter((b) => b.enabled).sort((a, b) => a.sortOrder - b.sortOrder);
  const enabledBanners = s.banners.filter((b) => b.enabled).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="bg-[#f1f2f4] min-h-screen">
      {/* Hero Banners Carousel - Flipkart light for clothing & jewellery */}
      {enabledHeroBanners.length > 0 ? (
        <section className="container-x pt-3 sm:pt-4">
          <HeroBanners banners={enabledHeroBanners} />
        </section>
      ) : (
        <section className="relative overflow-hidden bg-white border-b border-[#e0e0e0]">
          {s.hero.image && <img src={s.hero.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />}
          <div className="container-x relative py-12 sm:py-20">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-[#e8f0fe] border border-[#c2d6ff] text-[#2874f0] rounded-full px-3 py-1 text-xs font-bold mb-4">
                <Gem className="h-3.5 w-3.5" /> {s.tagline}
              </div>
              <h1 className="font-display text-3xl sm:text-5xl font-bold leading-[1.05] tracking-tight text-[#212121]">
                {s.hero.title}
              </h1>
              <p className="mt-4 text-base text-[#878787] max-w-xl leading-relaxed">{s.hero.subtitle}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={s.hero.ctaLink} className="bg-[#2874f0] text-white px-6 py-3 rounded-lg font-bold text-sm inline-flex items-center gap-2 hover:bg-[#1f5fd1] shadow-sm">
                  {s.hero.ctaText} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/shop" className="bg-white border border-[#e0e0e0] text-[#212121] px-6 py-3 rounded-lg font-semibold text-sm inline-flex items-center gap-2 hover:border-[#2874f0] hover:text-[#2874f0]">
                  Explore all <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-[#e0e0e0] bg-[#f8f9fb]">
            <div className="container-x py-2.5 flex gap-2 overflow-x-auto no-scrollbar">
              {cats.slice(0, 8).map((c) => (
                <Link key={c.id} href={`/shop?category=${c.slug}`} className="shrink-0 flex items-center gap-2 bg-white border border-[#e0e0e0] hover:border-[#2874f0] rounded-full px-3 py-1.5 text-xs font-medium transition">
                  {c.image && <img src={c.image} alt="" className="h-5 w-5 rounded-full object-cover" />}
                  {c.name}
                  <span className="text-[#878787] text-[10px]">({countFor(c.id)})</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* USP strip - Flipkart assured */}
      <section className="container-x pt-3 sm:pt-4">
        <div className="bg-white rounded-lg border border-[#e0e0e0] grid grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-[#f0f0f0]">
          {s.usps.slice(0, 4).map((u, i) => {
            const I = icons[u.icon] ?? Sparkles;
            return (
              <div key={i} className="flex items-center gap-3 p-3 sm:p-4">
                <div className="h-9 w-9 rounded-full bg-[#f1f2f4] flex items-center justify-center shrink-0">
                  <I className="h-4 w-4 text-[#2874f0]" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold leading-tight text-[#212121]">{u.title}</div>
                  <div className="text-[11px] text-[#878787] truncate">{u.text}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Categories rail - Flipkart light for clothing & jewellery */}
      <section className="container-x pt-3 sm:pt-4">
        <div className="bg-white rounded-lg border border-[#e0e0e0] p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[16px] text-[#212121]">Shop by Category</h2>
            <Link href="/categories" className="h-7 w-7 rounded-full bg-[#f1f2f4] hover:bg-[#e0e0e0] flex items-center justify-center">
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {cats.map((c) => (
              <Link key={c.id} href={`/shop?category=${c.slug}`} className="group shrink-0 w-[84px] text-center">
                <div className="relative h-[84px] w-[84px] mx-auto rounded-full bg-[#f8f9fb] border border-[#f0f0f0] overflow-hidden group-hover:border-[#2874f0] transition">
                  {c.image ? (
                    <img src={c.image} alt={c.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center font-bold text-[#878787] bg-[#f1f2f4]">{c.name[0]}</div>
                  )}
                </div>
                <div className="mt-2 text-xs font-semibold truncate text-[#212121]">{c.name}</div>
                <div className="text-[11px] text-[#878787]">{countFor(c.id)} items</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic sections */}
      {s.homeSections
        .filter((x) => x.enabled)
        .map((sec) => {
          if (sec.type === "hero_banners" && enabledHeroBanners.length > 0) {
            // Already shown at top, skip duplicate unless explicitly second time
            return null;
          }
          if (sec.type === "deals" && deals.length > 0)
            return (
              <section key={sec.id} className="container-x pt-3 sm:pt-4">
                <div className="bg-white rounded-lg border border-[#e0e0e0] overflow-hidden">
                  <div className="p-4 flex items-center justify-between border-b border-[#f0f0f0] bg-[#fff8e1]">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#fb641b] text-white flex items-center justify-center">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="font-bold text-[16px] leading-tight text-[#212121]">{sec.title || "Deals of the Day"}</h2>
                        <p className="text-[11px] text-[#878787]">Limited time offers · Jewellery & clothing specials</p>
                      </div>
                    </div>
                    <Link href="/shop?sort=discount" className="bg-[#2874f0] text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-[#1f5fd1]">
                      View all
                    </Link>
                  </div>
                  <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {deals.slice(0, 8).map((p) => (
                      <ProductCard key={p.id} p={p} currency={s.currency} />
                    ))}
                  </div>
                </div>
              </section>
            );
          if (sec.type === "featured")
            return (
              <section key={sec.id} className="container-x pt-3 sm:pt-4">
                <div className="bg-white rounded-lg border border-[#e0e0e0] p-4">
                  <SectionHead title={sec.title} href="/shop" subtitle="Handpicked for clothing & jewellery lovers" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">{featured.map((p) => <ProductCard key={p.id} p={p} currency={s.currency} />)}</div>
                </div>
              </section>
            );
          if (sec.type === "banners" && enabledBanners.length > 0)
            return (
              <section key={sec.id} className="container-x pt-3 sm:pt-4">
                <div className="grid md:grid-cols-2 gap-3">
                  {enabledBanners.slice(0, 4).map((b) => (
                    <Link key={b.id} href={b.ctaLink || "/shop"} className="group relative overflow-hidden rounded-lg border border-[#e0e0e0] bg-white p-0 flex h-[160px] sm:h-[200px]">
                      {b.image && <img src={b.image} alt={b.title} className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" style={{ background: b.bgColor ? `linear-gradient(to right, ${b.bgColor}, transparent)` : undefined }} />
                      <div className="relative p-5 sm:p-6 max-w-[60%] flex flex-col justify-center">
                        <h3 className="font-bold text-sm sm:text-lg text-[#212121] leading-tight">{b.title}</h3>
                        {b.subtitle && <p className="text-xs sm:text-sm text-[#212121]/70 mt-1 line-clamp-2">{b.subtitle}</p>}
                        {b.ctaText && <span className="mt-3 inline-flex bg-white text-[#212121] px-3 py-1 rounded-full text-xs font-bold w-fit shadow-sm">{b.ctaText}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          if (sec.type === "newest")
            return (
              <section key={sec.id} className="container-x pt-3 sm:pt-4">
                <div className="bg-white rounded-lg border border-[#e0e0e0] p-4">
                  <SectionHead title={sec.title} href="/shop?sort=newest" subtitle="Fresh arrivals in clothing & jewellery" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                    {newest.map((p) => (
                      <ProductCard key={p.id} p={p} currency={s.currency} />
                    ))}
                  </div>
                </div>
              </section>
            );
          if (sec.type === "banner")
            return (
              <section key={sec.id} className="container-x pt-3 sm:pt-4">
                <div className="relative overflow-hidden rounded-lg border border-[#e0e0e0] bg-[#2874f0] text-white p-6 sm:p-10">
                  {sec.data?.image && <img src={sec.data.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#2874f0] via-[#2874f0]/80 to-transparent" />
                  <div className="relative max-w-xl">
                    <div className="inline-flex items-center gap-2 bg-white/20 border border-white/20 rounded-full px-3 py-1 text-xs font-bold mb-3">
                      <Sparkles className="h-3.5 w-3.5" /> {sec.title.includes("Sale") ? "Sale live" : "Limited offer"}
                    </div>
                    <h2 className="font-bold text-xl sm:text-3xl leading-tight">{sec.title}</h2>
                    <p className="mt-2 text-white/80 text-sm">{sec.data?.text}</p>
                    <Link href={sec.data?.link || "/shop"} className="inline-flex items-center gap-2 bg-white text-[#2874f0] px-5 py-2.5 rounded-full font-bold text-sm mt-5 hover:bg-gray-100 shadow-sm">
                      {sec.data?.cta || "Shop now"} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </section>
            );
          if (sec.type === "categories") return null; // already shown
          if (sec.type === "usps") return null; // already shown
          if (sec.type === "text")
            return (
              <section key={sec.id} className="container-x pt-3 sm:pt-4">
                <div className="bg-white rounded-lg border border-[#e0e0e0] p-6 max-w-3xl mx-auto text-center">
                  <h2 className="font-bold text-lg text-[#212121]">{sec.title}</h2>
                  <div className="mt-3 prose-store text-sm text-[#878787]" dangerouslySetInnerHTML={{ __html: sec.data?.html ?? "" }} />
                </div>
              </section>
            );
          return null;
        })}

      <div className="container-x py-6">
        <RecentlyViewed currency={s.currency} />
      </div>

      {/* Trust strip - Flipkart light */}
      <section className="bg-white border-y border-[#e0e0e0]">
        <div className="container-x py-8 grid sm:grid-cols-3 gap-6 text-center">
          <div>
            <div className="mx-auto h-10 w-10 rounded-full bg-[#e8f0fe] flex items-center justify-center mb-3">
              <Truck className="h-5 w-5 text-[#2874f0]" />
            </div>
            <div className="font-bold text-sm text-[#212121]">Fast & Free Delivery</div>
            <div className="text-xs text-[#878787] mt-1 max-w-[240px] mx-auto">Free shipping on orders over ₹999. Perfect for clothing & jewellery.</div>
          </div>
          <div>
            <div className="mx-auto h-10 w-10 rounded-full bg-[#e8f5e9] flex items-center justify-center mb-3">
              <ShieldCheck className="h-5 w-5 text-[#388e3c]" />
            </div>
            <div className="font-bold text-sm text-[#212121]">100% Genuine</div>
            <div className="text-xs text-[#878787] mt-1 max-w-[240px] mx-auto">Authentic clothing and hallmarked jewellery with certificates.</div>
          </div>
          <div>
            <div className="mx-auto h-10 w-10 rounded-full bg-[#fff3e0] flex items-center justify-center mb-3">
              <RefreshCw className="h-5 w-5 text-[#fb641b]" />
            </div>
            <div className="font-bold text-sm text-[#212121]">Easy Returns</div>
            <div className="text-xs text-[#878787] mt-1 max-w-[240px] mx-auto">7 days return for clothing, lifetime exchange for jewellery.</div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHead({ title, href, subtitle }: { title: string; href: string; subtitle?: string }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="font-bold text-[16px] text-[#212121] tracking-tight">{title}</h2>
        {subtitle && <p className="text-[11px] text-[#878787] mt-0.5">{subtitle}</p>}
      </div>
      <Link href={href} className="inline-flex items-center gap-1 text-xs font-bold bg-[#2874f0] text-white px-3.5 py-1.5 rounded-full hover:bg-[#1f5fd1] transition shadow-sm">
        View all <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
