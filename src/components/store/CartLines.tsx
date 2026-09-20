"use client";
import Link from "next/link";
import { useTransition } from "react";
import { updateQty } from "@/actions/cart";
import type { ResolvedLine } from "@/lib/cart";
import { formatMoney } from "@/lib/format";
import { Minus, Plus, Trash2 } from "lucide-react";

export function CartLines({ lines, currency }: { lines: ResolvedLine[]; currency: string }) {
  const [pending, start] = useTransition();
  return (
    <div className={`card divide-y ${pending ? "opacity-60" : ""}`}>
      {lines.map((l) => (
        <div key={l.key} className="flex gap-4 p-4">
          <Link href={`/products/${l.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">{l.image && <img src={l.image} alt="" className="h-full w-full object-cover" />}</Link>
          <div className="flex-1 min-w-0">
            <Link href={`/products/${l.slug}`} className="font-medium hover:underline line-clamp-1">{l.name}</Link>
            {l.variantTitle && <div className="text-xs text-gray-500">{l.variantTitle}</div>}
            <div className="text-sm text-gray-700 mt-1">{formatMoney(l.price, currency)}</div>
            {l.trackStock && l.qty > l.stock && <div className="text-xs text-red-600 mt-1">Only {l.stock} in stock</div>}
            <div className="mt-3 flex items-center gap-3">
              <div className="flex items-center rounded-lg border">
                <button className="p-1.5 hover:bg-gray-50" onClick={() => start(() => updateQty(l.key, l.qty - 1))}><Minus className="h-3.5 w-3.5" /></button>
                <span className="w-8 text-center text-sm">{l.qty}</span>
                <button className="p-1.5 hover:bg-gray-50" onClick={() => start(() => updateQty(l.key, l.qty + 1))}><Plus className="h-3.5 w-3.5" /></button>
              </div>
              <button className="text-gray-400 hover:text-red-600" onClick={() => start(() => updateQty(l.key, 0))}><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="font-semibold text-sm">{formatMoney(l.price * l.qty, currency)}</div>
        </div>
      ))}
    </div>
  );
}
