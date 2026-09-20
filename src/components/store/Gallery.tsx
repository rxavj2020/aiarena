"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Expand, X, ZoomIn } from "lucide-react";

export function Gallery({ images, name, variantImage }: { images: string[]; name: string; variantImage?: string | null }) {
  // Combine variant image first if exists
  const allImages = variantImage ? [variantImage, ...images.filter((img) => img !== variantImage)] : images;
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [lightbox, setLightbox] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  // Reset active when variant changes
  useEffect(() => {
    if (variantImage) setActive(0);
  }, [variantImage]);

  // Ensure active index valid
  useEffect(() => {
    if (active >= allImages.length) setActive(0);
  }, [allImages.length, active]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mainRef.current) return;
    const rect = mainRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const next = useCallback(() => setActive((a) => (a + 1) % allImages.length), [allImages.length]);
  const prev = useCallback(() => setActive((a) => (a - 1 + allImages.length) % allImages.length), [allImages.length]);

  // Keyboard navigation in lightbox
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, next, prev]);

  if (!allImages.length) return <div className="aspect-square rounded-xl bg-[#f1f2f4] border border-[#e0e0e0]" />;

  return (
    <>
      <div className="flex flex-col-reverse lg:flex-row gap-3">
        {/* Thumbnails - desktop vertical, mobile horizontal */}
        {allImages.length > 1 && (
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[520px] no-scrollbar lg:w-[80px] shrink-0 p-1">
            {allImages.map((src, k) => (
              <button
                key={k}
                onClick={() => setActive(k)}
                className={`relative aspect-square w-16 h-16 lg:w-[72px] lg:h-[72px] shrink-0 overflow-hidden rounded-xl border-2 transition-all bg-white ${
                  k === active ? "border-[#2874f0] shadow-sm ring-2 ring-[#2874f0]/20" : "border-[#e0e0e0] hover:border-[#212121]"
                }`}
              >
                <img src={src} alt={`${name} ${k + 1}`} className="h-full w-full object-cover" loading="lazy" />
                {variantImage && k === 0 && <span className="absolute bottom-0 left-0 right-0 bg-[#2874f0] text-white text-[8px] font-bold text-center py-0.5">Variant</span>}
              </button>
            ))}
          </div>
        )}

        {/* Main image */}
        <div className="flex-1 min-w-0">
          <div
            ref={mainRef}
            onMouseEnter={() => setZoom(true)}
            onMouseLeave={() => setZoom(false)}
            onMouseMove={handleMouseMove}
            className="relative aspect-square overflow-hidden rounded-xl bg-white border border-[#e0e0e0] group cursor-zoom-in"
            onClick={() => setLightbox(true)}
          >
            <img src={allImages[active]} alt={name} className="h-full w-full object-contain p-2 sm:p-4" />

            {/* Zoom lens desktop */}
            {zoom && (
              <div
                className="absolute inset-0 hidden lg:block pointer-events-none z-10"
                style={{
                  backgroundImage: `url(${allImages[active]})`,
                  backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                  backgroundSize: "200%",
                  backgroundRepeat: "no-repeat",
                  opacity: 0.98,
                  backgroundColor: "white",
                }}
              />
            )}

            {/* Nav arrows */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white shadow-md border border-[#e0e0e0] flex items-center justify-center hover:bg-[#f1f2f4] transition z-20"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white shadow-md border border-[#e0e0e0] flex items-center justify-center hover:bg-[#f1f2f4] transition z-20"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}

            {/* Expand button */}
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox(true); }}
              className="absolute right-2 sm:right-3 bottom-2 sm:bottom-3 h-8 w-8 rounded-full bg-white shadow-md border border-[#e0e0e0] flex items-center justify-center hover:bg-[#f1f2f4] transition z-20"
            >
              <Expand className="h-4 w-4" />
            </button>

            {/* Dots mobile */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 lg:hidden z-20 bg-black/20 backdrop-blur px-2 py-1 rounded-full">
              {allImages.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-white" : "w-1.5 bg-white/60"}`} />
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-[#878787]">
            <span className="font-medium bg-[#f1f2f4] px-2 py-1 rounded-full">
              {active + 1} / {allImages.length}
            </span>
            <span className="hidden sm:flex items-center gap-1"><ZoomIn className="h-3 w-3" /> Click to view full-screen</span>
            <span className="sm:hidden">Tap to expand</span>
          </div>
        </div>
      </div>

      {/* Full-screen Lightbox - Fixed */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 text-white border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold">{active + 1}</span>
              </div>
              <span className="text-sm font-medium truncate">{name}</span>
              <span className="text-xs text-white/60 hidden sm:inline">{active + 1} of {allImages.length}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setLightboxZoom(!lightboxZoom)} className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
                <ZoomIn className="h-5 w-5" />
              </button>
              <button onClick={() => setLightbox(false)} className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Main image area */}
          <div className="flex-1 relative flex items-center justify-center p-2 sm:p-8 overflow-hidden">
            <img
              src={allImages[active]}
              alt={name}
              className={`max-h-full max-w-full object-contain transition-transform duration-300 ${lightboxZoom ? "scale-[1.8] cursor-zoom-out" : "cursor-zoom-in"}`}
              onClick={() => setLightboxZoom(!lightboxZoom)}
            />

            {/* Navigation */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/10 backdrop-blur hover:bg-white/20 text-white flex items-center justify-center transition"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/10 backdrop-blur hover:bg-white/20 text-white flex items-center justify-center transition"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          <div className="shrink-0 p-3 sm:p-4 bg-black/50 backdrop-blur border-t border-white/10">
            <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
              {allImages.map((src, i) => (
                <button key={i} onClick={() => setActive(i)} className={`relative h-14 w-14 sm:h-20 sm:w-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${i === active ? "border-white scale-105" : "border-white/20 opacity-60 hover:opacity-100"}`}>
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            <div className="text-center text-[11px] text-white/50 mt-3 hidden sm:block">Use arrow keys to navigate · ESC to close · Click image to zoom</div>
          </div>
        </div>
      )}
    </>
  );
}
