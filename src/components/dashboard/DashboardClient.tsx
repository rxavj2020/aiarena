"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Package,
  ShoppingCart,
  Plug,
  Settings,
  Rocket,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Sparkles,
  LogOut,
  ChevronRight,
  Search,
  Globe,
  Loader2,
  AlertCircle,
  KeyRound,
  Eye,
  LayoutDashboard,
} from "lucide-react";
import type { Tenant } from "@/lib/db/schema";
import type { SessionUser } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import { saveWorkspaceProduct, deleteWorkspaceProduct } from "@/actions/tenant-admin";
import {
  updateWorkspaceBrand,
  launchWorkspace,
  setWorkspaceStatus,
  connectWorkspaceDomain,
} from "@/actions/platform";
import {
  saveTenantPluginConfig,
  toggleTenantPlugin,
  testTenantPluginAction,
} from "@/actions/tenant-plugins";
import type { TenantPluginDefinition, TenantPluginState } from "@/lib/tenant-plugins";
import { resolveTheme, type TenantTheme } from "@/lib/themes";
import { ThemeEditor, type ThemeFormValue } from "./ThemeEditor";
import { DashboardOverview, type DashboardStats } from "./DashboardOverview";

type ProductItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  status: "active" | "draft" | "archived";
  image: string;
};

type OrderItem = {
  id: string;
  orderNumber: string;
  email: string;
  phone: string;
  status: string;
  paymentStatus: string;
  total: number;
  itemCount: number;
  createdAt: string;
  shippingAddress?: { name?: string; city?: string; state?: string } | null;
};

type PluginItem = {
  def: TenantPluginDefinition;
  state: TenantPluginState;
  maskedConfig: Record<string, string>;
  hasSecret: Record<string, boolean>;
};

type DomainItem = {
  id: string;
  hostname: string;
  status: string;
};

