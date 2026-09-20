"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { StoreSettings, Banner } from "@/lib/settings";
import { updateSettings } from "@/actions/admin";
import { useToast, notify } from "@/components/ui/Toast";
import { ImageUploader } from "./ImageUploader";
import { ArrowUp, ArrowDown, Plus, X, Eye, Image as ImageIcon, Sparkles, Zap } from "lucide-react";

const TABS = ["Branding", "Homepage", "Banners", "Navigation", "Announcement", "Footer & Social", "Custom code"] as const;

export function ContentEditor({ settings }: { settings: StoreSettings }) {
  const [s, setS] = useState(settings);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Homepage");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const save = () => start(async () => { notify(toast, await updateSettings(s)); router.refresh(); });
  const up = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) => setS({ ...s, [k]: v });
  const move = (i: number, d: -1 | 1) => { const a = [...s.homeSections]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; up("homeSections", a); };

  const addBanner = (type: "heroBanners" | "banners") => {
    const newBanner: Banner = {
      id: `${type}_${Date.now()}`,
      title: "",
      subtitle: "",
      image: "",
      ctaText: "Shop Now",
      ctaLink: "/shop",
      enabled: true,
      sortOrder: s[type].length + 1,
      bgColor: type === "heroBanners" ? "#e8f0fe" : "#fff8e1",
    };
    up(type, [...s[type], newBanner]);
  };

  const updateBanner = (type: "heroBanners" | "banners", id: string, patch: Partial<Banner>) => {
    up(type, s[type].map((b) => (b.id === id ? { ...b, ...patch } : b)) as Banner[]);
  };

  const removeBanner = (type: "heroBanners" | "banners", id: string) => {
    up(type, s[type].filter((b) => b.id !== id) as Banner[]);
  };

  const moveBanner = (type: "heroBanners" | "banners", index: number, dir: -1 | 1) => {
    const arr = [...s[type]];
    const j = index + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[index], arr[j]] = [arr[j], arr[index]];
    up(type, arr.map((b, i) => ({ ...b, sortOrder: i + 1 })) as Banner[]);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex gap-1 bg-white border border-gray-200 rounded-full p-1 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-3.5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition ${tab === t ? "bg-[#2874f0] text-white shadow-sm" : "hover:bg-gray-100 text-gray-600"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <a href="/" target="_blank" className="btn-outline btn-sm rounded-full bg-white">
            <Eye className="h-4 w-4" /> Preview
          </a>
          <button onClick={save} disabled={pending} className="btn-primary btn-sm rounded-full bg-[#2874f0]">
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {tab === "Branding" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div><label className="label">Store name</label><input value={s.storeName} onChange={(e) => up("storeName", e.target.value)} className="input" /></div>
            <div><label className="label">Tagline (for clothing & jewellery)</label><input value={s.tagline} onChange={(e) => up("tagline", e.target.value)} className="input" placeholder="Clothing & Jewellery · Crafted for you" /></div>
            <div><label className="label">Logo</label><ImageUploader value={s.logoUrl ? [s.logoUrl] : []} onChange={(v) => up("logoUrl", v[0] ?? "")} multiple={false} folder="brand" /></div>
            <div><label className="label">Favicon</label><ImageUploader value={s.faviconUrl ? [s.faviconUrl] : []} onChange={(v) => up("faviconUrl", v[0] ?? "")} multiple={false} folder="brand" /></div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-bold flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#2874f0]" /> Flipkart Light Theme</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Primary (Flipkart blue)</label><div className="flex gap-2"><input type="color" value={s.primaryColor} onChange={(e) => up("primaryColor", e.target.value)} className="h-10 w-14 rounded-lg border" /><input value={s.primaryColor} onChange={(e) => up("primaryColor", e.target.value)} className="input font-mono" /></div></div>
              <div><label className="label">Accent (Flipkart orange)</label><div className="flex gap-2"><input type="color" value={s.accentColor} onChange={(e) => up("accentColor", e.target.value)} className="h-10 w-14 rounded-lg border" /><input value={s.accentColor} onChange={(e) => up("accentColor", e.target.value)} className="input font-mono" /></div></div>
            </div>
            <div className="rounded-xl p-5 border" style={{ background: s.heroBanners[0]?.bgColor || "#f1f2f4" }}>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[#2874f0] text-white flex items-center justify-center font-bold">{s.storeName[0]}</div>
                <span className="font-bold">{s.storeName}</span>
              </div>
              <div className="mt-3 text-sm text-gray-600">{s.tagline}</div>
              <div className="mt-3 flex gap-2">
                <button className="rounded-full px-4 py-2 text-xs font-bold text-white" style={{ background: s.primaryColor }}>Shop now</button>
                <button className="rounded-full px-4 py-2 text-xs font-bold text-white" style={{ background: s.accentColor }}>Deals</button>
              </div>
            </div>
            <h3 className="font-bold pt-2">SEO defaults</h3>
            <div><label className="label">Site title</label><input value={s.seo.title} onChange={(e) => up("seo", { ...s.seo, title: e.target.value })} className="input" /></div>
            <div><label className="label">Meta description</label><textarea value={s.seo.description} onChange={(e) => up("seo", { ...s.seo, description: e.target.value })} rows={2} className="input" /></div>
            <div><label className="label">Social share image</label><ImageUploader value={s.seo.ogImage ? [s.seo.ogImage] : []} onChange={(v) => up("seo", { ...s.seo, ogImage: v[0] ?? "" })} multiple={false} folder="brand" /></div>
          </div>
        </div>
      )}

      {tab === "Homepage" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-bold">Hero (fallback)</h3>
            <div><label className="label">Headline</label><input value={s.hero.title} onChange={(e) => up("hero", { ...s.hero, title: e.target.value })} className="input" /></div>
            <div><label className="label">Subheadline</label><textarea value={s.hero.subtitle} onChange={(e) => up("hero", { ...s.hero, subtitle: e.target.value })} rows={2} className="input" /></div>
            <div className="grid grid-cols-2 gap-3"><div><label className="label">Button text</label><input value={s.hero.ctaText} onChange={(e) => up("hero", { ...s.hero, ctaText: e.target.value })} className="input" /></div><div><label className="label">Button link</label><input value={s.hero.ctaLink} onChange={(e) => up("hero", { ...s.hero, ctaLink: e.target.value })} className="input" /></div></div>
            <div><label className="label">Background image</label><ImageUploader value={s.hero.image ? [s.hero.image] : []} onChange={(v) => up("hero", { ...s.hero, image: v[0] ?? "" })} multiple={false} folder="hero" /></div>
            <h3 className="font-bold pt-3">Trust badges</h3>
            {s.usps.map((u, i) => (
              <div key={i} className="grid grid-cols-[90px_1fr_1fr_auto] gap-2">
                <select value={u.icon} onChange={(e) => up("usps", s.usps.map((x, k) => (k === i ? { ...x, icon: e.target.value } : x)))} className="input text-xs">{["truck", "shield", "refresh", "headset", "sparkles"].map((o) => <option key={o}>{o}</option>)}</select>
                <input value={u.title} onChange={(e) => up("usps", s.usps.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)))} className="input text-xs" placeholder="Title" />
                <input value={u.text} onChange={(e) => up("usps", s.usps.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)))} className="input text-xs" placeholder="Text" />
                <button onClick={() => up("usps", s.usps.filter((_, k) => k !== i))} className="btn-ghost p-2"><X className="h-4 w-4" /></button>
              </div>
            ))}
            <button onClick={() => up("usps", [...s.usps, { icon: "sparkles", title: "", text: "" }])} className="btn-outline btn-sm rounded-full"><Plus className="h-3.5 w-3.5" /> Add badge</button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold mb-1">Homepage sections</h3><p className="text-xs text-gray-500 mb-4">Drag to reorder · Toggle visibility · Perfect for clothing & jewellery</p>
            <div className="space-y-2">
              {s.homeSections.map((sec, i) => (
                <div key={sec.id} className="border border-gray-200 rounded-xl p-3 bg-[#f8f9fb]">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={sec.enabled} onChange={(e) => up("homeSections", s.homeSections.map((x, k) => (k === i ? { ...x, enabled: e.target.checked } : x)))} />
                    <span className="badge bg-[#2874f0] text-white capitalize text-[10px]">{sec.type.replace("_", " ")}</span>
                    <input value={sec.title} onChange={(e) => up("homeSections", s.homeSections.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)))} className="input py-1 flex-1 text-xs" placeholder="Section title" disabled={sec.type === "usps"} />
                    <button onClick={() => move(i, -1)} className="btn-ghost p-1 h-7 w-7"><ArrowUp className="h-3.5 w-3.5" /></button><button onClick={() => move(i, 1)} className="btn-ghost p-1 h-7 w-7"><ArrowDown className="h-3.5 w-3.5" /></button>
                    <button onClick={() => up("homeSections", s.homeSections.filter((_, k) => k !== i))} className="btn-ghost p-1 h-7 w-7 text-red-600"><X className="h-3.5 w-3.5" /></button>
                  </div>
                  {sec.type === "banner" && (
                    <div className="mt-3 grid grid-cols-2 gap-2 pl-6">
                      <input value={sec.data?.text ?? ""} onChange={(e) => up("homeSections", s.homeSections.map((x, k) => (k === i ? { ...x, data: { ...x.data, text: e.target.value } } : x)))} className="input py-1 col-span-2 text-xs" placeholder="Banner text" />
                      <input value={sec.data?.cta ?? ""} onChange={(e) => up("homeSections", s.homeSections.map((x, k) => (k === i ? { ...x, data: { ...x.data, cta: e.target.value } } : x)))} className="input py-1 text-xs" placeholder="Button text" />
                      <input value={sec.data?.link ?? ""} onChange={(e) => up("homeSections", s.homeSections.map((x, k) => (k === i ? { ...x, data: { ...x.data, link: e.target.value } } : x)))} className="input py-1 text-xs" placeholder="Button link" />
                      <div className="col-span-2"><ImageUploader value={sec.data?.image ? [sec.data.image] : []} onChange={(v) => up("homeSections", s.homeSections.map((x, k) => (k === i ? { ...x, data: { ...x.data, image: v[0] ?? "" } } : x)))} multiple={false} folder="banners" /></div>
                    </div>
                  )}
                  {sec.type === "text" && <textarea value={sec.data?.html ?? ""} onChange={(e) => up("homeSections", s.homeSections.map((x, k) => (k === i ? { ...x, data: { ...x.data, html: e.target.value } } : x)))} className="input mt-3 ml-6 w-[calc(100%-1.5rem)] font-mono text-xs" rows={3} placeholder="<p>HTML content</p>" />}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">{(["featured", "newest", "categories", "banner", "banners", "hero_banners", "deals", "text", "usps"] as const).map((t) => <button key={t} onClick={() => up("homeSections", [...s.homeSections, { id: t + "_" + Date.now(), type: t, title: t === "featured" ? "Featured picks" : t === "newest" ? "New arrivals" : t === "categories" ? "Shop by category" : t === "deals" ? "Deals of the Day" : t === "banners" ? "Special Offers" : t === "hero_banners" ? "Hero Banners" : "", enabled: true, data: {} }])} className="btn-outline btn-sm capitalize rounded-full text-xs"><Plus className="h-3 w-3" /> {t.replace("_", " ")}</button>)}</div>
          </div>
        </div>
      )}

      {tab === "Banners" && (
        <div className="space-y-6">
          {/* Hero Banners - Carousel */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold flex items-center gap-2"><Zap className="h-4 w-4 text-[#2874f0]" /> Hero Banners (Carousel)</h3>
                <p className="text-xs text-gray-500 mt-1">Main homepage carousel · Ideal for clothing & jewellery collections · Shows as slider</p>
              </div>
              <button onClick={() => addBanner("heroBanners")} className="btn-primary btn-sm rounded-full bg-[#2874f0]"><Plus className="h-4 w-4" /> Add hero banner</button>
            </div>

            <div className="space-y-4">
              {s.heroBanners.map((b, idx) => (
                <div key={b.id} className="border border-gray-200 rounded-xl p-4 bg-[#f8f9fb]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-[#2874f0] text-white flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                      <span className="font-semibold text-sm">{b.title || `Hero Banner ${idx + 1}`}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${b.enabled ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{b.enabled ? "Enabled" : "Disabled"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveBanner("heroBanners", idx, -1)} className="h-7 w-7 rounded-full bg-white border flex items-center justify-center hover:border-[#2874f0]"><ArrowUp className="h-3.5 w-3.5" /></button>
                      <button onClick={() => moveBanner("heroBanners", idx, 1)} className="h-7 w-7 rounded-full bg-white border flex items-center justify-center hover:border-[#2874f0]"><ArrowDown className="h-3.5 w-3.5" /></button>
                      <button onClick={() => removeBanner("heroBanners", b.id)} className="h-7 w-7 rounded-full bg-red-50 border border-red-100 text-red-600 flex items-center justify-center hover:bg-red-100"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div><label className="label">Title</label><input value={b.title} onChange={(e) => updateBanner("heroBanners", b.id, { title: e.target.value })} className="input text-sm" placeholder="e.g. Festive Jewellery Collection" /></div>
                    <div><label className="label">Subtitle</label><input value={b.subtitle ?? ""} onChange={(e) => updateBanner("heroBanners", b.id, { subtitle: e.target.value })} className="input text-sm" placeholder="e.g. Up to 40% off" /></div>
                    <div><label className="label">CTA Text</label><input value={b.ctaText ?? ""} onChange={(e) => updateBanner("heroBanners", b.id, { ctaText: e.target.value })} className="input text-sm" placeholder="Shop Now" /></div>
                    <div><label className="label">CTA Link</label><input value={b.ctaLink ?? ""} onChange={(e) => updateBanner("heroBanners", b.id, { ctaLink: e.target.value })} className="input text-sm font-mono" placeholder="/shop?category=jewellery" /></div>
                    <div><label className="label">Background Color</label><div className="flex gap-2"><input type="color" value={b.bgColor ?? "#e8f0fe"} onChange={(e) => updateBanner("heroBanners", b.id, { bgColor: e.target.value })} className="h-9 w-14 rounded border" /><input value={b.bgColor ?? ""} onChange={(e) => updateBanner("heroBanners", b.id, { bgColor: e.target.value })} className="input text-xs font-mono" placeholder="#e8f0fe" /></div></div>
                    <div className="flex items-center gap-2 pt-6"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={b.enabled} onChange={(e) => updateBanner("heroBanners", b.id, { enabled: e.target.checked })} /> Enabled</label></div>
                  </div>

                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    <div><label className="label flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5" /> Desktop Image (1200x400)</label><ImageUploader value={b.image ? [b.image] : []} onChange={(v) => updateBanner("heroBanners", b.id, { image: v[0] ?? "" })} multiple={false} folder="hero-banners" /></div>
                    <div><label className="label">Mobile Image (600x400) optional</label><ImageUploader value={b.mobileImage ? [b.mobileImage] : []} onChange={(v) => updateBanner("heroBanners", b.id, { mobileImage: v[0] ?? "" })} multiple={false} folder="hero-banners-mobile" /></div>
                  </div>

                  <div className="mt-4 p-3 rounded-xl border" style={{ background: b.bgColor || "#f1f2f4" }}>
                    <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Preview</div>
                    <div className="font-bold text-sm">{b.title || "Banner title"}</div>
                    <div className="text-xs text-gray-600">{b.subtitle || "Subtitle"}</div>
                    {b.image && <img src={b.image} alt="" className="mt-2 h-20 w-full object-cover rounded-lg border" />}
                  </div>
                </div>
              ))}
              {s.heroBanners.length === 0 && <div className="text-center py-12 border border-dashed rounded-xl bg-gray-50"><ImageIcon className="h-8 w-8 mx-auto text-gray-300 mb-2" /><div className="text-sm font-semibold">No hero banners</div><div className="text-xs text-gray-500">Add banners to show carousel on homepage</div></div>}
            </div>
          </div>

          {/* Mid-page Banners */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold flex items-center gap-2"><ImageIcon className="h-4 w-4 text-[#fb641b]" /> Promotional Banners</h3>
                <p className="text-xs text-gray-500 mt-1">Mid-page banners · For offers, collections, jewellery highlights</p>
              </div>
              <button onClick={() => addBanner("banners")} className="btn-accent btn-sm rounded-full bg-[#fb641b]"><Plus className="h-4 w-4" /> Add banner</button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {s.banners.map((b, idx) => (
                <div key={b.id} className="border border-gray-200 rounded-xl p-4 bg-[#f8f9fb]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-sm flex items-center gap-2"><span className="h-5 w-5 rounded-full bg-[#fb641b] text-white flex items-center justify-center text-xs">{idx + 1}</span>{b.title || `Banner ${idx + 1}`}</span>
                    <div className="flex gap-1">
                      <button onClick={() => moveBanner("banners", idx, -1)} className="h-6 w-6 rounded-full bg-white border flex items-center justify-center"><ArrowUp className="h-3 w-3" /></button>
                      <button onClick={() => moveBanner("banners", idx, 1)} className="h-6 w-6 rounded-full bg-white border flex items-center justify-center"><ArrowDown className="h-3 w-3" /></button>
                      <button onClick={() => removeBanner("banners", b.id)} className="h-6 w-6 rounded-full bg-red-50 text-red-600 flex items-center justify-center"><X className="h-3 w-3" /></button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <input value={b.title} onChange={(e) => updateBanner("banners", b.id, { title: e.target.value })} className="input text-xs" placeholder="Title e.g. Wedding Season Sale" />
                    <input value={b.subtitle ?? ""} onChange={(e) => updateBanner("banners", b.id, { subtitle: e.target.value })} className="input text-xs" placeholder="Subtitle" />
                    <div className="grid grid-cols-2 gap-2">
                      <input value={b.ctaText ?? ""} onChange={(e) => updateBanner("banners", b.id, { ctaText: e.target.value })} className="input text-xs" placeholder="CTA e.g. Shop Now" />
                      <input value={b.ctaLink ?? ""} onChange={(e) => updateBanner("banners", b.id, { ctaLink: e.target.value })} className="input text-xs font-mono" placeholder="/shop" />
                    </div>
                    <ImageUploader value={b.image ? [b.image] : []} onChange={(v) => updateBanner("banners", b.id, { image: v[0] ?? "" })} multiple={false} folder="banners" />
                    <div className="flex items-center gap-2">
                      <input type="color" value={b.bgColor ?? "#fff8e1"} onChange={(e) => updateBanner("banners", b.id, { bgColor: e.target.value })} className="h-7 w-10 rounded border" />
                      <input value={b.bgColor ?? ""} onChange={(e) => updateBanner("banners", b.id, { bgColor: e.target.value })} className="input text-xs font-mono flex-1" placeholder="#fff8e1" />
                      <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={b.enabled} onChange={(e) => updateBanner("banners", b.id, { enabled: e.target.checked })} /> On</label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {s.banners.length === 0 && <div className="text-center py-8 border border-dashed rounded-xl bg-gray-50 text-xs text-gray-500">No promotional banners · Add to highlight offers</div>}
          </div>
        </div>
      )}

      {tab === "Navigation" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 max-w-2xl space-y-2">
          <h3 className="font-bold mb-2">Header menu (Flipkart style)</h3>
          {s.nav.map((n, i) => <div key={i} className="flex gap-2"><input value={n.label} onChange={(e) => up("nav", s.nav.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} className="input text-xs" placeholder="Label" /><input value={n.href} onChange={(e) => up("nav", s.nav.map((x, k) => (k === i ? { ...x, href: e.target.value } : x)))} className="input font-mono text-xs" placeholder="/shop?category=…" /><button onClick={() => up("nav", s.nav.filter((_, k) => k !== i))} className="btn-ghost p-2 h-8 w-8"><X className="h-4 w-4" /></button></div>)}
          <button onClick={() => up("nav", [...s.nav, { label: "", href: "/" }])} className="btn-outline btn-sm rounded-full text-xs"><Plus className="h-3.5 w-3.5" /> Add link</button>
        </div>
      )}

      {tab === "Announcement" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 max-w-2xl space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={s.announcementEnabled} onChange={(e) => up("announcementEnabled", e.target.checked)} /> Show announcement bar</label>
          <input value={s.announcement} onChange={(e) => up("announcement", e.target.value)} className="input text-sm" placeholder="Free shipping on orders above ₹999" />
          <div className="text-xs text-center text-white py-2.5 rounded-full font-medium" style={{ background: s.primaryColor }}>{s.announcement || "Preview"}</div>
        </div>
      )}

      {tab === "Footer & Social" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3"><h3 className="font-bold">Footer</h3><div><label className="label">Copyright</label><input value={s.footerText} onChange={(e) => up("footerText", e.target.value)} className="input text-xs" /></div><div><label className="label">Address</label><textarea value={s.address} onChange={(e) => up("address", e.target.value)} rows={2} className="input text-xs" /></div><div><label className="label">Support email</label><input value={s.supportEmail} onChange={(e) => up("supportEmail", e.target.value)} className="input text-xs" /></div><div><label className="label">Support phone</label><input value={s.supportPhone} onChange={(e) => up("supportPhone", e.target.value)} className="input text-xs" /></div></div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3"><h3 className="font-bold">Social</h3>{(["instagram", "facebook", "twitter", "youtube"] as const).map((k) => <div key={k}><label className="label capitalize">{k}</label><input value={s.social[k]} onChange={(e) => up("social", { ...s.social, [k]: e.target.value })} className="input text-xs" placeholder={`https://${k}.com/yourstore`} /></div>)}</div>
        </div>
      )}

      {tab === "Custom code" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 max-w-3xl space-y-4">
          <p className="text-sm text-gray-600">Inject custom HTML (e.g. chat widgets, verification tags).</p>
          <div><label className="label">Before &lt;/body&gt;</label><textarea value={s.scripts.bodyHtml} onChange={(e) => up("scripts", { ...s.scripts, bodyHtml: e.target.value })} rows={8} className="input font-mono text-xs" /></div>
        </div>
      )}
    </div>
  );
}
