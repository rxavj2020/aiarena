"use client";
import { useState } from "react";
export function Gallery({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0);
  if (!images.length) return <div className="aspect-square rounded-xl bg-gray-100" />;
  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-xl bg-gray-100"><img src={images[i]} alt={name} className="h-full w-full object-cover" /></div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((src, k) => (
            <button key={k} onClick={() => setI(k)} className={`aspect-square overflow-hidden rounded-lg border-2 ${k === i ? "border-gray-900" : "border-transparent"}`}><img src={src} alt="" className="h-full w-full object-cover" /></button>
          ))}
        </div>
      )}
    </div>
  );
}
