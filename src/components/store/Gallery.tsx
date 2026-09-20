"use client";
import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

export function Gallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [lightbox, setLightbox] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  if (!images.length) return <div className="aspect-square rounded-2xl bg-gray-100" />;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mainRef.current) return;
    const rect = mainRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <>
      <div className="flex flex-col-reverse lg:flex-row gap-3">
        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[520px] no-scrollbar lg:w-[80px] shrink-0">
            {images.map((src, k) => (
              <button
                key={k}
                onClick={() => setActive(k)}
                className={`relative aspect-square w-16 h-16 lg:w-[72px] lg:h-[72px] shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                  k === active ? "border-gray-900 shadow-sm" : "border-gray-100 hover:border-gray-300 bg-white"
                }`}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
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
            className="relative aspect-square overflow-hidden rounded-2xl bg-[#f8f9fb] border border-gray-100 group"
          >
            <img src={images[active]} alt={name} className="h-full w-full object-contain p-2 sm:p-4" />

            {/* Zoom lens */}
            {zoom && (
              <div
                className="absolute inset-0 hidden lg:block pointer-events-none"
                style={{
                  backgroundImage: `url(${images[active]})`,
                  backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                  backgroundSize: "200%",
                  backgroundRepeat: "no-repeat",
                  opacity: 0.98,
                }}
              />
            )}

            {/* Nav arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActive((a) => (a - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 backdrop-blur shadow-md border border-gray-100 flex items-center justify-center hover:bg-white transition opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setActive((a) => (a + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 backdrop-blur shadow-md border border-gray-100 flex items-center justify-center hover:bg-white transition opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}

            {/* Expand */}
            <button
              onClick={() => setLightbox(true)}
              className="absolute right-3 bottom-3 h-8 w-8 rounded-full bg-white/90 backdrop-blur shadow-md border border-gray-100 flex items-center justify-center hover:bg-white transition"
            >
              <Expand className="h-4 w-4" />
            </button>

            {/* Dots mobile */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 lg:hidden">
              {images.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-gray-900" : "w-1.5 bg-gray-300"}`} />
              ))}
            </div>
          </div>

          {/* Image count + share */}
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <span className="font-medium">
              {active + 1} / {images.length}
            </span>
            <span className="hidden sm:inline">Hover to zoom · Click to expand</span>
            <span className="sm:hidden">Swipe to view</span>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-sm font-medium">{name}</span>
            <button onClick={() => setLightbox(false)} className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <img src={images[active]} alt={name} className="max-h-full max-w-full object-contain" />
          </div>
          <div className="p-4 flex items-center justify-center gap-2 overflow-x-auto">
            {images.map((src, i) => (
              <button key={i} onClick={() => setActive(i)} className={`h-16 w-16 rounded-xl overflow-hidden border-2 shrink-0 ${i === active ? "border-white" : "border-white/20"}`}>
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
