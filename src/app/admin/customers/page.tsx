import { db, schema } from "@/lib/db";
import { desc, sql, like } from "drizzle-orm";
import { PageHeader } from "@/components/admin/PageHeader";
import { formatMoney, formatDate } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { RoleToggle } from "@/components/admin/RoleToggle";
import { getSession } from "@/lib/auth";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const s = await getSettings();
  const me = (await getSession())!;
  const users = db.select({ u: schema.users, n: sql<number>`(select count(*) from orders where orders.user_id = users.id)`, v: sql<number>`(select coalesce(sum(total),0) from orders where orders.user_id = users.id and payment_status in ('paid','cod'))` }).from(schema.users).where(q ? like(schema.users.email, `%${q}%`) : undefined).orderBy(desc(schema.users.createdAt)).all();
  const subs = db.select({ n: sql<number>`count(*)` }).from(schema.subscribers).get()!.n;
  return (
    <div>
      <PageHeader title="Customers" subtitle={`${users.length} accounts · ${subs} newsletter subscribers`}>
        <a href="/api/admin/export?type=subscribers" className="btn-outline btn-sm">Export subscribers</a>
        <a href="/api/admin/export?type=customers" className="btn-outline btn-sm">Export customers</a>
      </PageHeader>
      <form className="mb-4"><input name="q" defaultValue={q} placeholder="Search by email" className="input w-72 py-1.5" /></form>
      <div className="card"><table className="data"><thead><tr><th>Customer</th><th>Joined</th><th className="text-right">Orders</th><th className="text-right">Lifetime value</th><th>Role</th></tr></thead>
        <tbody>{users.map(({ u, n, v }) => <tr key={u.id}><td><div className="font-medium">{u.name}</div><div className="text-xs text-gray-500">{u.email}{u.phone && ` · ${u.phone}`}</div></td><td className="text-xs text-gray-500">{formatDate(u.createdAt)}</td><td className="text-right">{n}</td><td className="text-right font-medium">{formatMoney(v, s.currency)}</td><td><RoleToggle userId={u.id} role={u.role} isMe={u.id === me.id} /></td></tr>)}</tbody></table></div>
    </div>
  );
}
