"use client";

import { THEME_PRESETS, type Appearance, type ThemeColorMode, type ThemeFont, type ThemePresetId, type ThemeRadius } from "@/lib/themes";

export type ThemeFormValue = {
  preset: ThemePresetId;
  appearance: Appearance;
  colorMode: ThemeColorMode;
  radius: ThemeRadius;
  font: ThemeFont;
  primaryColor: string;
  accentColor: string;
  tertiaryColor: string;
};

/**
 * Owner-side theme editor. Supports two-colour and three-colour palettes —
 * the colour mode saved here drives the whole website's look (solid surfaces
 * for duo themes, flowing tri-colour gradients for trio themes).
 */
export function ThemeEditor({ value, onChange }: { value: ThemeFormValue; onChange: (patch: Partial<ThemeFormValue>) => void }) {
  const preset = THEME_PRESETS.find((p) => p.id === value.preset) ?? THEME_PRESETS[0];
  const trio = value.colorMode === "three";
  const dots = trio ? [value.primaryColor, value.accentColor, value.tertiaryColor] : [value.primaryColor, value.accentColor];
  const previewGradient = trio
    ? `linear-gradient(95deg, ${value.primaryColor} 0%, ${value.accentColor} 55%, ${value.tertiaryColor} 130%)`
    : `linear-gradient(95deg, ${value.primaryColor} 0%, ${value.accentColor} 130%)`;

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-white/70 mb-2">Colour style</label>
        <div className="flex gap-2">
          {([
            { id: "two" as ThemeColorMode, label: "Two colours", hint: "Primary + accent, clean and solid" },
            { id: "three" as ThemeColorMode, label: "Three colours", hint: "Trending tri-colour gradients" },
          ]).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange({ colorMode: m.id, ...(m.id === "three" && !value.tertiaryColor ? { tertiaryColor: preset.tertiaryColor } : {}) })}
              className={`flex-1 rounded-xl border p-3 text-left transition ${value.colorMode === m.id ? "border-[#e9c78d] bg-[#e9c78d]/10" : "border-white/10 bg-white/5 hover:border-white/25"}`}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                {(m.id === "three" ? [value.primaryColor, value.accentColor, value.tertiaryColor || "#888"] : [value.primaryColor, value.accentColor]).map((c, i) => (
                  <span key={i} className="h-3.5 w-3.5 rounded-full" style={{ background: c }} />
                ))}
              </div>
              <div className="text-xs font-bold text-white">{m.label}</div>
              <div className="text-[10px] text-white/40">{m.hint}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-white/70 mb-2">Theme preset</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {THEME_PRESETS.map((p) => {
            const active = value.preset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() =>
                  onChange({
                    preset: p.id,
                    colorMode: p.colorMode,
                    primaryColor: p.primaryColor,
                    accentColor: p.accentColor,
                    tertiaryColor: p.tertiaryColor,
                    radius: p.radius,
                    font: p.font,
                    appearance: p.appearance,
                  })
                }
                className={`rounded-xl border p-3 text-left transition ${active ? "border-[#e9c78d] bg-[#e9c78d]/10" : "border-white/10 bg-white/5 hover:border-white/25"}`}
              >
                <div className="flex items-center gap-1 mb-2">
                  {(p.colorMode === "three" ? [p.primaryColor, p.accentColor, p.tertiaryColor] : [p.primaryColor, p.accentColor]).map((c, i) => (
                    <span key={i} className="h-4 w-4 rounded-full" style={{ background: c }} />
                  ))}
                  <span className={`ml-auto text-[9px] font-bold uppercase tracking-wider ${active ? "text-[#e9c78d]" : "text-white/30"}`}>
                    {p.colorMode === "three" ? "3-col" : "2-col"}
                  </span>
                </div>
                <div className="text-xs font-bold text-white">{p.label}</div>
                <div className="text-[10px] leading-snug text-white/40 mt-0.5">{p.blurb}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: trio ? "1fr 1fr 1fr" : "1fr 1fr" }}>
        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1.5">Primary</label>
          <div className="flex items-center gap-2">
            <input type="color" value={value.primaryColor} onChange={(e) => onChange({ primaryColor: e.target.value })} className="h-9 w-12 rounded border-0 bg-transparent cursor-pointer" />
            <input type="text" value={value.primaryColor} onChange={(e) => onChange({ primaryColor: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono text-white outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1.5">Accent</label>
          <div className="flex items-center gap-2">
            <input type="color" value={value.accentColor} onChange={(e) => onChange({ accentColor: e.target.value })} className="h-9 w-12 rounded border-0 bg-transparent cursor-pointer" />
            <input type="text" value={value.accentColor} onChange={(e) => onChange({ accentColor: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono text-white outline-none" />
          </div>
        </div>
        {trio ? (
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5">Third</label>
            <div className="flex items-center gap-2">
              <input type="color" value={value.tertiaryColor} onChange={(e) => onChange({ tertiaryColor: e.target.value })} className="h-9 w-12 rounded border-0 bg-transparent cursor-pointer" />
              <input type="text" value={value.tertiaryColor} onChange={(e) => onChange({ tertiaryColor: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono text-white outline-none" />
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1.5">Heading font</label>
          <select value={value.font} onChange={(e) => onChange({ font: e.target.value as ThemeFont })} className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#e9c78d]">
            <option value="sans">Sans</option>
            <option value="display">Display</option>
            <option value="serif">Serif</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1.5">Corner style</label>
          <select value={value.radius} onChange={(e) => onChange({ radius: e.target.value as ThemeRadius })} className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#e9c78d]">
            <option value="sharp">Sharp</option>
            <option value="soft">Soft</option>
            <option value="round">Round</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-white/70 mb-1.5">Default appearance (visitors can switch)</label>
        <div className="flex gap-2">
          {(["light", "dark", "system"] as Appearance[]).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => onChange({ appearance: a })}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition border ${value.appearance === a ? "bg-[#e9c78d] text-[#11110f] border-[#e9c78d]" : "bg-white/5 text-white/60 border-white/10 hover:border-white/20"}`}
            >
              {a}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-white/35 mt-1.5">A shopper&apos;s choice is remembered across every page of your website.</p>
      </div>

      {/* Live preview of the website theme */}
      <div>
        <label className="block text-xs font-semibold text-white/70 mb-1.5">Preview</label>
        <div
          className="rounded-2xl border border-white/10 overflow-hidden"
          style={{ background: value.appearance === "dark" ? "#131311" : "#faf9f6", color: value.appearance === "dark" ? "#f2f0ea" : "#171715", fontFamily: value.font === "serif" ? "Georgia, serif" : value.font === "display" ? "'Plus Jakarta Sans', sans-serif" : "Inter, sans-serif" }}
        >
          {/* Palette stripe — 2 or 3 colour blocks */}
          <div className="h-1.5 flex">
            {dots.map((c, i) => (
              <span key={i} className="flex-1" style={{ background: c }} />
            ))}
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 flex items-center justify-center text-xs font-bold" style={{ background: value.primaryColor, color: readable(value.primaryColor), borderRadius: value.radius === "round" ? 10 : 4 }}>A</span>
                <span className="text-sm font-bold">Your store</span>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full font-bold" style={{ background: trio ? previewGradient : value.accentColor, color: readable(value.accentColor) }}>New</span>
            </div>
            <div className="mt-3 text-base font-bold" style={{ fontFamily: "inherit" }}>A storefront that feels like you.</div>
            <div className="mt-1 text-[11px] opacity-60">{trio ? "Three-colour gradient theme" : "Two-colour theme"} — every page keeps it automatically.</div>
            <div className="mt-3 flex gap-2">
              <span className="px-3 py-1.5 text-[11px] font-bold" style={{ background: trio ? previewGradient : value.primaryColor, color: readable(value.primaryColor), borderRadius: value.radius === "sharp" ? 3 : value.radius === "round" ? 999 : 6 }}>Shop now</span>
              <span className="px-3 py-1.5 text-[11px] font-bold" style={{ background: value.accentColor, color: readable(value.accentColor), borderRadius: value.radius === "sharp" ? 3 : value.radius === "round" ? 999 : 6 }}>Deals</span>
              {trio ? (
                <span className="px-3 py-1.5 text-[11px] font-bold" style={{ background: value.tertiaryColor, color: readable(value.tertiaryColor), borderRadius: value.radius === "sharp" ? 3 : value.radius === "round" ? 999 : 6 }}>Gift</span>
              ) : null}
            </div>
          </div>
        </div>
        <p className="text-[11px] text-white/35 mt-1.5">{preset.label} · {trio ? "3 colours" : "2 colours"}</p>
      </div>
    </div>
  );
}

function readable(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return "#fff";
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? "#141412" : "#fff";
}
