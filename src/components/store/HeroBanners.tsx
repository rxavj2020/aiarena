"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { Banner } from "@/lib/settings";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function HeroBanners({ banners }: { banners: Banner[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(id);
  }, [banners.length]);

  if (!banners.length) return null;

  return (
    <div className="relative overflow-hidden rounded-lg border border-[#e0e0e0] bg-white group">
      <div className="relative h-[180px] sm:h-[280px] lg:h-[360px] overflow-hidden">
        {banners.map((banner, i) => (
          <Link
            key={banner.id}
            href={banner.ctaLink || "/shop"}
            className={`absolute inset-0 transition-opacity duration-700 ${i === idx ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          >
            <div className="absolute inset-0" style={{ background: banner.bgColor || "#f1f2f4" }} />
            {banner.image && (
              <img
                src={banner.mobileImage || banner.image}
                alt={banner.title}
                className="absolute inset-0 h-full w-full object-cover sm:object-contain sm:object-right"
              />
            )}
            {/* Gradient for text readability on mobile */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent sm:from-white sm:via-white/60 sm:to-transparent lg:via-white/40" />
            <div className="absolute inset-0 flex items-center">
              <div className="p-5 sm:p-8 lg:p-12 max-w-[70%] sm:max-w-[50%]">
                <h2 className="font-bold text-lg sm:text-2xl lg:text-4xl leading-tight text-[#212121]">{banner.title}</h2>
                {banner.subtitle && <p className="mt-1.5 sm:mt-3 text-xs sm:text-sm text-[#878787] leading-snug line-clamp-2">{banner.subtitle}</p>}
                {banner.ctaText && (
                  <span className="mt-3 sm:mt-5 hidden sm:inline-flex items-center gap-2 bg-[#fb641b] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-[#e55a17]">
                    {banner.ctaText} →
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}

        {/* Controls */}
        {banners.length > 1 && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); setIdx((i) => (i - 1 + banners.length) % banners.length); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-white shadow-md border border-[#e0e0e0] flex items-center justify-center hover:bg-[#f1f2f4] opacity-0 group-hover:opacity-100 transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); setIdx((i) => (i + 1) % banners.length); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-white shadow-md border border-[#e0e0e0] flex items-center justify-center hover:bg-[#f1f2f4] opacity-0 group-hover:opacity-100 transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-[#2874f0]" : "w-1.5 bg-white/70 border border-[#e0e0e0]"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