export function DashboardClient({
  user,
  tenant,
  initialProducts,
  initialOrders,
  plugins,
  domains,
  theme,
  stats,
  initialTab,
  currency = "INR",
}: {
  user: SessionUser;
  tenant: Tenant;
  initialProducts: ProductItem[];
  initialOrders: OrderItem[];
  plugins: PluginItem[];
  domains: DomainItem[];
  theme: TenantTheme;
  stats: DashboardStats;
  initialTab?: string;
  currency?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Tab navigation
  const isNewStore = tenant.status === "setup";
  const TAB_IDS = ["overview", "setup", "products", "orders", "plugins", "settings"] as const;
  type TabId = (typeof TAB_IDS)[number];
  const normalizeTab = (t?: string): TabId =>
    (TAB_IDS as readonly string[]).includes(t ?? "") ? (t as TabId) : isNewStore ? "setup" : "overview";
  const [activeTab, setActiveTabState] = useState<TabId>(normalizeTab(initialTab));
  const setActiveTab = (t: TabId) => {
    setActiveTabState(t);
    router.replace(`/dashboard?tab=${t}`, { scroll: false });
  };

  // Status feedback toast
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);

  // Product Form state
  const [productsList, setProductsList] = useState<ProductItem[]>(initialProducts);
  const [editingProduct, setEditingProduct] = useState<Partial<ProductItem> | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  // Brand Settings state (identity + "Role Trio" theme applied site-wide)
  const [brandForm, setBrandForm] = useState<{ name: string; tagline: string; primaryColor: string; accentColor: string; logoUrl: string; theme: ThemeFormValue }>({
    name: tenant.name,
    tagline: tenant.tagline,
    primaryColor: theme.frameColor,
    accentColor: theme.groundColor,
    logoUrl: tenant.logoUrl || "",
    theme: {
      preset: theme.preset,
      appearance: theme.appearance,
      frameColor: theme.frameColor,
      groundColor: theme.groundColor,
      actionColor: theme.actionColor,
      radius: theme.radius,
      font: theme.font,
    },
  });
  const setThemeForm = (patch: Partial<ThemeFormValue>) =>
    setBrandForm((f) => {
      const nextTheme = { ...f.theme, ...patch };
      return {
        ...f,
        theme: nextTheme,
        // Colours live in one place: the theme. The legacy brand columns mirror
        // Colour 1 (frame) and Colour 2 (ground).
        primaryColor: nextTheme.frameColor,
        accentColor: nextTheme.groundColor,
      };
    });

  // Domain form state
  const [domainHost, setDomainHost] = useState("");

  // Plugin modal state
  const [activePlugin, setActivePlugin] = useState<PluginItem | null>(null);
  const [pluginFormConfig, setPluginFormConfig] = useState<Record<string, string>>({});
  const [pluginTestMessage, setPluginTestMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const showToast = (ok: boolean, message: string) => {
    setNotice({ ok, message });
    setTimeout(() => setNotice(null), 5000);
  };

  // Product actions
  const handleOpenNewProduct = () => {
    setEditingProduct({
      name: "",
      slug: "",
      description: "",
      price: 99900,
      compareAtPrice: null,
      stock: 10,
      status: "active",
      image: "",
    });
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (prod: ProductItem) => {
    setEditingProduct(prod);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.slug) return;

    startTransition(async () => {
      const priceVal = Number(editingProduct.price) / 100;
      const compareVal = editingProduct.compareAtPrice ? Number(editingProduct.compareAtPrice) / 100 : null;

      const res = await saveWorkspaceProduct(tenant.id, {
        id: editingProduct.id,
        name: editingProduct.name,
        slug: editingProduct.slug,
        description: editingProduct.description || "",
        price: priceVal,
        compareAtPrice: compareVal,
        stock: Number(editingProduct.stock) || 0,
        status: editingProduct.status || "active",
        image: editingProduct.image || "",
      });

      if (res.ok) {
        showToast(true, res.message || "Product saved successfully!");
        setIsProductModalOpen(false);
        router.refresh();
      } else {
        showToast(false, res.error);
      }
    });
  };

  const handleDeleteProduct = (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    startTransition(async () => {
      const res = await deleteWorkspaceProduct(tenant.id, productId);
      if (res.ok) {
        showToast(true, "Product deleted");
        setProductsList((prev) => prev.filter((p) => p.id !== productId));
        router.refresh();
      } else {
        showToast(false, res.error);
      }
    });
  };

  // Launch Store Action
  const handleLaunchStore = () => {
    startTransition(async () => {
      const res = await launchWorkspace(tenant.id);
      if (res.ok) {
        showToast(true, res.message || "Store launched! Your store is now live.");
        setActiveTab("products");
        router.refresh();
      } else {
        showToast(false, res.error);
      }
    });
  };

  // Status toggle
  const handleStatusChange = (newStatus: "active" | "setup" | "paused") => {
    startTransition(async () => {
      const res = await setWorkspaceStatus(tenant.id, newStatus);
      if (res.ok) {
        showToast(true, res.message || "Status updated");
        router.refresh();
      } else {
        showToast(false, res.error);
      }
    });
  };

  // Brand Settings submit
  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const resolved: TenantTheme = resolveTheme(brandForm.theme);
      const res = await updateWorkspaceBrand(tenant.id, {
        name: brandForm.name,
        tagline: brandForm.tagline,
        logoUrl: brandForm.logoUrl,
        primaryColor: resolved.frameColor,
        accentColor: resolved.groundColor,
        theme: { ...resolved },
      });
      if (res.ok) {
        showToast(true, "Brand & theme saved — every page of your website now uses them.");
        router.refresh();
      } else {
        showToast(false, res.error);
      }
    });
  };

  // Domain submit
  const handleSaveDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainHost) return;
    startTransition(async () => {
      const res = await connectWorkspaceDomain(tenant.id, domainHost);
      if (res.ok) {
        showToast(true, "Domain added. Set your DNS records to verify.");
        setDomainHost("");
        router.refresh();
      } else {
        showToast(false, res.error);
      }
    });
  };

  // Plugin configuration
  const handleOpenPlugin = (plugin: PluginItem) => {
    setActivePlugin(plugin);
    setPluginFormConfig(plugin.maskedConfig || {});
    setPluginTestMessage(null);
  };

  const handleTogglePlugin = (pluginId: string, enabled: boolean) => {
    startTransition(async () => {
      const res = await toggleTenantPlugin(tenant.id, pluginId, enabled);
      if (res.ok) {
        showToast(true, enabled ? "Plugin enabled" : "Plugin disabled");
        router.refresh();
      } else {
        showToast(false, res.error);
      }
    });
  };

  const handleSavePluginConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlugin) return;
    startTransition(async () => {
      const res = await saveTenantPluginConfig(tenant.id, activePlugin.def.id, pluginFormConfig);
      if (res.ok) {
        showToast(true, "Plugin configuration saved!");
        setActivePlugin(null);
        router.refresh();
      } else {
        showToast(false, res.error);
      }
    });
  };

  const handleTestPlugin = () => {
    if (!activePlugin) return;
    setPluginTestMessage(null);
    startTransition(async () => {
      const res = await testTenantPluginAction(tenant.id, activePlugin.def.id, pluginFormConfig);
      setPluginTestMessage({ ok: res.ok, text: res.ok ? (res.message || "Connection successful!") : res.error });
    });
  };

  const filteredProducts = productsList.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const navItems: { id: TabId; label: string; icon: typeof LayoutDashboard; badge?: number; pulse?: boolean }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    ...(isNewStore ? [{ id: "setup" as TabId, label: "Setup Guide", icon: Rocket, pulse: true }] : []),
    { id: "products", label: "Products", icon: Package, badge: productsList.length },
    { id: "orders", label: "Orders", icon: ShoppingCart, badge: initialOrders.length },
    { id: "plugins", label: "Plugins", icon: Plug },
    { id: "settings", label: "Settings", icon: Settings },
    ...(!isNewStore ? [{ id: "setup" as TabId, label: "Launch / Setup", icon: Rocket }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#0f0f0e] text-white flex flex-col font-sans">
      {/* Toast Notice */}
      {notice && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-2xl px-5 py-3.5 shadow-2xl text-sm font-semibold border animate-fade-in ${
            notice.ok
              ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-200"
              : "bg-red-950/90 border-red-500/30 text-red-200"
          }`}
        >
          {notice.ok ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <AlertCircle className="h-5 w-5 text-red-400" />}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="border-b border-white/10 bg-[#141413]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-2xl flex items-center justify-center font-bold text-sm shadow-inner"
              style={{ backgroundColor: tenant.primaryColor || "#e9c78d", color: "#11110f" }}
            >
              {tenant.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight">{tenant.name}</span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    tenant.status === "active"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : tenant.status === "paused"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  }`}
                >
                  {tenant.status === "active" ? "Live" : tenant.status === "paused" ? "Paused" : "Setup Mode"}
                </span>
              </div>
              <p className="text-xs text-white/40 hidden sm:block">{tenant.tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/store/${tenant.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/10 transition"
            >
              <span>Visit Website</span>
              <ExternalLink className="h-3.5 w-3.5 text-white/50" />
            </Link>

            <div className="hidden md:flex flex-col text-right text-xs">
              <span className="font-semibold text-white/80">{user.name}</span>
              <span className="text-white/40">{user.email}</span>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                title="Log out"
                className="h-9 w-9 rounded-xl border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar navigation */}
        <aside className="hidden lg:flex w-[230px] shrink-0 flex-col gap-1 border-r border-white/5 p-4 sticky top-[65px] self-start h-[calc(100vh-65px)]">
          <nav className="flex flex-col gap-1">
            {navItems.map((n) => (
              <button
                key={n.id}
                onClick={() => setActiveTab(n.id)}
                className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition text-left ${
                  activeTab === n.id ? "bg-white text-[#0f0f0e] shadow-sm" : "text-white/55 hover:bg-white/5 hover:text-white"
                }`}
              >
                <n.icon className="h-[17px] w-[17px] shrink-0" />
                <span className="flex-1">{n.label}</span>
                {typeof n.badge === "number" && n.badge > 0 ? (
                  <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${activeTab === n.id ? "bg-black/10" : "bg-white/10 text-white/60"}`}>{n.badge}</span>
                ) : null}
                {n.pulse ? <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" /> : null}
              </button>
            ))}
          </nav>
          <div className="mt-auto px-3 pt-4 text-[10px] uppercase tracking-widest text-white/25">Private store admin</div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile tab row */}
        <div className="lg:hidden -mx-4 mb-4 px-4 flex gap-1 overflow-x-auto no-scrollbar border-b border-white/5 pb-2">
          {navItems.map((n) => (
            <button
              key={n.id}
              onClick={() => setActiveTab(n.id)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition inline-flex items-center gap-1.5 ${
                activeTab === n.id ? "bg-[#e9c78d] text-[#11110f]" : "bg-white/5 text-white/55"
              }`}
            >
              <n.icon className="h-3.5 w-3.5" /> {n.label}
            </button>
          ))}
        </div>

        {/* ======================= TAB: OVERVIEW ======================= */}
        {activeTab === "overview" && (
          <DashboardOverview
            tenant={tenant}
            stats={stats}
            orders={initialOrders}
            currency={currency}
            isNewStore={isNewStore}
            onTab={(t) => setActiveTab(normalizeTab(t))}
          />
        )}

        {/* ======================= TAB: SETUP ======================= */}
        {activeTab === "setup" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Setup Progress Banner */}
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a1a17] to-[#121210] p-6 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#e9c78d]/10 border border-[#e9c78d]/20 px-3 py-1 text-xs font-bold text-[#e9c78d] mb-3">
                    <Sparkles className="h-3.5 w-3.5" /> Quick Launch Setup
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {tenant.status === "active" ? "Your store is live!" : "Get your store ready for customers"}
                  </h1>
                  <p className="mt-2 text-sm text-white/60 max-w-lg">
                    Customize your store branding, add products, and configure optional payment plugins. Everything connects directly to your unique website.
                  </p>
                </div>

                <div className="shrink-0 flex flex-col gap-2 sm:items-end">
                  {tenant.status === "setup" ? (
                    <button
                      onClick={handleLaunchStore}
                      disabled={pending}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#e9c78d] px-6 py-3.5 text-sm font-bold text-[#11110f] hover:bg-[#f3d7a8] transition shadow-xl"
                    >
                      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                      Launch Store Now
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2.5 text-emerald-300 text-xs font-bold">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      Live at /store/{tenant.slug}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 1: Branding */}
            <div className="rounded-3xl border border-white/10 bg-[#161614] p-6 sm:p-7">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold">Step 1: Store Branding & Identity</h2>
                  <p className="text-xs text-white/50">Changes update your storefront immediately.</p>
                </div>
                <span className="text-xs font-bold text-[#e9c78d] bg-[#e9c78d]/10 px-2.5 py-1 rounded-full">
                  Step 1
                </span>
              </div>

              <form onSubmit={handleSaveBrand} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1.5">Store Name</label>
                    <input
                      type="text"
                      required
                      value={brandForm.name}
                      onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#e9c78d]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1.5">Tagline</label>
                    <input
                      type="text"
                      value={brandForm.tagline}
                      onChange={(e) => setBrandForm({ ...brandForm, tagline: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#e9c78d]"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1.5">Colour 1 · Header</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={brandForm.theme.frameColor} onChange={(e) => setThemeForm({ frameColor: e.target.value })} className="h-9 w-12 rounded border-0 bg-transparent cursor-pointer" />
                      <input type="text" value={brandForm.theme.frameColor} onChange={(e) => setThemeForm({ frameColor: e.target.value })} className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-mono text-white outline-none focus:border-[#e9c78d]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1.5">Colour 2 · Footer</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={brandForm.theme.groundColor} onChange={(e) => setThemeForm({ groundColor: e.target.value })} className="h-9 w-12 rounded border-0 bg-transparent cursor-pointer" />
                      <input type="text" value={brandForm.theme.groundColor} onChange={(e) => setThemeForm({ groundColor: e.target.value })} className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-mono text-white outline-none focus:border-[#e9c78d]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1.5">Colour 3 · Buttons</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={brandForm.theme.actionColor} onChange={(e) => setThemeForm({ actionColor: e.target.value })} className="h-9 w-12 rounded border-0 bg-transparent cursor-pointer" />
                      <input type="text" value={brandForm.theme.actionColor} onChange={(e) => setThemeForm({ actionColor: e.target.value })} className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-mono text-white outline-none focus:border-[#e9c78d]" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition"
                  >
                    Save Branding
                  </button>
                </div>
              </form>
            </div>

            {/* Step 2: Next steps */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div
                onClick={() => setActiveTab("products")}
                className="cursor-pointer rounded-3xl border border-white/10 bg-[#161614] p-6 hover:border-[#e9c78d]/50 transition group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-2xl bg-[#e9c78d]/10 text-[#e9c78d] flex items-center justify-center">
                    <Package className="h-5 w-5" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white transition" />
                </div>
                <h3 className="font-bold text-base">Step 2: Add Products</h3>
                <p className="mt-1 text-xs text-white/50">
                  {productsList.length} products currently in your catalogue. Add items to sell.
                </p>
              </div>

              <div
                onClick={() => setActiveTab("plugins")}
                className="cursor-pointer rounded-3xl border border-white/10 bg-[#161614] p-6 hover:border-[#e9c78d]/50 transition group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <Plug className="h-5 w-5" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white transition" />
                </div>
                <h3 className="font-bold text-base">Step 3: Connect Payments</h3>
                <p className="mt-1 text-xs text-white/50">
                  Configure Razorpay, Cashfree, or email notifications for orders.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB: PRODUCTS ======================= */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Catalogue & Products</h1>
                <p className="text-xs text-white/50 mt-0.5">
                  Products created here appear instantly on your website at /store/{tenant.slug}.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="rounded-xl border border-white/10 bg-white/5 pl-9 pr-3.5 py-2 text-xs text-white outline-none focus:border-[#e9c78d] w-48 sm:w-64"
                  />
                </div>

                <button
                  onClick={handleOpenNewProduct}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#e9c78d] px-4 py-2.5 text-xs font-bold text-[#11110f] hover:bg-[#f3d7a8] transition shadow"
                >
                  <Plus className="h-4 w-4" />
                  Add Product
                </button>
              </div>
            </div>

            {/* Products Table / Cards */}
            <div className="rounded-3xl border border-white/10 bg-[#161614] overflow-hidden">
              {filteredProducts.length === 0 ? (
                <div className="p-12 text-center">
                  <Package className="mx-auto h-12 w-12 text-white/20 mb-3" />
                  <h3 className="font-bold text-base text-white/80">No products found</h3>
                  <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto">
                    {productSearch ? "No products match your search query." : "Add your first product to start selling on your unique website."}
                  </p>
                  {!productSearch && (
                    <button
                      onClick={handleOpenNewProduct}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#e9c78d] px-4 py-2.5 text-xs font-bold text-[#11110f]"
                    >
                      <Plus className="h-4 w-4" />
                      Add First Product
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-14 w-14 shrink-0 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center text-xs text-white/30">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm truncate">{p.name}</span>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                p.status === "active"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              }`}
                            >
                              {p.status}
                            </span>
                          </div>
                          <p className="text-xs text-white/40 mt-0.5 truncate">/products/{p.slug}</p>
                          <div className="flex items-center gap-3 text-xs text-white/60 mt-1.5 font-medium">
                            <span className="text-[#e9c78d] font-bold">₹{(p.price / 100).toLocaleString("en-IN")}</span>
                            {p.compareAtPrice && (
                              <span className="line-through text-white/30">
                                ₹{(p.compareAtPrice / 100).toLocaleString("en-IN")}
                              </span>
                            )}
                            <span>·</span>
                            <span>{p.stock} in stock</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Link
                          href={`/products/${p.slug}`}
                          target="_blank"
                          title="View on site"
                          className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => handleEditProduct(p)}
                          title="Edit product"
                          className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/5 transition"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          title="Delete product"
                          className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================= TAB: ORDERS ======================= */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Customer Orders</h1>
                <p className="text-xs text-white/50 mt-0.5">Orders placed on your storefront appear here in real time.</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-white/10 bg-[#161614] p-5">
                <span className="text-xs font-semibold text-white/40 uppercase">Total Orders</span>
                <div className="text-2xl font-bold mt-2">{initialOrders.length}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#161614] p-5">
                <span className="text-xs font-semibold text-white/40 uppercase">Total Sales</span>
                <div className="text-2xl font-bold mt-2 text-[#e9c78d]">
                  ₹{(initialOrders.reduce((sum, o) => sum + (o.total || 0), 0) / 100).toLocaleString("en-IN")}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#161614] p-5 col-span-2 sm:col-span-1">
                <span className="text-xs font-semibold text-white/40 uppercase">Pending Delivery</span>
                <div className="text-2xl font-bold mt-2">
                  {initialOrders.filter((o) => ["pending", "confirmed"].includes(o.status.toLowerCase())).length}
                </div>
              </div>
            </div>

            {/* Orders List */}
            <div className="rounded-3xl border border-white/10 bg-[#161614] overflow-hidden">
              {initialOrders.length === 0 ? (
                <div className="p-12 text-center">
                  <ShoppingCart className="mx-auto h-12 w-12 text-white/20 mb-3" />
                  <h3 className="font-bold text-base text-white/80">No orders yet</h3>
                  <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto">
                    When customers purchase items from /store/{tenant.slug}, their orders will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {initialOrders.map((o) => (
                    <div
                      key={o.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">Order #{o.orderNumber}</span>
                          <span className="text-xs text-white/40">·</span>
                          <span className="text-xs text-white/50">{new Date(o.createdAt).toLocaleDateString("en-IN")}</span>
                          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold px-2 py-0.5 capitalize">
                            {o.status}
                          </span>
                        </div>
                        <p className="text-xs text-white/60 mt-1 font-medium">{o.email || "Guest customer"}</p>
                        {o.shippingAddress && (
                          <p className="text-xs text-white/40 mt-0.5">
                            {o.shippingAddress.name} · {o.shippingAddress.city}, {o.shippingAddress.state}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-bold text-white">₹{(o.total / 100).toLocaleString("en-IN")}</div>
                        <span className="text-[10px] font-bold uppercase text-white/40 tracking-wider">
                          {o.paymentStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================= TAB: PLUGINS ======================= */}
        {activeTab === "plugins" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Integrations & Plugins</h1>
              <p className="text-xs text-white/50 mt-0.5">
                Connect payments, shipping, email, storage and database directly to your store.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plugins.map((item) => {
                const isEnabled = item.state.enabled;
                return (
                  <div
                    key={item.def.id}
                    className="rounded-3xl border border-white/10 bg-[#161614] p-5 flex flex-col justify-between hover:border-white/20 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <span className="text-3xl">{item.def.icon}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleTogglePlugin(item.def.id, !isEnabled)}
                            disabled={pending}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isEnabled ? "bg-emerald-600" : "bg-white/10"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                isEnabled ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-bold text-base">{item.def.name}</h3>
                      <p className="text-xs text-white/50 mt-1 line-clamp-2 leading-relaxed">
                        {item.def.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-white/40">
                        {isEnabled ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Active
                          </span>
                        ) : (
                          "Disabled"
                        )}
                      </span>

                      <button
                        onClick={() => handleOpenPlugin(item)}
                        className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition"
                      >
                        <KeyRound className="h-3 w-3 text-white/60" />
                        Configure
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================= TAB: SETTINGS ======================= */}
        {activeTab === "settings" && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Store Settings</h1>
              <p className="text-xs text-white/50 mt-0.5">Manage domain, store availability, brand and the theme used on every page of your website.</p>
            </div>

            {/* Store Status Toggle */}
            <div className="rounded-3xl border border-white/10 bg-[#161614] p-6">
              <h2 className="text-base font-bold mb-1">Store Availability</h2>
              <p className="text-xs text-white/50 mb-4">Control whether customers can visit and buy from your website.</p>

              <div className="flex flex-wrap gap-2">
                {(["active", "setup", "paused"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold capitalize transition border ${
                      tenant.status === st
                        ? "bg-[#e9c78d] text-[#11110f] border-[#e9c78d]"
                        : "bg-white/5 text-white/60 border-white/10 hover:border-white/20"
                    }`}
                  >
                    {st === "active" ? "Live (Open)" : st === "setup" ? "Setup Mode" : "Paused"}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Settings */}
            <div className="rounded-3xl border border-white/10 bg-[#161614] p-6">
              <h2 className="text-base font-bold mb-1">Brand & Theme</h2>
              <p className="text-xs text-white/50 mb-5">Identity and look — saved here, applied to every page of your website.</p>

              <form onSubmit={handleSaveBrand} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">Store Name</label>
                  <input
                    type="text"
                    value={brandForm.name}
                    onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#e9c78d]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">Tagline</label>
                  <input
                    type="text"
                    value={brandForm.tagline}
                    onChange={(e) => setBrandForm({ ...brandForm, tagline: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#e9c78d]"
                  />
                </div>

                <div className="pt-2">
                  <ThemeEditor value={brandForm.theme} onChange={setThemeForm} />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-xl bg-[#e9c78d] px-5 py-2.5 text-xs font-bold text-[#11110f] hover:bg-[#f3d7a8] transition"
                  >
                    Save Brand & Theme
                  </button>
                </div>
              </form>
            </div>

            {/* Custom Domain */}
            <div className="rounded-3xl border border-white/10 bg-[#161614] p-6">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="h-4 w-4 text-[#e9c78d]" />
                <h2 className="text-base font-bold">Custom Domain</h2>
              </div>
              <p className="text-xs text-white/50 mb-4">
                Connect your custom domain (e.g. shop.yourbrand.com) to your store.
              </p>

              {domains.length > 0 && (
                <div className="space-y-2 mb-4">
                  {domains.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-xs"
                    >
                      <span className="font-mono font-bold">{d.hostname}</span>
                      <span className="rounded-full bg-blue-500/20 text-blue-300 px-2 py-0.5 font-bold text-[10px]">
                        {d.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSaveDomain} className="flex gap-2">
                <input
                  type="text"
                  placeholder="shop.yourbrand.com"
                  value={domainHost}
                  onChange={(e) => setDomainHost(e.target.value)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white outline-none focus:border-[#e9c78d]"
                />
                <button
                  type="submit"
                  disabled={pending || !domainHost}
                  className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition disabled:opacity-50"
                >
                  Connect Domain
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
      </div>

      {/* ======================= MODAL: ADD/EDIT PRODUCT ======================= */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#181816] p-6 sm:p-7 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <h3 className="font-bold text-lg">{editingProduct.id ? "Edit Product" : "Add New Product"}</h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-white/40 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ""}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = editingProduct.id
                      ? editingProduct.slug
                      : name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                    setEditingProduct({ ...editingProduct, name, slug });
                  }}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white outline-none focus:border-[#e9c78d]"
                  placeholder="e.g. Silk Embroidered Kurta"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">URL Slug</label>
                <input
                  type="text"
                  required
                  value={editingProduct.slug || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-mono text-white outline-none focus:border-[#e9c78d]"
                  placeholder="silk-embroidered-kurta"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={editingProduct.price != null ? editingProduct.price / 100 : ""}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: Math.round(Number(e.target.value) * 100) })
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white outline-none focus:border-[#e9c78d]"
                    placeholder="1499"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Compare Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editingProduct.compareAtPrice != null ? editingProduct.compareAtPrice / 100 : ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        compareAtPrice: e.target.value ? Math.round(Number(e.target.value) * 100) : null,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white outline-none focus:border-[#e9c78d]"
                    placeholder="1999"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={editingProduct.stock != null ? editingProduct.stock : 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white outline-none focus:border-[#e9c78d]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Status</label>
                  <select
                    value={editingProduct.status || "active"}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, status: e.target.value as "active" | "draft" })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#20201d] px-3.5 py-2 text-sm text-white outline-none focus:border-[#e9c78d]"
                  >
                    <option value="active">Active (Published)</option>
                    <option value="draft">Draft (Hidden)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Image URL</label>
                <input
                  type="url"
                  value={editingProduct.image || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white outline-none focus:border-[#e9c78d]"
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white outline-none focus:border-[#e9c78d]"
                  placeholder="Details about craftsmanship, fabric, fit, etc."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-xl bg-[#e9c78d] px-5 py-2 text-xs font-bold text-[#11110f] hover:bg-[#f3d7a8] transition"
                >
                  {pending ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: PLUGIN CONFIG ======================= */}
      {activePlugin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#181816] p-6 sm:p-7 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{activePlugin.def.icon}</span>
                <div>
                  <h3 className="font-bold text-base">{activePlugin.def.name}</h3>
                  <p className="text-xs text-white/40">Configure store integration credentials</p>
                </div>
              </div>
              <button onClick={() => setActivePlugin(null)} className="text-white/40 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePluginConfig} className="space-y-4">
              {activePlugin.def.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-semibold text-white/70 mb-1">
                    {field.label} {field.required && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    type={field.type === "password" ? "password" : "text"}
                    value={pluginFormConfig[field.key] || ""}
                    placeholder={field.placeholder || ""}
                    onChange={(e) =>
                      setPluginFormConfig({ ...pluginFormConfig, [field.key]: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white outline-none focus:border-[#e9c78d]"
                  />
                  {field.help && <p className="text-[10px] text-white/40 mt-1">{field.help}</p>}
                </div>
              ))}

              {pluginTestMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold border ${
                    pluginTestMessage.ok
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-red-500/10 border-red-500/30 text-red-300"
                  }`}
                >
                  {pluginTestMessage.text}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleTestPlugin}
                  disabled={pending}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10 transition"
                >
                  Test Connection
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActivePlugin(null)}
                    className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-white/60 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-xl bg-[#e9c78d] px-5 py-2 text-xs font-bold text-[#11110f] hover:bg-[#f3d7a8] transition"
                  >
                    {pending ? "Saving..." : "Save Credentials"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
