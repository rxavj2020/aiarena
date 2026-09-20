"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import type { Order } from "@/lib/db/schema";
import { formatMoney, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { bulkOrderStatus, setOrderStatus } from "@/actions/admin";
import { useToast, notify } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { Printer } from "lucide-react";

const NEXT: Record<string, Order["status"] | undefined> = { pending: "confirmed", confirmed: "processing", processing: "shipped", shipped: "delivered" };

export function OrdersTable({ orders, currency }: { orders: Order[]; currency: string }) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const all = sel.size === orders.length && orders.length > 0;
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const bulk = (st: Order["status"]) => start(async () => { notify(toast, await bulkOrderStatus([...sel], st)); setSel(new Set()); router.refresh(); });
  const quick = (id: string, st: Order["status"]) => start(async () => { notify(toast, await setOrderStatus(id, st)); router.refresh(); });

  return (
    <div className={`card overflow-hidden ${pending ? "opacity-60" : ""}`}>
      {sel.size > 0 && (
        <div className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 text-sm">
          <span className="mr-2">{sel.size} selected</span>
          {(["confirmed", "processing", "shipped", "delivered", "cancelled"] as const).map((st) => <button key={st} onClick={() => bulk(st)} className="btn-sm btn bg-white/10 hover:bg-white/20 text-white capitalize">Mark {st}</button>)}
          <a href={`/admin/orders/print?ids=${[...sel].join(",")}`} target="_blank" className="btn-sm btn bg-white/10 hover:bg-white/20 text-white ml-auto"><Printer className="h-3.5 w-3.5" /> Print slips</a>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="data">
          <thead><tr><th className="w-8"><input type="checkbox" checked={all} onChange={() => setSel(all ? new Set() : new Set(orders.map((o) => o.id)))} /></th><th>Order</th><th>Customer</th><th>Items</th><th>Status</th><th>Payment</th><th className="text-right">Total</th><th></th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><input type="checkbox" checked={sel.has(o.id)} onChange={() => toggle(o.id)} /></td>
                <td><Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">#{o.orderNumber}</Link><div className="text-xs text-gray-400">{formatDate(o.createdAt)}</div></td>
                <td><div>{o.shippingAddress.name}</div><div className="text-xs text-gray-400">{o.shippingAddress.city} · {o.email}</div></td>
                <td className="text-gray-600 text-xs">{o.paymentProvider ?? "—"}</td>
                <td><StatusBadge status={o.status} /></td>
                <td><StatusBadge status={o.paymentStatus} /></td>
                <td className="text-right font-medium">{formatMoney(o.total, currency)}</td>
                <td className="text-right whitespace-nowrap">
                  {NEXT[o.status] && <button onClick={() => quick(o.id, NEXT[o.status]!)} className="btn-outline btn-sm capitalize">→ {NEXT[o.status]}</button>}
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-gray-500">No orders found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
