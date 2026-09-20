import { getSettings } from "@/lib/settings";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { readCart } from "@/lib/cart";
import { getSession } from "@/lib/auth";
import { listCategories } from "@/lib/catalog";
import { db, schema } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { getPluginState } from "@/lib/plugins/store";
import { WhatsAppButton } from "@/components/store/WhatsAppButton";
import { Analytics } from "@/components/store/Analytics";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [s, cart, session, categories] = await Promise.all([getSettings(), readCart(), getSession(), listCategories()]);
  const count = cart.reduce((a, l) => a + l.qty, 0);
  const footerPages = db.select({ slug: schema.pages.slug, title: schema.pages.title }).from(schema.pages).where(and(eq(schema.pages.published, true), eq(schema.pages.showInFooter, true))).all();
  const wa = getPluginState("whatsapp");
  const an = getPluginState("analytics");
  return (
    <div className="flex min-h-screen flex-col">
      <Header settings={s} cartCount={count} user={session} categories={categories} />
      <main className="flex-1">{children}</main>
      <Footer settings={s} pages={footerPages} categories={categories.filter((c) => !c.parentId).slice(0, 6)} />
      {wa.enabled && wa.config.number ? <WhatsAppButton number={wa.config.number} message={wa.config.message} /> : null}
      {an.enabled ? <Analytics ga4Id={an.config.ga4Id} metaPixelId={an.config.metaPixelId} /> : null}
    </div>
  );
}
