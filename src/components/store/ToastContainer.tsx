"use client";

import { useStore } from "@/lib/store/useStore";
import { CheckCircle2, Info, AlertCircle, X } from "lucide-react";

export function ToastContainer() {
  const { toasts, removeToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 bg-gray-900/95 backdrop-blur text-white text-sm rounded-xl shadow-2xl border border-white/10 fade-up"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {toast.type === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
            {toast.type === "info" && <Info className="h-4 w-4 text-sky-400 shrink-0" />}
            {toast.type === "error" && <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />}
            <span className="truncate">{toast.message}</span>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-white/60 hover:text-white p-1 rounded-md transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
