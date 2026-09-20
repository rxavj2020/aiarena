import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { desc, eq, sql } from "drizzle-orm";
import { formatMoney, formatDate } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function AccountPage() {
  const s = (await getSession())!;
  const set = await getSettings();
  const orders = db.select().from(schema.orders).where(eq(schema.orders.userId, s.id)).orderBy(desc(schema.orders.createdAt)).limit(3).all();
  const total = db.select({ n: sql<number>`count(*)`, sum: sql<number>`coalesce(sum(total),0)` }).from(schema.orders).where(eq(schema.orders.userId, s.id)).get();
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-6">Hello, {s.name.split(" ")[0]}</h1>
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="card p-5"><div className="text-xs text-gray-500">Total orders</div><div className="text-2xl font-semibold mt-1">{total?.n ?? 0}</div></div>
        <div className="card p-5"><div className="text-xs text-gray-500">Total spent</div><div className="text-2xl font-semibold mt-1">{formatMoney(total?.sum ?? 0, set.currency)}</div></div>
      </div>
      <div className="flex items-center justify-between mb-3"><h2 className="font-semibold">Recent orders</h2><Link href="/account/orders" className="text-sm underline">View all</Link></div>
      <div className="card divide-y">
        {orders.length === 0 && <div className="p-6 text-sm text-gray-500">No orders yet. <Link href="/shop" className="underline">Start shopping</Link></div>}
        {orders.map((o) => (
          <Link key={o.id} href={`/account/orders/${o.id}`} className="flex items-center justify-between p-4 text-sm hover:bg-gray-50">
            <div><div className="font-medium">Order #{o.orderNumber}</div><div className="text-xs text-gray-500">{formatDate(o.createdAt)}</div></div>
            <div className="flex items-center gap-4"><StatusBadge status={o.status} /><span className="font-medium">{formatMoney(o.total, set.currency)}</span></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
