"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Product, Variant, Category } from "@/lib/db/schema";
import { saveProduct, type ProductInput } from "@/actions/admin";
import { ImageUploader } from "./ImageUploader";
import { useToast, notify } from "@/components/ui/Toast";
import { ArrowLeft, Plus, X, Wand2, Save, Eye, Package, DollarSign, Tag, Layers, Search, Zap } from "lucide-react";
import { slugify } from "@/lib/utils";

type V = ProductInput["variants"][number];

export function ProductForm({ product: p, variants: initialVariants = [], categories }: { product?: Product; variants?: Variant[]; categories: Category[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [activeTab, setActiveTab] = useState<"basic" | "media" | "pricing" | "inventory" | "variants" | "seo">("basic");
  const [f, setF] = useState<ProductInput>({
    name: p?.name ?? "",
    slug: p?.slug ?? "",
    description: p?.description ?? "",
    shortDescription: p?.shortDescription ?? "",
    price: p ? p.price / 100 : 0,
    compareAtPrice: p?.compareAtPrice ? p.compareAtPrice / 100 : null,
    costPrice: p?.costPrice ? p.costPrice / 100 : null,
    sku: p?.sku ?? "",
    stock: p?.stock ?? 0,
    trackStock: p?.trackStock ?? true,
    status: p?.status ?? "active",
    images: p?.images ?? [],
    categoryId: p?.categoryId ?? "",
    featured: p?.featured ?? false,
    tags: p?.tags ?? [],
    options: p?.options ?? [],
    variants: initialVariants.map((v) => ({ id: v.id, title: v.title, optionValues: v.optionValues, price: v.price != null ? v.price / 100 : null, sku: v.sku, stock: v.stock, image: v.image })),
    weightGrams: p?.weightGrams ?? null,
    seoTitle: p?.seoTitle ?? "",
    seoDescription: p?.seoDescription ?? "",
  });
  const [tagInput, setTagInput] = useState("");
  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => setF((x) => ({ ...x, [k]: v }));

  const generateVariants = () => {
    const opts = f.options.filter((o) => o.name && o.values.length);
    if (!opts.length) return set("variants", []);
    const combos: Record<string, string>[] = opts.reduce<Record<string, string>[]>((acc, o) => acc.flatMap((c) => o.values.map((v) => ({ ...c, [o.name]: v }))), [{}]);
    set(
      "variants",
      combos.map((c) => {
        const title = Object.values(c).join(" / ");
        const ex = f.variants.find((v) => v.title === title);
        return ex ?? { title, optionValues: c, price: null, sku: "", stock: 0, image: null };
      })
    );
  };

  const submit = (andNew = false) =>
    start(async () => {
      const r = await saveProduct(p?.id ?? null, f);
      notify(toast, r);
      if (r.ok) {
        if (andNew) router.push("/admin/products/new");
        else if (!p) router.push(`/admin/products/${r.id}`);
        else router.refresh();
      }
    });

  const margin = f.costPrice && f.price ? Math.round(((f.price - f.costPrice) / f.price) * 100) : null;
  const completion = Math.round(
    ([f.name, f.price > 0, f.images.length > 0, f.categoryId, f.description].filter(Boolean).length / 5) * 100
  );

  const tabs = [
    { id: "basic", label: "Basic", icon: Package, desc: "Name & description" },
    { id: "media", label: "Media", icon: Eye, desc: `${f.images.length} images` },
    { id: "pricing", label: "Pricing", icon: DollarSign, desc: f.price ? `₹${f.price}` : "Set price" },
    { id: "inventory", label: "Inventory", icon: Layers, desc: `${f.stock} in stock` },
    { id: "variants", label: "Variants", icon: Zap, desc: `${f.variants.length} variants` },
    { id: "seo", label: "SEO", icon: Search, desc: "Search listing" },
  ] as const;

  return (
    <div className="max-w-[1280px] mx-auto">
      {/* Sticky header - Shopify style */}
      <div className="sticky top-0 lg:top-0 z-20 bg-[#f8f9fb]/80 backdrop-blur-xl border-b border-gray-200 -mx-4 lg:-mx-8 px-4 lg:px-8 py-3 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="h-9 w-9 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:border-gray-900 transition">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg truncate">{p ? "Edit product" : "New product"}</h1>
              {p && <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${f.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>{f.status}</span>}
              <span className="hidden sm:inline-flex text-xs bg-white border px-2 py-0.5 rounded-full">{completion}% complete</span>
            </div>
            <div className="text-xs text-gray-500 truncate hidden sm:block">{f.name || "Untitled product"} · {f.slug || "no slug"}</div>
          </div>
          <div className="flex items-center gap-2">
            {p && (
              <a href={`/products/${p.slug}`} target="_blank" className="btn-outline btn-sm rounded-full hidden sm:flex bg-white">
                <Eye className="h-4 w-4" /> View
              </a>
            )}
            {!p && (
              <button onClick={() => submit(true)} disabled={pending} className="btn-outline btn-sm rounded-full hidden sm:flex bg-white">
                Save & new
              </button>
            )}
            <button onClick={() => submit()} disabled={pending} className="btn-primary btn-sm rounded-full px-5">
              <Save className="h-4 w-4" /> {pending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gray-900 rounded-full transition-all duration-500" style={{ width: `${completion}%` }} />
        </div>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr_300px] gap-6">
        {/* Left tabs - like Shopify mobile app */}
        <div className="hidden lg:block">
          <div className="bg-white rounded-2xl border border-gray-100 p-2 sticky top-[88px]">
            <div className="p-3 mb-2">
              <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Product setup</div>
              <div className="mt-2 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gray-900 rounded-full" style={{ width: `${completion}%` }} />
              </div>
            </div>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition ${activeTab === tab.id ? "bg-gray-900 text-white shadow-sm" : "hover:bg-gray-50 text-gray-600"}`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${activeTab === tab.id ? "bg-white/10" : "bg-gray-100"}`}>
                  <tab.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{tab.label}</div>
                  <div className={`text-xs truncate ${activeTab === tab.id ? "text-white/60" : "text-gray-400"}`}>{tab.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="lg:hidden col-span-full">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border transition ${activeTab === tab.id ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 text-gray-600"}`}
              >
                <tab.icon className="h-4 w-4" /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="space-y-4">
          {activeTab === "basic" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
              <div>
                <h3 className="font-bold mb-4 flex items-center gap-2"><Package className="h-4 w-4" /> Basic information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="label">Product name *</label>
                    <input
                      value={f.name}
                      onChange={(e) => {
                        set("name", e.target.value);
                        if (!p) set("slug", slugify(e.target.value));
                      }}
                      className="input text-base font-medium"
                      placeholder="e.g. Premium Cotton T-Shirt"
                      autoFocus
                    />
                    <div className="text-[11px] text-gray-500 mt-1">A clear, descriptive name helps customers find your product</div>
                  </div>
                  <div>
                    <label className="label">Short description (for cards)</label>
                    <input value={f.shortDescription ?? ""} onChange={(e) => set("shortDescription", e.target.value)} className="input" placeholder="One-line highlight, e.g. Breathable cotton, perfect for daily wear" />
                  </div>
                  <div>
                    <label className="label">Full description</label>
                    <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={10} className="input text-sm leading-relaxed" placeholder="Describe materials, fit, care instructions, story... HTML allowed" />
                    <div className="text-[11px] text-gray-500 mt-1">{f.description.length} characters · Supports HTML for rich formatting</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "media" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold mb-4">Product media</h3>
              <ImageUploader value={f.images} onChange={(v) => set("images", v)} />
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800">
                <b>Tip:</b> First image is the main cover. Drag to reorder. Use high-quality images (1200px+) for best results. Up to 10 images.
              </div>
            </div>
          )}

          {activeTab === "pricing" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2"><DollarSign className="h-4 w-4" /> Pricing</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">Price (₹) *</label>
                  <input type="number" step="0.01" value={f.price} onChange={(e) => set("price", Number(e.target.value))} className="input text-lg font-bold" placeholder="0.00" />
                </div>
                <div>
                  <label className="label">Compare-at price (₹)</label>
                  <input type="number" step="0.01" value={f.compareAtPrice ?? ""} onChange={(e) => set("compareAtPrice", e.target.value ? Number(e.target.value) : null)} className="input" placeholder="Original price for discount" />
                  {f.compareAtPrice && f.price && f.compareAtPrice > f.price && (
                    <div className="text-xs text-emerald-700 font-bold mt-1 bg-emerald-50 px-2 py-1 rounded-full w-fit">{Math.round(((f.compareAtPrice - f.price) / f.compareAtPrice) * 100)}% off</div>
                  )}
                </div>
                <div>
                  <label className="label">Cost per item (₹)</label>
                  <input type="number" step="0.01" value={f.costPrice ?? ""} onChange={(e) => set("costPrice", e.target.value ? Number(e.target.value) : null)} className="input" placeholder="Your cost" />
                  {margin != null && <div className="text-xs text-gray-500 mt-1">Margin {margin}% · Profit ₹{(f.price - f.costPrice!).toFixed(2)}</div>}
                </div>
              </div>
            </div>
          )}

          {activeTab === "inventory" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold mb-4">Inventory & shipping</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">SKU</label>
                  <input value={f.sku ?? ""} onChange={(e) => set("sku", e.target.value)} className="input font-mono text-xs" placeholder="e.g. TSHIRT-BLK-M" />
                </div>
                <div>
                  <label className="label">Stock {f.variants.length > 0 && "(sum of variants)"}</label>
                  <input type="number" value={f.variants.length ? f.variants.reduce((a, v) => a + v.stock, 0) : f.stock} disabled={f.variants.length > 0} onChange={(e) => set("stock", Number(e.target.value))} className="input font-bold" />
                </div>
                <div>
                  <label className="label">Weight (g)</label>
                  <input type="number" value={f.weightGrams ?? ""} onChange={(e) => set("weightGrams", e.target.value ? Number(e.target.value) : null)} className="input" placeholder="For shipping" />
                </div>
              </div>
              <label className="flex items-center gap-3 text-sm mt-5 p-3 rounded-xl bg-gray-50 border">
                <input type="checkbox" checked={f.trackStock} onChange={(e) => set("trackStock", e.target.checked)} className="rounded" />
                <div>
                  <div className="font-semibold">Track stock</div>
                  <div className="text-xs text-gray-500">Prevent overselling when out of stock</div>
                </div>
              </label>
            </div>
          )}

          {activeTab === "variants" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2"><Zap className="h-4 w-4" /> Variants & options</h3>
                <button type="button" onClick={() => set("options", [...f.options, { name: "", values: [] }])} className="btn-outline btn-sm rounded-full">
                  <Plus className="h-3.5 w-3.5" /> Add option
                </button>
              </div>

              {f.options.length === 0 && (
                <div className="text-center py-12 border border-dashed rounded-xl bg-gray-50/50">
                  <div className="mx-auto h-12 w-12 rounded-full bg-white border flex items-center justify-center mb-3"><Layers className="h-6 w-6 text-gray-400" /></div>
                  <div className="font-semibold text-sm">No variants yet</div>
                  <div className="text-xs text-gray-500 mt-1 max-w-[280px] mx-auto">Add options like Size or Color to create variants (e.g. S, M, L or Red, Blue)</div>
                  <button type="button" onClick={() => set("options", [{ name: "Size", values: ["S", "M", "L"] }])} className="btn-primary btn-sm mt-4 rounded-full">Add Size option</button>
                </div>
              )}

              <div className="space-y-3">
                {f.options.map((o, i) => (
                  <div key={i} className="flex gap-2 items-start p-3 rounded-xl bg-gray-50 border">
                    <input value={o.name} onChange={(e) => set("options", f.options.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} placeholder="Option name (Size)" className="input w-36 bg-white" />
                    <input value={o.values.join(", ")} onChange={(e) => set("options", f.options.map((x, k) => (k === i ? { ...x, values: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } : x)))} placeholder="Values comma separated (S, M, L)" className="input flex-1 bg-white" />
                    <button type="button" onClick={() => set("options", f.options.filter((_, k) => k !== i))} className="h-9 w-9 rounded-full bg-white border flex items-center justify-center hover:bg-red-50 hover:text-red-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {f.options.length > 0 && (
                <button type="button" onClick={generateVariants} className="btn-primary btn-sm mt-4 rounded-full">
                  <Wand2 className="h-3.5 w-3.5" /> Generate {f.options.reduce((a, o) => a * Math.max(1, o.values.length), 1)} variants
                </button>
              )}

              {f.variants.length > 0 && (
                <div className="mt-6 space-y-4">
                  <div className="rounded-xl border overflow-hidden">
                    <table className="data">
                      <thead><tr><th>Variant</th><th>Price</th><th>SKU</th><th>Stock</th><th>Image</th></tr></thead>
                      <tbody>
                        {f.variants.map((v, i) => {
                          const up = (patch: Partial<V>) => set("variants", f.variants.map((x, k) => (k === i ? { ...x, ...patch } : x)));
                          return (
                            <tr key={v.title}>
                              <td className="font-medium text-xs min-w-[100px]">{v.title}</td>
                              <td><input type="number" step="0.01" value={v.price ?? ""} onChange={(e) => up({ price: e.target.value ? Number(e.target.value) : null })} placeholder={String(f.price)} className="input py-1 w-20 text-xs" /></td>
                              <td><input value={v.sku ?? ""} onChange={(e) => up({ sku: e.target.value })} className="input py-1 w-24 text-xs font-mono" placeholder="SKU" /></td>
                              <td><input type="number" value={v.stock} onChange={(e) => up({ stock: Number(e.target.value) })} className="input py-1 w-14 text-xs" /></td>
                              <td className="min-w-[120px]">
                                <div className="flex items-center gap-2">
                                  {v.image ? <img src={v.image} alt="" className="h-8 w-8 rounded object-cover border" /> : <div className="h-8 w-8 rounded bg-gray-100 border flex items-center justify-center text-[10px] text-gray-400">No img</div>}
                                  <div className="flex-1">
                                    <ImageUploader value={v.image ? [v.image] : []} onChange={(vals) => up({ image: vals[0] ?? null })} multiple={false} folder="variants" />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-3 bg-[#f0f5ff] border border-[#c2d6ff] rounded-xl text-xs text-[#212121]">
                    <b>Variant images (optional):</b> Add specific image for each variant (e.g. Red variant shows red product). If not set, main product images will be used. Perfect for clothing colors & jewellery finishes.
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "seo" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold mb-4">Search engine listing</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">URL slug</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-xs text-gray-500">/products/</span>
                    <input value={f.slug} onChange={(e) => set("slug", e.target.value)} className="input rounded-l-none font-mono text-xs flex-1" placeholder="product-name" />
                  </div>
                </div>
                <div>
                  <label className="label">SEO title</label>
                  <input value={f.seoTitle ?? ""} onChange={(e) => set("seoTitle", e.target.value)} className="input" placeholder={f.name || "Leave empty to use product name"} />
                  <div className="text-[11px] text-gray-500 mt-1">{(f.seoTitle || f.name).length} characters · Recommended 50-60</div>
                </div>
                <div>
                  <label className="label">Meta description</label>
                  <textarea value={f.seoDescription ?? ""} onChange={(e) => set("seoDescription", e.target.value)} rows={3} className="input text-xs" placeholder="Brief description for search results" />
                  <div className="text-[11px] text-gray-500 mt-1">{(f.seoDescription || "").length} characters · Recommended 150-160</div>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">Preview</div>
                  <div className="text-[#1a0dab] text-sm font-medium truncate">{f.seoTitle || f.name || "Product title"}</div>
                  <div className="text-[#006621] text-xs truncate">https://yourstore.com/products/{f.slug || "product-slug"}</div>
                  <div className="text-xs text-gray-600 mt-1 line-clamp-2">{f.seoDescription || f.shortDescription || "Product description will appear here..."}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar - status & organization */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-sm mb-3">Publish</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Status</label>
                <select value={f.status} onChange={(e) => set("status", e.target.value as ProductInput["status"])} className="input rounded-full">
                  <option value="active">Active · Visible in store</option>
                  <option value="draft">Draft · Hidden</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer">
                <input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} className="rounded" />
                <div className="text-sm">
                  <div className="font-semibold flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-amber-600" /> Featured</div>
                  <div className="text-xs text-amber-800">Show on homepage</div>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Tag className="h-4 w-4" /> Organization</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Category</label>
                <select value={f.categoryId ?? ""} onChange={(e) => set("categoryId", e.target.value)} className="input rounded-full">
                  <option value="">— No category —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.parentId ? "↳ " : ""}{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Tags</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {f.tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 bg-gray-900 text-white px-2.5 py-1 rounded-full text-xs font-medium">
                      {t}
                      <button type="button" onClick={() => set("tags", f.tags.filter((x) => x !== t))} className="h-4 w-4 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
                      e.preventDefault();
                      set("tags", [...new Set([...f.tags, tagInput.trim().toLowerCase()])]);
                      setTagInput("");
                    }
                  }}
                  placeholder="Type tag + Enter"
                  className="input rounded-full"
                />
                <div className="text-[11px] text-gray-500 mt-1">Tags help customers find products via search</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 text-white rounded-2xl p-5">
            <div className="font-bold text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-amber-400" /> Quick tips</div>
            <ul className="mt-3 space-y-2 text-xs text-white/70">
              <li>• Use clear name & high-quality images</li>
              <li>• Set compare-at price to show discount</li>
              <li>• Add tags for better search</li>
              <li>• Featured products appear on homepage</li>
            </ul>
            <div className="mt-4 pt-4 border-t border-white/10 text-[11px] text-white/50">Completion: {completion}% · {f.images.length} images · {f.variants.length} variants</div>
          </div>
        </div>
      </div>

      {/* Mobile save bar */}
      <div className="lg:hidden fixed bottom-[68px] left-0 right-0 bg-white border-t p-3 flex gap-2 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <button onClick={() => submit()} disabled={pending} className="btn-primary flex-1 rounded-full">
          <Save className="h-4 w-4" /> {pending ? "Saving..." : "Save product"}
        </button>
      </div>
    </div>
  );
}
