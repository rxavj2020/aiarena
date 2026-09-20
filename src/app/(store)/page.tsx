import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { featuredProducts, newestProducts, listCategories, categoryProductCounts } from "@/lib/catalog";
import { ProductCard } from "@/components/store/ProductCard";
import { ArrowRight, Truck, ShieldCheck, RefreshCw, Headphones, Sparkles } from "lucide-react";

const icons: Record<string, React.ComponentType<{ className?: string }>> = { truck: Truck, shield: ShieldCheck, refresh: RefreshCw, headset: Headphones, sparkles: Sparkles };

export default async function HomePage() {
  const s = await getSettings();
  const [featured, newest, cats, counts] = [featuredProducts(8), newestProducts(8), listCategories().filter((c) => !c.parentId), categoryProductCounts()];
  const countFor = (id: string) => counts.find((c) => c.categoryId === id)?.n ?? 0;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary text-white">
        {s.hero.image && <img src={s.hero.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
        <div className="container-x relative py-24 md:py-36 max-w-3xl fade-up">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70 mb-4">{s.tagline}</p>
          <h1 className="font-display text-4xl md:text-6xl font-semibold leading-[1.05]">{s.hero.title}</h1>
          <p className="mt-5 text-lg text-white/80 max-w-xl">{s.hero.subtitle}</p>
          <div className="mt-8 flex gap-3">
            <Link href={s.hero.ctaLink} className="btn-accent px-6 py-3">{s.hero.ctaText} <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/categories" className="btn border border-white/40 text-white hover:bg-white/10 px-6 py-3">Browse categories</Link>
          </div>
        </div>
      </section>

      {s.homeSections.filter((x) => x.enabled).map((sec) => {
        if (sec.type === "usps")
          return (
            <section key={sec.id} className="border-b border-gray-200 bg-white">
              <div className="container-x grid grid-cols-2 md:grid-cols-4 gap-6 py-8">
                {s.usps.map((u, i) => {
                  const I = icons[u.icon] ?? Sparkles;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className="rounded-full bg-gray-100 p-2.5"><I className="h-5 w-5" /></div>
                      <div><div className="text-sm font-semibold">{u.title}</div><div className="text-xs text-gray-500">{u.text}</div></div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        if (sec.type === "categories")
          return (
            <section key={sec.id} className="container-x py-16">
              <SectionHead title={sec.title} href="/categories" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {cats.slice(0, 5).map((c) => (
                  <Link key={c.id} href={`/shop?category=${c.slug}`} className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-gray-200">
                    {c.image && <img src={c.image} alt={c.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 p-4 text-white"><div className="font-semibold">{c.name}</div><div className="text-xs text-white/80">{countFor(c.id)} products</div></div>
                  </Link>
                ))}
              </div>
            </section>
          );
        if (sec.type === "featured")
          return (
            <section key={sec.id} className="container-x py-8">
              <SectionHead title={sec.title} href="/shop" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">{featured.map((p) => <ProductCard key={p.id} p={p} currency={s.currency} />)}</div>
            </section>
          );
        if (sec.type === "newest")
          return (
            <section key={sec.id} className="container-x py-16">
              <SectionHead title={sec.title} href="/shop?sort=newest" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">{newest.map((p) => <ProductCard key={p.id} p={p} currency={s.currency} />)}</div>
            </section>
          );
        if (sec.type === "banner")
          return (
            <section key={sec.id} className="container-x py-12">
              <div className="relative overflow-hidden rounded-2xl bg-accent text-white p-10 md:p-16">
                {sec.data?.image && <img src={sec.data.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />}
                <div className="relative max-w-xl">
                  <h2 className="font-display text-3xl md:text-4xl font-semibold">{sec.title}</h2>
                  <p className="mt-3 text-white/90">{sec.data?.text}</p>
                  <Link href={sec.data?.link || "/shop"} className="btn bg-white text-gray-900 mt-6 hover:bg-gray-100">{sec.data?.cta || "Shop now"}</Link>
                </div>
              </div>
            </section>
          );
        if (sec.type === "text")
          return (
            <section key={sec.id} className="container-x py-12 max-w-3xl text-center">
              <h2 className="font-display text-3xl font-semibold">{sec.title}</h2>
              <div className="mt-4 prose-store" dangerouslySetInnerHTML={{ __html: sec.data?.html ?? "" }} />
            </section>
          );
        return null;
      })}
    </div>
  );
}

function SectionHead({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <h2 className="font-display text-2xl md:text-3xl font-semibold">{title}</h2>
      <Link href={href} className="text-sm font-medium text-gray-600 hover:text-black flex items-center gap-1">View all <ArrowRight className="h-4 w-4" /></Link>
    </div>
  );
}
