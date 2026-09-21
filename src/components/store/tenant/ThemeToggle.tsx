"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { APPEARANCE_COOKIE, appearanceCookiePath, type Appearance } from "@/lib/themes";

const ORDER: Appearance[] = ["light", "dark", "system"];

function resolve(mode: Appearance): "light" | "dark" {
  if (mode !== "system") return mode;
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Visitor-chosen appearance for one website. The choice is written to a cookie
 * scoped to this site's path (`/store/{slug}`) so it persists across every page
 * of the website and never touches other websites or the platform.
 */
export function ThemeToggle({ basePath, initial }: { basePath: string; initial: Appearance }) {
  const [mode, setMode] = useState<Appearance>(initial);

  useEffect(() => {
    // Keep the DOM in sync when the OS theme changes while in "system" mode.
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onChange = () => {
      const root = document.querySelector(".tenant-site");
      if (root?.getAttribute("data-appearance-choice") === "system") {
        root.setAttribute("data-appearance", resolve("system"));
      }
    };
    mq?.addEventListener?.("change", onChange);
    return () => mq?.removeEventListener?.("change", onChange);
  }, []);

  const apply = (next: Appearance) => {
    setMode(next);
    const root = document.querySelector(".tenant-site");
    if (root) {
      root.setAttribute("data-appearance-choice", next);
      root.setAttribute("data-appearance", resolve(next));
    }
    document.cookie = `${APPEARANCE_COOKIE}=${next}; path=${appearanceCookiePath(basePath)}; max-age=31536000; samesite=lax`;
  };

  const Icon = mode === "dark" ? Moon : mode === "light" ? Sun : Monitor;
  const label = mode === "dark" ? "Dark" : mode === "light" ? "Light" : "System";

  return (
    <button
      type="button"
      onClick={() => apply(ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length])}
      className="s-icon-btn"
      title={`Appearance: ${label} (click to switch)`}
      aria-label={`Appearance: ${label}. Click to switch theme.`}
    >
      <Icon className="h-[18px] w-[18px]" />
    </button>
  );
}
