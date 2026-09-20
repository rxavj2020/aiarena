import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import { PageHeader } from "@/components/admin/PageHeader";
import { formatDate } from "@/lib/format";
import { isEnabled } from "@/lib/plugins/store";
import Link from "next/link";
export default function MailLog() {
  const rows = db.select().from(schema.mailLog).orderBy(desc(schema.mailLog.createdAt)).limit(200).all();
  const on = isEnabled("smtp");
  return (
    <div>
      <PageHeader title="Mail log" subtitle="Every transactional email the store tried to send." />
      {!on && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">The SMTP plugin is not enabled — emails are logged but not delivered. <Link href="/admin/plugins/smtp" className="underline font-medium">Configure email</Link></div>}
      <div className="card"><table className="data"><thead><tr><th>Time</th><th>To</th><th>Subject</th><th>Result</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td className="text-xs text-gray-500 whitespace-nowrap">{formatDate(r.createdAt)}</td><td>{r.to}</td><td>{r.subject}</td><td>{r.ok ? <span className="badge bg-green-100 text-green-800">sent</span> : <span className="badge bg-red-100 text-red-800" title={r.error ?? ""}>failed · {r.error?.slice(0, 60)}</span>}</td></tr>)}{rows.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-gray-500">No emails yet</td></tr>}</tbody></table></div>
    </div>
  );
}
