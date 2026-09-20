import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getOrder } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { OrderDetail } from "@/components/store/OrderDetail";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const s = (await getSession())!;
  const data = getOrder((await params).id);
  if (!data || (data.order.userId !== s.id && s.role !== "admin")) notFound();
  const set = await getSettings();
  return <OrderDetail {...data} currency={set.currency} />;
}
