"use client";
import { useRef, useState } from "react";
import { Upload, X, Link as LinkIcon, Loader2 } from "lucide-react";

export function ImageUploader({ value, onChange, multiple = true, folder = "products" }: { value: string[]; onChange: (v: string[]) => void; multiple?: boolean; folder?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true); setErr(null);
    const fd = new FormData();
    fd.set("folder", folder);
    Array.from(files).forEach((f) => fd.append("files", f));
    const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return setErr(j.error ?? "Upload failed");
    const urls = (j.files as { url: string }[]).map((f) => f.url);
    onChange(multiple ? [...value, ...urls] : urls.slice(0, 1));
  };
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {value.map((src, i) => (
          <div key={src + i} className="relative h-24 w-24 rounded-lg overflow-hidden border bg-gray-50 group">
            <img src={src} alt="" className="h-full w-full object-cover" />
            <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} className="absolute top-1 right-1 bg-white/90 rounded-full p-0.5 opacity-0 group-hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
            {i === 0 && multiple && <span className="absolute bottom-1 left-1 badge bg-gray-900/80 text-white">Main</span>}
          </div>
        ))}
        <button type="button" onClick={() => ref.current?.click()} disabled={busy} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files); }} className="h-24 w-24 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-900 flex flex-col items-center justify-center text-xs text-gray-500 gap-1">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}{busy ? "Uploading" : "Upload"}
        </button>
        <input ref={ref} type="file" accept="image/*" multiple={multiple} hidden onChange={(e) => upload(e.target.files)} />
      </div>
      <div className="mt-2 flex gap-2">
        <div className="relative flex-1"><LinkIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" /><input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="…or paste an image URL" className="input pl-8 py-1.5 text-xs" /></div>
        <button type="button" className="btn-outline btn-sm" disabled={!url} onClick={() => { onChange(multiple ? [...value, url] : [url]); setUrl(""); }}>Add</button>
      </div>
      {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
    </div>
  );
}
