"use client";

import { THEME_PRESETS, type Appearance, type ThemeFont, type ThemePresetId, type ThemeRadius } from "@/lib/themes";

export type ThemeFormValue = {
  preset: ThemePresetId;
  appearance: Appearance;
  radius: ThemeRadius;
  font: ThemeFont;
  primaryColor: string;
  accentColor: string;
};

/**
 * Owner-side theme editor: the theme saved here is applied to every page of
 * this store's website. Includes a live mini preview of the result.
 */
export function ThemeEditor({ value, onChange }: { value: ThemeFormValue; onChange: (patch: Partial<ThemeFormValue>) => void }) {
  const preset = THEME_PRESETS.find((p) => p.id === value.preset) ?? THEME_PRESETS[0];

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-white/70 mb-2">Theme preset</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {THEME_PRESETS.map((p) => {
            const active = value.preset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange({ preset: p.id, primaryColor: p.primaryColor, accentColor: p.accentColor, radius: p.radius, font: p.font, appearance: p.appearance })}
                className={`rounded-xl border p-3 text-left transition ${active ? "border-[#e9c78d] bg-[#e9c78d]/10" : "border-white/10 bg-white/5 hover:border-white/25"}`}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="h-4 w-4 rounded-full" style={{ background: p.primaryColor }} />
                  <span className="h-4 w-4 rounded-full" style={{ background: p.accentColor }} />
                </div>
                <div className="text-xs font-bold text-white">{p.label}</div>
                <div className="text-[10px] leading-snug text-white/40 mt-0.5">{p.blurb}</div>
              </button>
            );
          })}
        </div>
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
          className="rounded-2xl border border-white/10 p-4"
          style={{ background: value.appearance === "dark" ? "#131311" : "#faf9f6", color: value.appearance === "dark" ? "#f2f0ea" : "#171715", borderRadius: value.radius === "sharp" ? 6 : value.radius === "round" ? 20 : 12, fontFamily: value.font === "serif" ? "Georgia, serif" : value.font === "display" ? "'Plus Jakarta Sans', sans-serif" : "Inter, sans-serif" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-7 w-7 flex items-center justify-center text-xs font-bold" style={{ background: value.primaryColor, color: readable(value.primaryColor), borderRadius: value.radius === "round" ? 10 : 4 }}>A</span>
              <span className="text-sm font-bold">Your store</span>
            </div>
            <span className="text-[10px] px-2 py-1 rounded-full font-bold" style={{ background: value.accentColor, color: readable(value.accentColor) }}>New</span>
          </div>
          <div className="mt-3 text-base font-bold" style={{ fontFamily: "inherit" }}>A storefront that feels like you.</div>
          <div className="mt-1 text-[11px] opacity-60">Every page keeps this theme automatically.</div>
          <div className="mt-3 flex gap-2">
            <span className="px-3 py-1.5 text-[11px] font-bold" style={{ background: value.primaryColor, color: readable(value.primaryColor), borderRadius: value.radius === "sharp" ? 3 : value.radius === "round" ? 999 : 6 }}>Shop now</span>
            <span className="px-3 py-1.5 text-[11px] font-bold" style={{ background: value.accentColor, color: readable(value.accentColor), borderRadius: value.radius === "sharp" ? 3 : value.radius === "round" ? 999 : 6 }}>Deals</span>
          </div>
        </div>
        <p className="text-[11px] text-white/35 mt-1.5">Preset: {preset.label}</p>
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
