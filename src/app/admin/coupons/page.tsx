import { db, schema } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { CouponsManager } from "@/components/admin/CouponsManager";
export default function CouponsPage() {
  const coupons = db.select().from(schema.coupons).all();
  return <div><PageHeader title="Coupons & discounts" subtitle="Percentage, fixed-amount and free-shipping codes with usage limits." /><CouponsManager coupons={coupons} /></div>;
}
