import Link from "next/link";
import type { StoreSettings } from "@/lib/settings";
import type { Category } from "@/lib/db/schema";
import { Newsletter } from "./Newsletter";
import { Link2, Truck, ShieldCheck, RefreshCw, Headphones, MapPin, Mail, Phone, ArrowRight, Gem } from "lucide-react";

export function Footer({ settings: s, pages, categories }: { settings: StoreSettings; pages: { slug: string; title: string }[]; categories: Category[] }) {
  return (
    <footer className="mt-12 bg-[#172337] text-white">
      {/* Top USP - Flipkart style dark */}
      <div className="border-b border-white/10 bg-white/[0.03]">
        <div className="container-x py-4 grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-full bg-[#fb641b]/20 flex items-center justify-center"><Truck className="h-4 w-4 text-[#fb641b]" /></div><div><div className="font-bold text-white text-xs">Free Delivery</div><div className="text-white/60 text-[11px]">On orders above ₹999</div></div></div>
          <div className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-full bg-[#388e3c]/20 flex items-center justify-center"><ShieldCheck className="h-4 w-4 text-[#388e3c]" /></div><div><div className="font-bold text-white text-xs">100% Genuine</div><div className="text-white/60 text-[11px]">Assured products</div></div></div>
          <div className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-full bg-[#2874f0]/20 flex items-center justify-center"><RefreshCw className="h-4 w-4 text-[#2874f0]" /></div><div><div className="font-bold text-white text-xs">Easy Returns</div><div className="text-white/60 text-[11px]">7 days return · Jewellery exchange</div></div></div>
          <div className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center"><Gem className="h-4 w-4" /></div><div><div className="font-bold text-white text-xs">Clothing & Jewellery</div><div className="text-white/60 text-[11px]">Curated collections</div></div></div>
        </div>
      </div>

      <div className="container-x py-10 grid gap-8 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-full bg-[#2874f0] text-white flex items-center justify-center font-bold text-lg shadow-sm">{s.storeName[0]?.toUpperCase()}</div>
            <div className="font-bold text-xl text-white tracking-tight">{s.storeName}</div>
            <span className="ml-2 bg-[#fb641b] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Clothing & Jewellery</span>
          </div>
          <p className="mt-4 text-sm text-white/60 leading-relaxed max-w-sm">{s.tagline}</p>
          <div className="mt-5 space-y-2 text-xs text-white/50">
            <div className="flex items-start gap-2"><MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span>{s.address}</span></div>
            <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0" />{s.supportEmail}</div>
            <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0" />{s.supportPhone}</div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {Object.entries(s.social).filter(([, v]) => v).map(([k, v]) => (
              <a key={k} href={v} target="_blank" rel="noreferrer" className="h-8 w-8 rounded-full bg-white/10 hover:bg-[#2874f0] flex items-center justify-center transition">
                <Link2 className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Shop</div>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/shop" className="text-white/60 hover:text-white transition flex items-center gap-1 group">All products <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition" /></Link></li>
            <li><Link href="/shop?category=clothing" className="text-white/60 hover:text-white transition">Clothing</Link></li>
            <li><Link href="/shop?category=jewellery" className="text-white/60 hover:text-white transition">Jewellery</Link></li>
            {categories.slice(0, 6).map((c) => (
              <li key={c.id}><Link href={`/shop?category=${c.slug}`} className="text-white/60 hover:text-white transition">{c.name}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Help</div>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/contact" className="text-white/60 hover:text-white transition">Contact us</Link></li>
            <li><Link href="/account/orders" className="text-white/60 hover:text-white transition">Track order</Link></li>
            <li><Link href="/shop" className="text-white/60 hover:text-white transition">Shipping info</Link></li>
            <li><Link href="/shop" className="text-white/60 hover:text-white transition">Returns & exchanges</Link></li>
            {pages.map((p) => (
              <li key={p.slug}><Link href={`/pages/${p.slug}`} className="text-white/60 hover:text-white transition">{p.title}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Stay in the loop</div>
          <p className="text-sm text-white/60 mb-4">Get updates on new clothing & jewellery arrivals.</p>
          <Newsletter />
          <div className="mt-6">
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2">We accept</div>
            <div className="flex flex-wrap gap-1.5 text-[10px]">
              {["UPI", "Visa", "Mastercard", "RuPay", "NetBanking", "COD"].map((m) => (
                <span key={m} className="px-2 py-1 rounded-full bg-white/10 border border-white/10 text-white/60 font-medium">{m}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#0f1a2b]">
        <div className="container-x py-5 flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
          <span className="text-white/40">{s.footerText}</span>
          <span className="text-white/30 text-[11px] flex items-center gap-2"><span className="h-4 w-4 rounded-full bg-[#2874f0] flex items-center justify-center text-[8px]">✓</span> Flipkart Assured · Made with ❤️ in India</span>
        </div>
      </div>
    </footer>
  );
}
