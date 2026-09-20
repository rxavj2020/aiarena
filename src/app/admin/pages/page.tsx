import { db, schema } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { PagesManager } from "@/components/admin/PagesManager";
export default function PagesAdmin() {
  const pages = db.select().from(schema.pages).all();
  return <div><PageHeader title="Pages" subtitle="Static pages like About, Shipping policy, FAQ. Available at /pages/slug." /><PagesManager pages={pages} /></div>;
}
