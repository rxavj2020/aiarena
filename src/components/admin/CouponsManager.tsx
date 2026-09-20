"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Coupon } from "@/lib/db/schema";
import { saveCoupon, deleteCoupon } from "@/actions/admin";
import { useToast, notify } from "@/components/ui/Toast";
import { Pencil, Trash2, Plus } from "lucide-react";
import { formatMoney } from "@/lib/format";

type F = { code: string; type: "percent" | "fixed" | "free_shipping"; value: number; minOrder: number; maxUses: number | null; startsAt: string; expiresAt: string; active: boolean };
const empty: F = { code: "", type: "percent", value: 10, minOrder: 0, maxUses: null, startsAt: "", expiresAt: "", active: true };

export function CouponsManager({ coupons }: { coupons: Coupon[] }) {
  const [editing, setEditing] = useState<string | null | "new">(null);
  const [f, setF] = useState<F>(empty);
  const [pending, start] = useTransition();
  const toast = useToast(); const router = useRouter();
  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) => start(async () => { const r = await fn(); notify(toast, r); if (r.ok) { setEditing(null); router.refresh(); } });
  const open = (c?: Coupon) => { setF(c ? { code: c.code, type: c.type, value: c.type === "fixed" ? c.value / 100 : c.value, minOrder: c.minOrder / 100, maxUses: c.maxUses, startsAt: c.startsAt?.slice(0, 10) ?? "", expiresAt: c.expiresAt?.slice(0, 10) ?? "", active: c.active } : empty); setEditing(c?.id ?? "new"); };
  const desc = (c: Coupon) => c.type === "percent" ? `${c.value}% off` : c.type === "fixed" ? `${formatMoney(c.value)} off` : "Free shipping";
  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      <div className="card">
        <div className="flex justify-end p-3 border-b"><button onClick={() => open()} className="btn-primary btn-sm"><Plus className="h-3.5 w-3.5" /> New coupon</button></div>
        <table className="data"><thead><tr><th>Code</th><th>Discount</th><th>Min order</th><th>Used</th><th>Valid</th><th>Status</th><th></th></tr></thead>
          <tbody>{coupons.map((c) => (
            <tr key={c.id}><td className="font-mono font-semibold">{c.code}</td><td>{desc(c)}</td><td>{c.minOrder ? formatMoney(c.minOrder) : "—"}</td><td>{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ""}</td><td className="text-xs text-gray-500">{c.startsAt?.slice(0, 10) ?? "now"} → {c.expiresAt?.slice(0, 10) ?? "∞"}</td><td><span className={`badge ${c.active ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`}>{c.active ? "active" : "inactive"}</span></td>
              <td className="text-right whitespace-nowrap"><button onClick={() => open(c)} className="btn-ghost p-1.5"><Pencil className="h-3.5 w-3.5" /></button><button onClick={() => confirm("Delete coupon?") && run(() => deleteCoupon(c.id))} className="btn-ghost p-1.5 text-red-600"><Trash2 className="h-3.5 w-3.5" /></button></td></tr>
          ))}{coupons.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gray-500">No coupons yet</td></tr>}</tbody></table>
      </div>
      {editing && (
        <div className="card p-5 h-fit space-y-3">
          <h3 className="font-semibold">{editing === "new" ? "New coupon" : "Edit coupon"}</h3>
          <div><label className="label">Code</label><input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} className="input font-mono uppercase" placeholder="SUMMER20" /></div>
          <div><label className="label">Type</label><select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as F["type"] })} className="input"><option value="percent">Percentage off</option><option value="fixed">Fixed amount off (₹)</option><option value="free_shipping">Free shipping</option></select></div>
          {f.type !== "free_shipping" && <div><label className="label">{f.type === "percent" ? "Percent" : "Amount (₹)"}</label><input type="number" value={f.value} onChange={(e) => setF({ ...f, value: Number(e.target.value) })} className="input" /></div>}
          <div className="grid grid-cols-2 gap-2"><div><label className="label">Min order (₹)</label><input type="number" value={f.minOrder} onChange={(e) => setF({ ...f, minOrder: Number(e.target.value) })} className="input" /></div><div><label className="label">Max uses</label><input type="number" value={f.maxUses ?? ""} onChange={(e) => setF({ ...f, maxUses: e.target.value ? Number(e.target.value) : null })} className="input" placeholder="∞" /></div></div>
          <div className="grid grid-cols-2 gap-2"><div><label className="label">Starts</label><input type="date" value={f.startsAt} onChange={(e) => setF({ ...f, startsAt: e.target.value })} className="input" /></div><div><label className="label">Expires</label><input type="date" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} className="input" /></div></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Active</label>
          <div className="flex gap-2 pt-2"><button disabled={pending || !f.code} onClick={() => run(() => saveCoupon(editing === "new" ? null : editing, { ...f, startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : null, expiresAt: f.expiresAt ? new Date(f.expiresAt + "T23:59:59").toISOString() : null }))} className="btn-primary flex-1">Save</button><button onClick={() => setEditing(null)} className="btn-outline">Cancel</button></div>
        </div>
      )}
    </div>
  );
}
