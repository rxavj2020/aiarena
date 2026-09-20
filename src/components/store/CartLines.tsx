"use client";
import Link from "next/link";
import { useTransition } from "react";
import { updateQty } from "@/actions/cart";
import type { ResolvedLine } from "@/lib/cart";
import { formatMoney } from "@/lib/format";
import { Minus, Plus, Trash2, Heart, Truck } from "lucide-react";

export function CartLines({ lines, currency }: { lines: ResolvedLine[]; currency: string }) {
  const [pending, start] = useTransition();
  return (
    <div className={`${pending ? "opacity-60 pointer-events-none" : ""} divide-y divide-gray-100`}>
      {lines.map((l) => (
        <div key={l.key} className="flex gap-4 p-4 group hover:bg-gray-50/50 transition">
          <Link href={`/products/${l.slug}`} className="h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-xl bg-[#f8f9fb] border border-gray-100">
            {l.image && <img src={l.image} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />}
          </Link>
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <Link href={`/products/${l.slug}`} className="font-medium text-sm leading-snug line-clamp-2 hover:text-gray-900">
                {l.name}
              </Link>
              <button
                className="text-gray-400 hover:text-rose-600 p-1.5 rounded-full hover:bg-rose-50 transition shrink-0"
                onClick={() => start(() => updateQty(l.key, 0))}
                title="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {l.variantTitle && <div className="mt-1 inline-flex text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full w-fit">{l.variantTitle}</div>}

            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-bold text-sm">{formatMoney(l.price, currency)}</span>
              <span className="text-xs text-gray-500">× {l.qty}</span>
              <span className="text-xs text-emerald-700 font-medium ml-auto sm:hidden">{formatMoney(l.price * l.qty, currency)}</span>
            </div>

            {l.trackStock && l.qty > l.stock && <div className="mt-1 text-xs text-red-600 bg-red-50 border border-red-100 rounded-full px-2.5 py-1 w-fit">Only {l.stock} left in stock</div>}

            <div className="mt-auto pt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-full border border-gray-200 bg-white shadow-sm">
                  <button className="h-8 w-8 flex items-center justify-center hover:bg-gray-50 rounded-l-full" onClick={() => start(() => updateQty(l.key, l.qty - 1))}>
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold">{l.qty}</span>
                  <button className="h-8 w-8 flex items-center justify-center hover:bg-gray-50 rounded-r-full" onClick={() => start(() => updateQty(l.key, l.qty + 1))}>
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button className="hidden sm:flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 px-2.5 py-1.5 rounded-full hover:bg-white border border-transparent hover:border-gray-200">
                  <Heart className="h-3.5 w-3.5" /> Save for later
                </button>
              </div>

              <div className="hidden sm:flex flex-col items-end">
                <span className="font-bold text-sm">{formatMoney(l.price * l.qty, currency)}</span>
                <span className="text-[11px] text-emerald-700 flex items-center gap-1">
                  <Truck className="h-3 w-3" /> Free delivery
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
