import Link from "next/link";
import type { StoreSettings } from "@/lib/settings";
import type { Category } from "@/lib/db/schema";
import { Newsletter } from "./Newsletter";
import { Link2, Truck, ShieldCheck, RefreshCw, Headphones, MapPin, Mail, Phone, ArrowRight } from "lucide-react";

export function Footer({ settings: s, pages, categories }: { settings: StoreSettings; pages: { slug: string; title: string }[]; categories: Category[] }) {
  return (
    <footer className="mt-12 bg-gray-950 text-gray-300">
      {/* Top USP */}
      <div className="border-b border-white/10 bg-white/[0.02]">
        <div className="container-x py-4 grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center"><Truck className="h-4 w-4" /></div><div><div className="font-bold text-white text-xs">Free Shipping</div><div className="text-white/60 text-[11px]">Over ₹500 orders</div></div></div>
          <div className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center"><ShieldCheck className="h-4 w-4" /></div><div><div className="font-bold text-white text-xs">Secure Payment</div><div className="text-white/60 text-[11px]">100% secure checkout</div></div></div>
          <div className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center"><RefreshCw className="h-4 w-4" /></div><div><div className="font-bold text-white text-xs">Easy Returns</div><div className="text-white/60 text-[11px]">7 days return policy</div></div></div>
          <div className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center"><Headphones className="h-4 w-4" /></div><div><div className="font-bold text-white text-xs">24/7 Support</div><div className="text-white/60 text-[11px]">Dedicated support</div></div></div>
        </div>
      </div>

      <div className="container-x py-12 grid gap-10 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-white text-gray-900 flex items-center justify-center font-bold text-lg">{s.storeName[0]?.toUpperCase()}</div>
            <div className="font-display text-xl font-bold text-white tracking-tight">{s.storeName}</div>
          </div>
          <p className="mt-4 text-sm text-white/60 leading-relaxed max-w-sm">{s.tagline}</p>
          <div className="mt-5 space-y-2 text-xs text-white/50">
            <div className="flex items-start gap-2"><MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span>{s.address}</span></div>
            <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0" />{s.supportEmail}</div>
            <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0" />{s.supportPhone}</div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {Object.entries(s.social).filter(([, v]) => v).map(([k, v]) => (
              <a key={k} href={v} target="_blank" rel="noreferrer" className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                <Link2 className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-white mb-4">Shop</div>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/shop" className="text-white/60 hover:text-white transition flex items-center gap-1 group">All products <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition" /></Link></li>
            {categories.slice(0, 6).map((c) => (
              <li key={c.id}><Link href={`/shop?category=${c.slug}`} className="text-white/60 hover:text-white transition">{c.name}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-white mb-4">Help</div>
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
          <div className="text-xs font-bold uppercase tracking-widest text-white mb-4">Stay in the loop</div>
          <p className="text-sm text-white/60 mb-4">Get updates on new arrivals and exclusive offers.</p>
          <Newsletter />
          <div className="mt-6">
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">We accept</div>
            <div className="flex flex-wrap gap-1.5 text-[10px]">
              {["UPI", "Visa", "Mastercard", "RuPay", "NetBanking", "COD"].map((m) => (
                <span key={m} className="px-2 py-1 rounded-full bg-white/10 border border-white/10 text-white/60 font-medium">{m}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x py-5 flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
          <span className="text-white/40">{s.footerText}</span>
          <span className="text-white/30 text-[11px]">Made with ❤️ in India · Mobile app ready · Flipkart/Amazon grade experience</span>
        </div>
      </div>
    </footer>
  );
}
