"use client";
import { createContext, useCallback, useContext, useState } from "react";
type T = { id: number; text: string; kind: "ok" | "err" };
const Ctx = createContext<(text: string, kind?: "ok" | "err") => void>(() => {});
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<T[]>([]);
  const push = useCallback((text: string, kind: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setList((l) => [...l, { id, text, kind }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 3500);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] space-y-2">
        {list.map((t) => <div key={t.id} className={`fade-up rounded-lg px-4 py-2.5 text-sm text-white shadow-lg ${t.kind === "ok" ? "bg-gray-900" : "bg-red-600"}`}>{t.text}</div>)}
      </div>
    </Ctx.Provider>
  );
}
export const useToast = () => useContext(Ctx);
export function notify(push: (t: string, k?: "ok" | "err") => void, r: { ok: boolean; message?: string; error?: string }) {
  if (r.ok) push(r.message ?? "Done");
  else push(r.error ?? "Something went wrong", "err");
}
