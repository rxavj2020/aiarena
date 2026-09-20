"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Review } from "@/lib/db/schema";
import { setReviewApproval, deleteReview } from "@/actions/admin";
import { useToast, notify } from "@/components/ui/Toast";
import { Star, Check, EyeOff, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/format";
export function ReviewRow({ review: r, product, slug }: { review: Review; product: string; slug: string }) {
  const [pending, start] = useTransition(); const toast = useToast(); const router = useRouter();
  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) => start(async () => { notify(toast, await fn()); router.refresh(); });
  return (
    <div className={`p-4 flex gap-4 ${pending ? "opacity-50" : ""}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm"><span className="flex">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`h-3.5 w-3.5 ${i <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />)}</span><span className="font-medium">{r.authorName}</span><span className="text-gray-400 text-xs">on <a href={`/products/${slug}`} target="_blank" className="underline">{product}</a> · {formatDate(r.createdAt)}</span>{!r.approved && <span className="badge bg-amber-100 text-amber-800">pending</span>}</div>
        {r.title && <div className="font-medium text-sm mt-1">{r.title}</div>}
        <p className="text-sm text-gray-700 mt-1">{r.body}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        {r.approved ? <button onClick={() => run(() => setReviewApproval(r.id, false))} className="btn-outline btn-sm"><EyeOff className="h-3.5 w-3.5" /> Hide</button> : <button onClick={() => run(() => setReviewApproval(r.id, true))} className="btn-primary btn-sm"><Check className="h-3.5 w-3.5" /> Approve</button>}
        <button onClick={() => confirm("Delete review?") && run(() => deleteReview(r.id))} className="btn-ghost btn-sm text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}
