import { db, schema } from "@/lib/db";
import { desc, sql, and, like, or, eq } from "drizzle-orm";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/admin/PageHeader";
import { OrdersTable } from "@/components/admin/OrdersTable";
import Link from "next/link";

const STATUSES = ["all", "open", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string; pay?: string }> }) {
  const sp = await searchParams;
  const s = await getSettings();
  const conds = [];
  if (sp.status === "open") conds.push(sql`status in ('pending','confirmed','processing')`);
  else if (sp.status && sp.status !== "all") conds.push(eq(schema.orders.status, sp.status as schema.Order["status"]));
  if (sp.pay) conds.push(eq(schema.orders.paymentStatus, sp.pay as schema.Order["paymentStatus"]));
  if (sp.q) conds.push(or(like(schema.orders.email, `%${sp.q}%`), like(schema.orders.shippingAddress, `%${sp.q}%`), sql`cast(order_number as text) like ${"%" + sp.q + "%"}`, like(schema.orders.paymentRef, `%${sp.q}%`))!);
  const where = conds.length ? and(...conds) : undefined;
  const page = Number(sp.page || 1), per = 25;
  const total = db.select({ n: sql<number>`count(*)` }).from(schema.orders).where(where).get()!.n;
  const orders = db.select().from(schema.orders).where(where).orderBy(desc(schema.orders.createdAt)).limit(per).offset((page - 1) * per).all();
  const counts = db.select({ st: schema.orders.status, n: sql<number>`count(*)` }).from(schema.orders).groupBy(schema.orders.status).all();
  const cnt = (st: string) => (st === "all" ? counts.reduce((a, c) => a + c.n, 0) : st === "open" ? counts.filter((c) => ["pending", "confirmed", "processing"].includes(c.st)).reduce((a, c) => a + c.n, 0) : counts.find((c) => c.st === st)?.n ?? 0);

  return (
    <div>
      <PageHeader title="Orders" subtitle={`${total} orders`}>
        <a href="/api/admin/export?type=orders" className="btn-outline btn-sm">Export CSV</a>
      </PageHeader>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {STATUSES.map((st) => <Link key={st} href={`/admin/orders?status=${st}${sp.q ? `&q=${sp.q}` : ""}`} className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${(sp.status ?? "all") === st ? "bg-gray-900 text-white" : "bg-white border hover:bg-gray-50"}`}>{st} <span className="opacity-60">{cnt(st)}</span></Link>)}
        <form className="ml-auto flex gap-2">{sp.status && <input type="hidden" name="status" value={sp.status} />}<input name="q" defaultValue={sp.q} placeholder="Search #, email, name, payment ref" className="input w-72 py-1.5" /><button className="btn-outline btn-sm">Search</button></form>
      </div>
      <OrdersTable orders={orders} currency={s.currency} />
      {total > per && <div className="mt-4 flex gap-2 justify-end">{Array.from({ length: Math.ceil(total / per) }, (_, i) => <Link key={i} href={`/admin/orders?status=${sp.status ?? "all"}&page=${i + 1}`} className={`btn-sm btn ${page === i + 1 ? "bg-gray-900 text-white" : "bg-white border"}`}>{i + 1}</Link>)}</div>}
    </div>
  );
}
