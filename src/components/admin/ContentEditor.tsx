"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { StoreSettings } from "@/lib/settings";
import { updateSettings } from "@/actions/admin";
import { useToast, notify } from "@/components/ui/Toast";
import { ImageUploader } from "./ImageUploader";
import { ArrowUp, ArrowDown, Plus, X, Eye } from "lucide-react";

const TABS = ["Branding", "Homepage", "Navigation", "Announcement", "Footer & Social", "Custom code"] as const;

export function ContentEditor({ settings }: { settings: StoreSettings }) {
  const [s, setS] = useState(settings);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Branding");
  const [pending, start] = useTransition();
  const toast = useToast(); const router = useRouter();
  const save = () => start(async () => { notify(toast, await updateSettings(s)); router.refresh(); });
  const up = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) => setS({ ...s, [k]: v });
  const move = (i: number, d: -1 | 1) => { const a = [...s.homeSections]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; up("homeSections", a); };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-white border rounded-lg p-1">{TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-sm rounded-md ${tab === t ? "bg-gray-900 text-white" : "hover:bg-gray-100"}`}>{t}</button>)}</div>
        <div className="flex gap-2"><a href="/" target="_blank" className="btn-outline"><Eye className="h-4 w-4" /> Preview store</a><button onClick={save} disabled={pending} className="btn-primary">{pending ? "Saving…" : "Save changes"}</button></div>
      </div>

      {tab === "Branding" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-5 space-y-4">
            <div><label className="label">Store name</label><input value={s.storeName} onChange={(e) => up("storeName", e.target.value)} className="input" /></div>
            <div><label className="label">Tagline</label><input value={s.tagline} onChange={(e) => up("tagline", e.target.value)} className="input" /></div>
            <div><label className="label">Logo (leave empty to show store name as text)</label><ImageUploader value={s.logoUrl ? [s.logoUrl] : []} onChange={(v) => up("logoUrl", v[0] ?? "")} multiple={false} folder="brand" /></div>
            <div><label className="label">Favicon</label><ImageUploader value={s.faviconUrl ? [s.faviconUrl] : []} onChange={(v) => up("faviconUrl", v[0] ?? "")} multiple={false} folder="brand" /></div>
          </div>
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold">Colours</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Primary (header, buttons)</label><div className="flex gap-2"><input type="color" value={s.primaryColor} onChange={(e) => up("primaryColor", e.target.value)} className="h-10 w-14 rounded border" /><input value={s.primaryColor} onChange={(e) => up("primaryColor", e.target.value)} className="input font-mono" /></div></div>
              <div><label className="label">Accent (badges, CTAs)</label><div className="flex gap-2"><input type="color" value={s.accentColor} onChange={(e) => up("accentColor", e.target.value)} className="h-10 w-14 rounded border" /><input value={s.accentColor} onChange={(e) => up("accentColor", e.target.value)} className="input font-mono" /></div></div>
            </div>
            <div className="rounded-xl p-5 text-white" style={{ background: s.primaryColor }}><div className="font-semibold">{s.storeName}</div><div className="text-sm opacity-80">{s.tagline}</div><button className="mt-3 rounded-lg px-4 py-2 text-sm font-medium" style={{ background: s.accentColor }}>Shop now</button></div>
            <h3 className="font-semibold pt-2">SEO defaults</h3>
            <div><label className="label">Site title</label><input value={s.seo.title} onChange={(e) => up("seo", { ...s.seo, title: e.target.value })} className="input" /></div>
            <div><label className="label">Meta description</label><textarea value={s.seo.description} onChange={(e) => up("seo", { ...s.seo, description: e.target.value })} rows={2} className="input" /></div>
            <div><label className="label">Social share image</label><ImageUploader value={s.seo.ogImage ? [s.seo.ogImage] : []} onChange={(v) => up("seo", { ...s.seo, ogImage: v[0] ?? "" })} multiple={false} folder="brand" /></div>
          </div>
        </div>
      )}

      {tab === "Homepage" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold">Hero</h3>
            <div><label className="label">Headline</label><input value={s.hero.title} onChange={(e) => up("hero", { ...s.hero, title: e.target.value })} className="input" /></div>
            <div><label className="label">Subheadline</label><textarea value={s.hero.subtitle} onChange={(e) => up("hero", { ...s.hero, subtitle: e.target.value })} rows={2} className="input" /></div>
            <div className="grid grid-cols-2 gap-3"><div><label className="label">Button text</label><input value={s.hero.ctaText} onChange={(e) => up("hero", { ...s.hero, ctaText: e.target.value })} className="input" /></div><div><label className="label">Button link</label><input value={s.hero.ctaLink} onChange={(e) => up("hero", { ...s.hero, ctaLink: e.target.value })} className="input" /></div></div>
            <div><label className="label">Background image</label><ImageUploader value={s.hero.image ? [s.hero.image] : []} onChange={(v) => up("hero", { ...s.hero, image: v[0] ?? "" })} multiple={false} folder="hero" /></div>
            <h3 className="font-semibold pt-3">Trust badges (USPs)</h3>
            {s.usps.map((u, i) => (
              <div key={i} className="grid grid-cols-[100px_1fr_1fr_auto] gap-2">
                <select value={u.icon} onChange={(e) => up("usps", s.usps.map((x, k) => (k === i ? { ...x, icon: e.target.value } : x)))} className="input">{["truck", "shield", "refresh", "headset", "sparkles"].map((o) => <option key={o}>{o}</option>)}</select>
                <input value={u.title} onChange={(e) => up("usps", s.usps.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)))} className="input" placeholder="Title" />
                <input value={u.text} onChange={(e) => up("usps", s.usps.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)))} className="input" placeholder="Text" />
                <button onClick={() => up("usps", s.usps.filter((_, k) => k !== i))} className="btn-ghost p-2"><X className="h-4 w-4" /></button>
              </div>
            ))}
            <button onClick={() => up("usps", [...s.usps, { icon: "sparkles", title: "", text: "" }])} className="btn-outline btn-sm"><Plus className="h-3.5 w-3.5" /> Add badge</button>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold mb-1">Homepage sections</h3><p className="text-xs text-gray-500 mb-4">Reorder, rename, enable or disable sections.</p>
            <div className="space-y-2">
              {s.homeSections.map((sec, i) => (
                <div key={sec.id} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={sec.enabled} onChange={(e) => up("homeSections", s.homeSections.map((x, k) => (k === i ? { ...x, enabled: e.target.checked } : x)))} />
                    <span className="badge bg-gray-100 text-gray-600 capitalize">{sec.type}</span>
                    <input value={sec.title} onChange={(e) => up("homeSections", s.homeSections.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)))} className="input py-1 flex-1" placeholder="Section title" disabled={sec.type === "usps"} />
                    <button onClick={() => move(i, -1)} className="btn-ghost p-1"><ArrowUp className="h-4 w-4" /></button><button onClick={() => move(i, 1)} className="btn-ghost p-1"><ArrowDown className="h-4 w-4" /></button>
                    <button onClick={() => up("homeSections", s.homeSections.filter((_, k) => k !== i))} className="btn-ghost p-1 text-red-600"><X className="h-4 w-4" /></button>
                  </div>
                  {sec.type === "banner" && (
                    <div className="mt-3 grid grid-cols-2 gap-2 pl-6">
                      <input value={sec.data?.text ?? ""} onChange={(e) => up("homeSections", s.homeSections.map((x, k) => (k === i ? { ...x, data: { ...x.data, text: e.target.value } } : x)))} className="input py-1 col-span-2" placeholder="Banner text" />
                      <input value={sec.data?.cta ?? ""} onChange={(e) => up("homeSections", s.homeSections.map((x, k) => (k === i ? { ...x, data: { ...x.data, cta: e.target.value } } : x)))} className="input py-1" placeholder="Button text" />
                      <input value={sec.data?.link ?? ""} onChange={(e) => up("homeSections", s.homeSections.map((x, k) => (k === i ? { ...x, data: { ...x.data, link: e.target.value } } : x)))} className="input py-1" placeholder="Button link" />
                      <div className="col-span-2"><ImageUploader value={sec.data?.image ? [sec.data.image] : []} onChange={(v) => up("homeSections", s.homeSections.map((x, k) => (k === i ? { ...x, data: { ...x.data, image: v[0] ?? "" } } : x)))} multiple={false} folder="banners" /></div>
                    </div>
                  )}
                  {sec.type === "text" && <textarea value={sec.data?.html ?? ""} onChange={(e) => up("homeSections", s.homeSections.map((x, k) => (k === i ? { ...x, data: { ...x.data, html: e.target.value } } : x)))} className="input mt-3 ml-6 w-[calc(100%-1.5rem)] font-mono text-xs" rows={3} placeholder="<p>HTML content</p>" />}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">{(["featured", "newest", "categories", "banner", "text", "usps"] as const).map((t) => <button key={t} onClick={() => up("homeSections", [...s.homeSections, { id: t + "_" + Date.now(), type: t, title: t === "featured" ? "Featured picks" : t === "newest" ? "New arrivals" : t === "categories" ? "Shop by category" : t === "banner" ? "Promotion" : "", enabled: true, data: {} }])} className="btn-outline btn-sm capitalize"><Plus className="h-3 w-3" /> {t}</button>)}</div>
          </div>
        </div>
      )}

      {tab === "Navigation" && (
        <div className="card p-5 max-w-2xl space-y-2">
          <h3 className="font-semibold mb-2">Header menu</h3>
          {s.nav.map((n, i) => <div key={i} className="flex gap-2"><input value={n.label} onChange={(e) => up("nav", s.nav.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} className="input" placeholder="Label" /><input value={n.href} onChange={(e) => up("nav", s.nav.map((x, k) => (k === i ? { ...x, href: e.target.value } : x)))} className="input font-mono text-xs" placeholder="/shop?category=…" /><button onClick={() => up("nav", s.nav.filter((_, k) => k !== i))} className="btn-ghost p-2"><X className="h-4 w-4" /></button></div>)}
          <button onClick={() => up("nav", [...s.nav, { label: "", href: "/" }])} className="btn-outline btn-sm"><Plus className="h-3.5 w-3.5" /> Add link</button>
          <p className="text-xs text-gray-500 pt-3">Useful links: <code>/shop</code>, <code>/shop?category=slug</code>, <code>/shop?sort=discount</code>, <code>/categories</code>, <code>/pages/about</code>, <code>/contact</code>, <code>/track</code></p>
        </div>
      )}

      {tab === "Announcement" && (
        <div className="card p-5 max-w-2xl space-y-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.announcementEnabled} onChange={(e) => up("announcementEnabled", e.target.checked)} /> Show announcement bar at the top of every page</label>
          <input value={s.announcement} onChange={(e) => up("announcement", e.target.value)} className="input" placeholder="Free shipping on orders above ₹999" />
          <div className="text-xs text-center text-white py-2 rounded" style={{ background: s.primaryColor }}>{s.announcement || "Preview"}</div>
        </div>
      )}

      {tab === "Footer & Social" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-5 space-y-3"><h3 className="font-semibold">Footer</h3><div><label className="label">Copyright text</label><input value={s.footerText} onChange={(e) => up("footerText", e.target.value)} className="input" /></div><div><label className="label">Address</label><textarea value={s.address} onChange={(e) => up("address", e.target.value)} rows={2} className="input" /></div><div><label className="label">Support email</label><input value={s.supportEmail} onChange={(e) => up("supportEmail", e.target.value)} className="input" /></div><div><label className="label">Support phone</label><input value={s.supportPhone} onChange={(e) => up("supportPhone", e.target.value)} className="input" /></div></div>
          <div className="card p-5 space-y-3"><h3 className="font-semibold">Social links</h3>{(["instagram", "facebook", "twitter", "youtube"] as const).map((k) => <div key={k}><label className="label capitalize">{k}</label><input value={s.social[k]} onChange={(e) => up("social", { ...s.social, [k]: e.target.value })} className="input" placeholder={`https://${k}.com/yourstore`} /></div>)}</div>
        </div>
      )}

      {tab === "Custom code" && (
        <div className="card p-5 max-w-3xl space-y-4">
          <p className="text-sm text-gray-600">Inject custom HTML (e.g. chat widgets, verification tags). Analytics are handled by the Analytics plugin.</p>
          <div><label className="label">Before &lt;/body&gt;</label><textarea value={s.scripts.bodyHtml} onChange={(e) => up("scripts", { ...s.scripts, bodyHtml: e.target.value })} rows={8} className="input font-mono text-xs" /></div>
        </div>
      )}
    </div>
  );
}
