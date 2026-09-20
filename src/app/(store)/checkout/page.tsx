import { redirect } from "next/navigation";
import { resolveCart, computeTotals } from "@/lib/cart";
import { getSettings } from "@/lib/settings";
import { getSession } from "@/lib/auth";
import { activePaymentGateway } from "@/lib/plugins/store";
import { CheckoutForm } from "@/components/store/CheckoutForm";
import { getSavedAddresses } from "@/actions/checkout";
import { ShieldCheck, Truck, Lock } from "lucide-react";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const lines = await resolveCart();
  if (!lines.length) redirect("/cart");
  const [s, session, addresses] = await Promise.all([getSettings(), getSession(), getSavedAddresses()]);
  const t = await computeTotals(lines);
  const gateway = activePaymentGateway();

  return (
    <div className="bg-[#f8f9fb] min-h-screen">
      <div className="bg-white border-b">
        <div className="container-x py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">✓</div>
            <div>
              <div className="font-bold text-sm">Secure Checkout</div>
              <div className="text-xs text-gray-500">{lines.reduce((a, b) => a + b.qty, 0)} items · Encrypted</div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> 256-bit SSL</span>
            <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Buyer protection</span>
            <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Fast delivery</span>
          </div>
        </div>
      </div>

      <div className="container-x py-6">
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
    </div>
  );
}
