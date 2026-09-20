"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Expand, X, ZoomIn, ZoomOut } from "lucide-react";

export function Gallery({ images, name, variantImage }: { images: string[]; name: string; variantImage?: string | null }) {
  const allImages = variantImage ? [variantImage, ...images.filter((img) => img !== variantImage)] : images;
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [lightbox, setLightbox] = useState(false);

  // Lightbox zoom & pan states
  const [lbScale, setLbScale] = useState(1);
  const [lbPan, setLbPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [pinchStart, setPinchStart] = useState<{ dist: number; scale: number } | null>(null);

  const mainRef = useRef<HTMLDivElement>(null);
  const lbImgRef = useRef<HTMLImageElement>(null);
  const lbContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (variantImage) setActive(0);
  }, [variantImage]);

  useEffect(() => {
    if (active >= allImages.length) setActive(0);
    // reset zoom/pan on image change
    setLbScale(1);
    setLbPan({ x: 0, y: 0 });
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

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    // prevent body scroll
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, next, prev]);

  // Lightbox drag handlers
  const handleLbMouseDown = (e: React.MouseEvent) => {
    if (lbScale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - lbPan.x, y: e.clientY - lbPan.y });
  };
  const handleLbMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || lbScale <= 1) return;
    setLbPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleLbMouseUp = () => setIsDragging(false);

  // Touch handlers for pinch & drag
  const getTouchDist = (t1: React.Touch, t2: React.Touch) => Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = getTouchDist(e.touches[0], e.touches[1]);
      setPinchStart({ dist, scale: lbScale });
    } else if (e.touches.length === 1 && lbScale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - lbPan.x, y: e.touches[0].clientY - lbPan.y });
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStart) {
      e.preventDefault();
      const dist = getTouchDist(e.touches[0], e.touches[1]);
      const newScale = Math.min(4, Math.max(1, pinchStart.scale * (dist / pinchStart.dist)));
      setLbScale(newScale);
      if (newScale <= 1.05) setLbPan({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && isDragging && lbScale > 1) {
      e.preventDefault();
      setLbPan({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
    }
  };
  const handleTouchEnd = () => {
    setIsDragging(false);
    setPinchStart(null);
    if (lbScale <= 1.05) {
      setLbScale(1);
      setLbPan({ x: 0, y: 0 });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!lightbox) return;
    e.preventDefault();
    const delta = -e.deltaY;
    const newScale = Math.min(4, Math.max(1, lbScale + delta * 0.001));
    setLbScale(newScale);
    if (newScale <= 1.05) setLbPan({ x: 0, y: 0 });
  };

  const toggleZoom = () => {
    if (lbScale > 1) {
      setLbScale(1);
      setLbPan({ x: 0, y: 0 });
    } else {
      setLbScale(2.5);
    }
  };

  if (!allImages.length) return <div className="aspect-square rounded-xl bg-[#f1f2f4] border border-[#e0e0e0]" />;

  /**
   * Full-screen lightbox.
   *
   * IMPORTANT: this is rendered through a React portal into <body>, NOT inline.
   * The gallery lives inside a `lg:sticky` wrapper on the product page, and
   * `position: sticky` creates its own stacking context. Rendered inline, the
   * lightbox's z-index would be trapped inside that context, so the *other*
   * sticky cards on the page (variant/price buy box, "Need help?", review form),
   * the sticky header and the fixed WhatsApp / buy-bar buttons all painted on
   * top of the full-screen zoom. Portaling to <body> puts the overlay in the
   * root stacking context so it truly covers the whole page.
   */
  const lightboxNode = lightbox ? (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col select-none isolate" role="dialog" aria-modal="true" aria-label={`${name} full-screen gallery`}>
      {/* Header - fixed height, no overlap */}
      <div className="flex items-center justify-between p-3 sm:p-4 text-white bg-black border-b border-white/10 shrink-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold">{active + 1}</span>
          </div>
          <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-[400px]">{name}</span>
          <span className="text-xs text-white/60 hidden sm:inline">{active + 1} of {allImages.length}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={toggleZoom} className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition" title={lbScale > 1 ? "Zoom out" : "Zoom in"}>
            {lbScale > 1 ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
          </button>
          <button onClick={() => setLightbox(false)} className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition" aria-label="Close full-screen view">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main image area - isolated, no overlapping with header/footer */}
      <div
        ref={lbContainerRef}
        className="flex-1 relative flex items-center justify-center overflow-hidden bg-black touch-none"
        onMouseDown={handleLbMouseDown}
        onMouseMove={handleLbMouseMove}
        onMouseUp={handleLbMouseUp}
        onMouseLeave={handleLbMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        style={{ cursor: lbScale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in" }}
      >
        <img
          ref={lbImgRef}
          src={allImages[active]}
          alt={name}
          className="max-h-full max-w-full object-contain select-none will-change-transform"
          style={{
            transform: `translate(${lbPan.x}px, ${lbPan.y}px) scale(${lbScale})`,
            transition: isDragging || pinchStart ? "none" : "transform 0.2s ease-out",
          }}
          onDoubleClick={toggleZoom}
          draggable={false}
        />

        {/* Navigation - above image, not overlapping content */}
        {allImages.length > 1 && lbScale === 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/10 backdrop-blur hover:bg-white/20 text-white flex items-center justify-center transition z-20"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/10 backdrop-blur hover:bg-white/20 text-white flex items-center justify-center transition z-20"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Zoom indicator */}
        {lbScale > 1 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur text-white text-xs px-3 py-1 rounded-full border border-white/10 z-20">
            {Math.round(lbScale * 100)}% • Drag to pan • Pinch to zoom
          </div>
        )}
      </div>

      {/* Thumbnails - fixed, not overlapping */}
      <div className="shrink-0 bg-black border-t border-white/10 z-30">
        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
            {allImages.map((src, i) => (
              <button
                key={i}
                onClick={() => { setActive(i); setLbScale(1); setLbPan({ x: 0, y: 0 }); }}
                className={`relative h-14 w-14 sm:h-16 sm:w-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${i === active ? "border-white scale-105" : "border-white/20 opacity-60 hover:opacity-100"}`}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
        <div className="text-center text-[11px] text-white/50 pb-3 hidden sm:block">
          Use arrow keys • ESC to close • Scroll to zoom • Drag to pan • Double-click to zoom • Pinch on mobile
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="flex flex-col-reverse lg:flex-row gap-3">
        {/* Thumbnails */}
        {allImages.length > 1 && (
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[520px] no-scrollbar lg:w-[80px] shrink-0 p-1">
            {allImages.map((src, k) => (
              <button
                key={k}
                onClick={() => setActive(k)}
                className={`relative aspect-square w-14 h-14 sm:w-16 sm:h-16 lg:w-[72px] lg:h-[72px] shrink-0 overflow-hidden rounded-lg sm:rounded-xl border-2 transition-all bg-white ${
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
            className="relative aspect-square overflow-hidden rounded-lg sm:rounded-xl bg-white border border-[#e0e0e0] group cursor-zoom-in touch-manipulation"
            onClick={() => setLightbox(true)}
          >
            <img src={allImages[active]} alt={name} className="h-full w-full object-contain p-2 sm:p-4 select-none" draggable={false} />

            {/* Desktop hover zoom lens */}
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

            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white/90 backdrop-blur shadow-md border border-[#e0e0e0] flex items-center justify-center hover:bg-white transition z-20"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white/90 backdrop-blur shadow-md border border-[#e0e0e0] flex items-center justify-center hover:bg-white transition z-20"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); setLightbox(true); }}
              className="absolute right-2 sm:right-3 top-2 sm:top-3 h-8 w-8 rounded-full bg-white/90 backdrop-blur shadow-md border border-[#e0e0e0] flex items-center justify-center hover:bg-white transition z-20"
              aria-label="View full-screen"
            >
              <Expand className="h-4 w-4" />
            </button>

            {allImages.length > 1 && (
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                {allImages.map((_, i) => (
                  <span key={i} className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-white" : "w-1.5 bg-white/60"}`} />
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 text-xs text-[#878787]">
            <span className="font-medium bg-[#f1f2f4] px-2.5 py-1 rounded-full border border-[#e0e0e0] shrink-0">
              {active + 1} / {allImages.length}
            </span>
            <button onClick={() => setLightbox(true)} className="flex items-center gap-1.5 hover:text-[#212121] transition font-medium truncate">
              <ZoomIn className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Click to view full-screen</span>
              <span className="sm:hidden">Tap to view full-screen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Full-screen lightbox — portaled to <body> so it escapes the sticky
          gallery wrapper's stacking context and covers the variant/price
          buy box, "Need help?" card, header and floating buttons. */}
      {lightboxNode && typeof document !== "undefined" ? createPortal(lightboxNode, document.body) : null}
    </>
  );
}
