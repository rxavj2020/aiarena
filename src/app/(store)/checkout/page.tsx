import { redirect } from "next/navigation";
import { resolveCart, computeTotals } from "@/lib/cart";
import { getSettings } from "@/lib/settings";
import { getSession } from "@/lib/auth";
import { activePaymentGateway } from "@/lib/plugins/store";
import { CheckoutForm } from "@/components/store/CheckoutForm";
import { getSavedAddresses } from "@/actions/checkout";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const lines = await resolveCart();
  if (!lines.length) redirect("/cart");
  const [s, session, addresses] = await Promise.all([getSettings(), getSession(), getSavedAddresses()]);
  const t = await computeTotals(lines);
  const gateway = activePaymentGateway();
  return (
    <div className="container-x py-10">
      <h1 className="font-display text-3xl md:text-4xl font-semibold mb-8">Checkout</h1>
      <CheckoutForm
        lines={lines.map((l) => ({ key: l.key, name: l.name, variantTitle: l.variantTitle, image: l.image, price: l.price, qty: l.qty }))}
        initialTotals={t}
        currency={s.currency}
        user={session ? { name: session.name, email: session.email } : null}
        addresses={addresses}
        codEnabled={s.shipping.codEnabled}
        codFee={s.shipping.codFee}
        gateway={gateway}
        tax={s.tax}
        estimateText={s.shipping.estimateText}
      />
    </div>
  );
}
