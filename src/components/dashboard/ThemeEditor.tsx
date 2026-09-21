"use client";

import { THEME_PRESETS, ROLE_LABELS, ROLE_ORDER, type Appearance, type ThemeFont, type ThemePresetId, type ThemeRadius, readableInk } from "@/lib/themes";

export type ThemeFormValue = {
  preset: ThemePresetId;
  appearance: Appearance;
  frameColor: string;
  groundColor: string;
  actionColor: string;
  radius: ThemeRadius;
  font: ThemeFont;
};

/**
 * Owner-side "Role Trio" editor: three colour codes, each owning groups of
 * components — Colour 1 header & frame, Colour 2 footer & sections, Colour 3
 * buttons & links. The preview shows the exact component mapping.
 */
export function ThemeEditor({ value, onChange }: { value: ThemeFormValue; onChange: (patch: Partial<ThemeFormValue>) => void }) {
  const preset = THEME_PRESETS.find((p) => p.id === value.preset) ?? THEME_PRESETS[0];
  const roleColors: Record<string, string> = { frame: value.frameColor, ground: value.groundColor, action: value.actionColor };
  const radius = value.radius === "sharp" ? 3 : value.radius === "round" ? 999 : 8;

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-white/70 mb-2">Your three colours</label>
        <div className="space-y-2">
          {ROLE_ORDER.map((role) => {
            const meta = ROLE_LABELS[role];
            const hex = roleColors[role];
            return (
              <div key={role} className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center gap-3">
                <input type="color" value={hex} onChange={(e) => onChange({ [`${role}Color`]: e.target.value } as Partial<ThemeFormValue>)} className="h-10 w-14 rounded border-0 bg-transparent cursor-pointer shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white">{meta.swatch} · {meta.title}</div>
                  <div className="text-[10px] text-white/40">{meta.usedBy}</div>
                </div>
                <input type="text" value={hex} onChange={(e) => onChange({ [`${role}Color`]: e.target.value } as Partial<ThemeFormValue>)} className="w-24 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-xs font-mono text-white outline-none" />
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-white/35 mt-1.5">Any three hex codes work — body, cards and text tones are derived automatically to keep the site harmonious.</p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-white/70 mb-2">Theme preset</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {THEME_PRESETS.map((p) => {
            const active = value.preset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() =>
                  onChange({
                    preset: p.id,
                    frameColor: p.frameColor,
                    groundColor: p.groundColor,
                    actionColor: p.actionColor,
                    radius: p.radius,
                    font: p.font,
                    appearance: p.appearance,
                  })
                }
                className={`rounded-xl border p-2.5 text-left transition ${active ? "border-[#e9c78d] bg-[#e9c78d]/10" : "border-white/10 bg-white/5 hover:border-white/25"}`}
              >
                <div className="flex items-center gap-1 mb-1.5">
                  {[p.frameColor, p.groundColor, p.actionColor].map((c, i) => (
                    <span key={i} className="h-3.5 w-3.5 rounded-full" style={{ background: c }} title={ROLE_LABELS[ROLE_ORDER[i]].title} />
                  ))}
                </div>
                <div className="text-[11px] font-bold text-white">{p.label}</div>
                <div className="text-[9.5px] leading-snug text-white/35 mt-0.5 line-clamp-2">{p.blurb}</div>
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

      {/* Live preview — the component → colour mapping, exactly like the site */}
      <div>
        <label className="block text-xs font-semibold text-white/70 mb-1.5">Preview (header · footer · buttons)</label>
        <div
          className="rounded-2xl border border-white/10 overflow-hidden"
          style={{ background: `color-mix(in srgb, ${value.groundColor} 6%, #ffffff)`, color: `color-mix(in srgb, ${value.groundColor} 28%, #12110f)`, fontFamily: value.font === "serif" ? "Georgia, serif" : value.font === "display" ? "'Plus Jakarta Sans', sans-serif" : "Inter, sans-serif" }}
        >
          {/* Header mock — Colour 1 */}
          <div className="flex items-center justify-between px-4 py-3" style={{ background: value.frameColor, color: readableInk(value.frameColor) }}>
            <div className="flex items-center gap-2">
              <span className="h-7 w-7 flex items-center justify-center text-xs font-bold" style={{ background: value.actionColor, color: readableInk(value.actionColor), borderRadius: radius }}>A</span>
              <span className="text-sm font-bold">Your store</span>
            </div>
            <span className="px-3 py-1.5 text-[10px] font-bold rounded-full" style={{ background: value.actionColor, color: readableInk(value.actionColor) }}>Cart</span>
          </div>
          {/* Palette stripe — the three roles in order */}
          <div className="h-1 flex">
            {[value.frameColor, value.groundColor, value.actionColor].map((c, i) => (
              <span key={i} className="flex-1" style={{ background: c }} />
            ))}
          </div>
          {/* Body mock — derived cream + heading in Colour 2 */}
          <div className="p-4">
            <div className="text-base font-bold" style={{ color: value.groundColor }}>A storefront that feels like you.</div>
            <div className="mt-1 text-[11px] opacity-60">Headings & footer wear Colour 2 — buttons & links wear Colour 3.</div>
            <div className="mt-3 flex gap-2">
              <span className="px-3 py-1.5 text-[11px] font-bold" style={{ background: value.actionColor, color: readableInk(value.actionColor), borderRadius: radius }}>Shop now</span>
              <span className="px-3 py-1.5 text-[11px] font-bold" style={{ background: value.frameColor, color: readableInk(value.frameColor), borderRadius: radius }}>Call us</span>
              <span className="px-3 py-1.5 text-[11px] font-bold underline" style={{ color: value.actionColor }}>View all</span>
            </div>
          </div>
          {/* Footer mock — Colour 2 */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ background: value.groundColor, color: readableInk(value.groundColor) }}>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: value.actionColor }}>Support</span>
            <span className="text-[10px] opacity-70">© Your store</span>
          </div>
        </div>
        <p className="text-[11px] text-white/35 mt-1.5">{preset.label} · header = Colour 1 · footer & headings = Colour 2 · buttons = Colour 3</p>
      </div>
    </div>
  );
}
