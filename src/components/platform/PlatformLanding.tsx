import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Check,
  Cloud,
  CreditCard,
  Globe2,
  Layers,
  LockKeyhole,
  Palette,
  Rocket,
  ShieldCheck,
  Store,
  Truck,
  Zap,
  ChevronDown,
} from "lucide-react";

/**
 * Marketing website of the Aurelia platform. The platform is its own product:
 * subscriber websites live elsewhere and are never part of this chrome.
 */
export function PlatformLanding() {
  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#181817]">
      <header className="sticky top-0 z-40 border-b border-black/5 bg-[#f7f7f5]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/platform" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#11110f] text-[#e9c78d]"><Store className="h-5 w-5" /></span>
            <span>
              <span className="block font-display text-[17px] font-bold tracking-tight">Aurelia Studio</span>
              <span className="block text-[10px] uppercase tracking-[0.24em] text-black/40">Commerce OS</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-black/55 md:flex">
            <a href="#features" className="hover:text-black">Features</a>
            <a href="#how" className="hover:text-black">How it works</a>
            <a href="#pricing" className="hover:text-black">Pricing</a>
            <a href="#faq" className="hover:text-black">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/platform/login" className="rounded-full px-3 py-2 text-sm font-bold text-black/60 transition hover:bg-white hover:text-black">Sign in</Link>
            <Link href="/platform/signup" className="rounded-full bg-[#11110f] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-black">Start building <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-[1240px] px-5 pb-16 pt-12 sm:px-8 sm:pt-20 lg:pb-24">
          <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#f3eadb] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#9b682d]"><Zap className="h-3.5 w-3.5" /> Fast, safe commerce infrastructure</div>
              <h1 className="font-display text-5xl font-bold leading-[0.96] tracking-[-0.04em] sm:text-7xl">Your brand deserves more than a template.</h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-black/55 sm:text-lg">Build a distinctive e-commerce website, run it from one calm store admin, and give customers a public store that feels completely yours — with your theme on every page.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/platform/signup" className="inline-flex items-center gap-2 rounded-xl bg-[#11110f] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-black">Create your store <ArrowRight className="h-4 w-4" /></Link>
                <Link href="/store/aurelia" className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3.5 text-sm font-bold transition hover:border-black/30">See a live store <Globe2 className="h-4 w-4" /></Link>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-black/45">
                <span><Check className="mr-1 inline h-3.5 w-3.5 text-emerald-600" /> Real data first</span>
                <span><Check className="mr-1 inline h-3.5 w-3.5 text-emerald-600" /> Custom domains</span>
                <span><Check className="mr-1 inline h-3.5 w-3.5 text-emerald-600" /> Site-wide themes</span>
                <span><Check className="mr-1 inline h-3.5 w-3.5 text-emerald-600" /> Plugin-ready</span>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[32px] bg-[#11110f] p-5 text-white shadow-2xl sm:p-7">
              <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-[#e9c78d]/20 blur-3xl" />
              <div className="relative rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e9c78d] text-[#11110f]"><Store className="h-4 w-4" /></span><span className="text-sm font-bold">Your store</span></div>
                  <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">LIVE CONTROL</span>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-white/[0.06] p-3"><div className="text-[10px] uppercase tracking-wider text-white/35">Products</div><div className="mt-3 text-lg font-bold">Your catalogue</div><div className="mt-1 text-[10px] text-emerald-300">Firestore-backed</div></div>
                  <div className="rounded-2xl bg-white/[0.06] p-3"><div className="text-[10px] uppercase tracking-wider text-white/35">Orders</div><div className="mt-3 text-lg font-bold">Your customers</div><div className="mt-1 text-[10px] text-emerald-300">Real data only</div></div>
                  <div className="rounded-2xl bg-white/[0.06] p-3"><div className="text-[10px] uppercase tracking-wider text-white/35">Health</div><div className="mt-3 text-lg font-bold">Protected</div><div className="mt-1 text-[10px] text-[#e9c78d]">Encrypted</div></div>
                </div>
                <div className="mt-3 rounded-2xl bg-[#e9c78d] p-4 text-[#11110f]">
                  <div className="flex items-center justify-between"><div><div className="text-[10px] font-bold uppercase tracking-wider text-[#11110f]/50">Public storefront</div><div className="mt-1 text-sm font-bold">yourbrand.aurelia.app</div></div><Globe2 className="h-5 w-5" /></div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#11110f]/10"><div className="h-full w-[82%] rounded-full bg-[#11110f]" /></div>
                  <div className="mt-2 text-[10px] font-semibold text-[#11110f]/50">Brand setup 82% complete</div>
                </div>
              </div>
              <div className="relative mt-4 flex items-center gap-3 text-xs text-white/45"><ShieldCheck className="h-4 w-4 text-[#e9c78d]" /> Credentials encrypted · Firestore connected · Domain ready</div>
            </div>
          </div>
        </section>

        {/* Social proof strip */}
        <section className="border-y border-black/10 bg-white">
          <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-6 px-5 py-10 sm:px-8 lg:grid-cols-4">
            {[["3", "layers", "Platform, admin and public website — cleanly separated."], ["2 min", "to launch", "Pick a name and URL, publish when you're ready."], ["8+", "integrations", "Payments, email, shipping, storage and analytics."], ["100%", "yours", "Your data, your domain, your theme on every page."]].map(([big, small, text]) => (
              <div key={small}>
                <div className="font-display text-3xl font-bold tracking-tight">{big} <span className="text-base font-semibold text-black/35">{small}</span></div>
                <p className="mt-2 text-sm leading-6 text-black/50">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Three layers */}
        <section id="features" className="border-b border-black/10 bg-white">
          <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8">
            <div className="max-w-2xl">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/35">One platform, three layers</div>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Everything your commerce brand needs to move from idea to checkout.</h2>
            </div>
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              <Layer number="01" icon={<Palette className="h-5 w-5" />} title="Aurelia platform" text="Create your store, choose a plan, connect data and shape a brand without wrestling with infrastructure." />
              <Layer number="02" icon={<LockKeyhole className="h-5 w-5" />} title="Your store admin" text="Run catalogue, orders, customers, content, integrations and analytics from one private control room." />
              <Layer number="03" icon={<Globe2 className="h-5 w-5" />} title="Your public website" text="Give customers a fast, secure storefront on an Aurelia URL or the custom domain they already know — with your theme on every page." />
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8">
          <div className="max-w-2xl">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/35">Built in, not bolted on</div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Serious commerce tools, calmly designed.</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Feature icon={<Palette className="h-5 w-5" />} title="Site-wide themes" text="Pick a theme once — presets, colours, type and corners apply to every page of your website, and shoppers can keep a light or dark mode." />
            <Feature icon={<Store className="h-5 w-5" />} title="Storefront that converts" text="Fast product pages, variants, coupons, COD or online payments, order tracking and a checkout that stays on your site." />
            <Feature icon={<BarChart3 className="h-5 w-5" />} title="Admin that thinks" text="An overview dashboard with the pulse of your store, plus focused tools for products, orders, plugins and settings." />
            <Feature icon={<Cloud className="h-5 w-5" />} title="Firestore first" text="Bring real catalogue and customer data. No fake records in new stores." />
            <Feature icon={<ShieldCheck className="h-5 w-5" />} title="Safe by default" text="Tenant credentials are encrypted and kept out of the browser." />
            <Feature icon={<Rocket className="h-5 w-5" />} title="Launch quickly" text="Start with your identity, connect a domain and publish when ready." />
            <Feature icon={<CreditCard className="h-5 w-5" />} title="Payments your way" text="Razorpay or Cashfree online checkout, or cash on delivery with a handling fee." />
            <Feature icon={<Truck className="h-5 w-5" />} title="Shipping & fulfilment" text="Flat rates, free-shipping thresholds, tracking links and delivery estimates." />
            <Feature icon={<BadgeCheck className="h-5 w-5" />} title="Made for brands" text="Your logo, your content, your plugins — nothing about the platform gets in your customer's way." />
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-y border-black/10 bg-[#fafaf8]">
          <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8">
            <div className="max-w-2xl">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/35">How it works</div>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">From idea to live store in three steps.</h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[["1", "Name it", "Choose your brand name and public URL. Your private admin and website are created instantly."], ["2", "Make it yours", "Pick a theme, add products, connect your database and payments — guided, step by step."], ["3", "Open the doors", "Publish on your Aurelia URL or your own domain. Orders land in your admin the same minute."]].map(([n, t, d]) => (
                <div key={n} className="rounded-[22px] border border-black/10 bg-white p-6">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#11110f] text-sm font-bold text-[#e9c78d]">{n}</span>
                  <h3 className="mt-5 font-display text-xl font-bold">{t}</h3>
                  <p className="mt-2 text-sm leading-6 text-black/50">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8">
          <div className="max-w-2xl">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/35">Pricing</div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Start free. Grow when it grows.</h2>
            <p className="mt-3 text-sm leading-6 text-black/50">Every plan includes your own website, admin, themes and encrypted integrations. Change plans any time.</p>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            <PriceCard name="Starter" price="Free" note="For first collections" items={["Public website with themes", "Product & order admin", "COD + online payments", "Aurelia URL"]} cta="Start free" />
            <PriceCard name="Growth" price="₹999" suffix="/mo" note="For brands finding their pace" highlight items={["Everything in Starter", "Custom domain", "Coupons & campaigns", "Email + shipping plugins", "Priority support"]} cta="Choose Growth" />
            <PriceCard name="Scale" price="₹2,999" suffix="/mo" note="For stores on the move" items={["Everything in Growth", "Advanced integrations", "Multi-channel sync", "Dedicated onboarding"]} cta="Talk to us" />
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-black/10 bg-white">
          <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8">
            <div className="max-w-2xl">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/35">FAQ</div>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Questions, answered.</h2>
            </div>
            <div className="mt-8 grid gap-3 lg:grid-cols-2">
              {[
                ["Is my store separate from the platform?", "Completely. Your website has its own URL, theme, cart and orders. The Aurelia platform is where you manage it — customers never land in it."],
                ["Does my theme apply to every page?", "Yes. The theme you pick in your admin is applied site-wide — home, shop, product, cart, checkout and tracking — and shoppers can switch light/dark without losing it."],
                ["Can I use my own domain?", "Yes, on Growth and Scale. Point a CNAME at aurelia.app and verify from your admin — the whole website serves on your domain."],
                ["Where does my data live?", "In your own Firestore project, namespaced to your store, with credentials encrypted at rest. You can export or sync at any time."],
                ["Do customers see Aurelia branding?", "Only a small footer credit. Your brand, logo and theme run the entire shopping experience."],
                ["What do I need to start?", "A name and an email. Products, payments and domains come after — in any order you like."],
              ].map(([q, a]) => (
                <details key={q} className="group rounded-2xl border border-black/10 bg-[#fafaf8] p-5 open:bg-white open:shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold">
                    {q}
                    <ChevronDown className="h-4 w-4 shrink-0 text-black/30 transition group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-black/55">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-5 mb-12 overflow-hidden rounded-[28px] bg-[#e9c78d] sm:mx-8">
          <div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-6 px-6 py-12 sm:flex-row sm:items-center sm:px-10">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight">Ready to build your corner of the internet?</h2>
              <p className="mt-2 text-sm text-[#11110f]/60">Create your private store. Connect your database. Make it yours.</p>
            </div>
            <Link href="/platform/signup" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#11110f] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-black">Start for your brand <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/10 bg-white">
        <div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#11110f] text-[#e9c78d]"><Store className="h-4 w-4" /></span>
              <span className="font-display text-base font-bold tracking-tight">Aurelia Studio</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-6 text-black/45">Commerce infrastructure for brands that want their own corner of the internet — fast, safe and unmistakably theirs.</p>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/35">Product</div>
            <ul className="mt-3 space-y-2 text-sm text-black/55">
              <li><a href="#features" className="hover:text-black">Features</a></li>
              <li><a href="#pricing" className="hover:text-black">Pricing</a></li>
              <li><Link href="/store/aurelia" className="hover:text-black">Live demo store</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/35">Platform</div>
            <ul className="mt-3 space-y-2 text-sm text-black/55">
              <li><Link href="/platform/login" className="hover:text-black">Sign in</Link></li>
              <li><Link href="/platform/signup" className="hover:text-black">Create store</Link></li>
              <li><a href="#faq" className="hover:text-black">FAQ</a></li>
            </ul>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/35">Promise</div>
            <ul className="mt-3 space-y-2 text-sm text-black/55">
              <li className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Encrypted credentials</li>
              <li className="flex items-center gap-2"><Layers className="h-3.5 w-3.5 text-emerald-600" /> Isolated stores</li>
              <li className="flex items-center gap-2"><BadgeCheck className="h-3.5 w-3.5 text-emerald-600" /> Your data, exportable</li>
            </ul>
          </div>
        </div>
        <div className="mx-auto flex max-w-[1240px] justify-between gap-4 border-t border-black/5 px-5 py-6 text-xs text-black/40 sm:px-8">
          <span>© {new Date().getFullYear()} Aurelia Studio</span>
          <span>Fast · safe · yours</span>
        </div>
      </footer>
    </div>
  );
}

function Layer({ number, icon, title, text }: { number: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[22px] border border-black/10 bg-[#fafaf8] p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-black/30">{number}</span>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f3eadb] text-[#9b682d]">{icon}</span>
      </div>
      <h3 className="mt-7 font-display text-xl font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-black/50">{text}</p>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/5 text-black/60">{icon}</span>
      <h3 className="mt-5 text-sm font-bold">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-black/45">{text}</p>
    </div>
  );
}

function PriceCard({ name, price, suffix, note, items, cta, highlight = false }: { name: string; price: string; suffix?: string; note: string; items: string[]; cta: string; highlight?: boolean }) {
  return (
    <div className={`rounded-[22px] border p-6 ${highlight ? "border-[#11110f] bg-[#11110f] text-white shadow-xl" : "border-black/10 bg-white"}`}>
      <div className={`text-[10px] font-bold uppercase tracking-[0.2em] ${highlight ? "text-[#e9c78d]" : "text-black/35"}`}>{name}</div>
      <div className="mt-3 font-display text-4xl font-bold tracking-tight">{price}<span className={`text-sm font-semibold ${highlight ? "text-white/50" : "text-black/35"}`}>{suffix ?? ""}</span></div>
      <p className={`mt-1 text-xs ${highlight ? "text-white/50" : "text-black/45"}`}>{note}</p>
      <ul className={`mt-5 space-y-2.5 text-sm ${highlight ? "text-white/75" : "text-black/60"}`}>
        {items.map((i) => (
          <li key={i} className="flex items-start gap-2"><Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${highlight ? "text-[#e9c78d]" : "text-emerald-600"}`} /> {i}</li>
        ))}
      </ul>
      <Link href="/platform/signup" className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${highlight ? "bg-[#e9c78d] text-[#11110f] hover:bg-[#f2d8a7]" : "border border-black/10 hover:border-black/40"}`}>
        {cta} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
