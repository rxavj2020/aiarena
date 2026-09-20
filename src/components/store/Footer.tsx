import Link from "next/link";
import type { StoreSettings } from "@/lib/settings";
import type { Category } from "@/lib/db/schema";
import { Newsletter } from "./Newsletter";
import { Link2 } from "lucide-react";

export function Footer({ settings: s, pages, categories }: { settings: StoreSettings; pages: { slug: string; title: string }[]; categories: Category[] }) {
  return (
    <footer className="mt-20 border-t border-gray-200 bg-white">
      <div className="container-x py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="font-display text-2xl font-semibold">{s.storeName}</div>
          <p className="mt-3 text-sm text-gray-600 leading-relaxed">{s.tagline}</p>
          <p className="mt-4 text-xs text-gray-500 leading-relaxed">{s.address}<br />{s.supportEmail}<br />{s.supportPhone}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
            {Object.entries(s.social).filter(([, v]) => v).map(([k, v]) => <a key={k} href={v} target="_blank" rel="noreferrer" className="capitalize hover:text-black flex items-center gap-1"><Link2 className="h-3 w-3" />{k}</a>)}
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Shop</div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="/shop" className="hover:text-black">All products</Link></li>
            {categories.map((c) => (
              <li key={c.id}><Link href={`/shop?category=${c.slug}`} className="hover:text-black">{c.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Help</div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="/contact" className="hover:text-black">Contact us</Link></li>
            <li><Link href="/account/orders" className="hover:text-black">Track your order</Link></li>
            {pages.map((p) => (
              <li key={p.slug}><Link href={`/pages/${p.slug}`} className="hover:text-black">{p.title}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Stay in the loop</div>
          <p className="text-sm text-gray-600 mb-3">New arrivals, offers and stories — no spam.</p>
          <Newsletter />
        </div>
      </div>
      <div className="border-t border-gray-100">
        <div className="container-x py-5 flex flex-col sm:flex-row gap-2 items-center justify-between text-xs text-gray-500">
          <span>{s.footerText}</span>
          <span>UPI · Visa · Mastercard · RuPay · Net Banking · COD</span>
        </div>
      </div>
    </footer>
  );
}
