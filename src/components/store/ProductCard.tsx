import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { Star } from "lucide-react";
import type { Product } from "@/lib/db/schema";

export function ProductCard({ p, currency }: { p: Product & { rating?: number; reviewCount?: number }; currency: string }) {
  const off = p.compareAtPrice && p.compareAtPrice > p.price ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100) : 0;
  const out = p.trackStock && p.stock <= 0;
  return (
    <Link href={`/products/${p.slug}`} className="group card overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {p.images[0] && <img src={p.images[0]} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
        {p.images[1] && <img src={p.images[1]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />}
        {off > 0 && <span className="absolute left-3 top-3 badge bg-accent text-white">-{off}%</span>}
        {out && <span className="absolute right-3 top-3 badge bg-gray-900 text-white">Sold out</span>}
      </div>
      <div className="p-4">
        <h3 className="text-sm font-medium line-clamp-1">{p.name}</h3>
        <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{p.shortDescription}</p>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold">{formatMoney(p.price, currency)}</span>
            {off > 0 && <span className="text-xs text-gray-400 line-through">{formatMoney(p.compareAtPrice!, currency)}</span>}
          </div>
          {p.reviewCount ? (
            <span className="flex items-center gap-1 text-xs text-gray-600"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{p.rating?.toFixed(1)}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
