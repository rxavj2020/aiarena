"use client";
import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { Category } from "@/lib/db/schema";

export function MobileNav({ nav, categories, children }: { nav: { label: string; href: string }[]; categories: Category[]; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="md:hidden btn-ghost p-2" onClick={() => setOpen(true)} aria-label="Menu">
        {children}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white p-5 shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <span className="font-semibold">Menu</span>
              <button onClick={() => setOpen(false)} className="btn-ghost p-1"><X className="h-5 w-5" /></button>
            </div>
            <nav className="flex flex-col gap-1">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 font-medium hover:bg-gray-100">{n.label}</Link>
              ))}
            </nav>
            <div className="mt-6 text-xs font-semibold uppercase tracking-wide text-gray-500 px-3">Categories</div>
            <nav className="mt-2 flex flex-col gap-1">
              {categories.filter((c) => !c.parentId).map((c) => (
                <Link key={c.id} href={`/shop?category=${c.slug}`} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">{c.name}</Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
