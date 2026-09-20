import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { formatMoney, formatDate } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { StatusBadge } from "@/components/ui/StatusBadge";
export const metadata = { title: "Your orders" };
export default async function OrdersPage() {
  const s = (await getSession())!;
  const set = await getSettings();
  const orders = db.select().from(schema.orders).where(eq(schema.orders.userId, s.id)).orderBy(desc(schema.orders.createdAt)).all();
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-6">Your orders</h1>
      <div className="card divide-y">
        {orders.length === 0 && <div className="p-6 text-sm text-gray-500">No orders yet.</div>}
        {orders.map((o) => (
          <Link key={o.id} href={`/account/orders/${o.id}`} className="flex items-center justify-between p-4 text-sm hover:bg-gray-50">
            <div><div className="font-medium">Order #{o.orderNumber}</div><div className="text-xs text-gray-500">{formatDate(o.createdAt)} · {o.paymentStatus}</div></div>
            <div className="flex items-center gap-4"><StatusBadge status={o.status} /><span className="font-medium">{formatMoney(o.total, set.currency)}</span></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
