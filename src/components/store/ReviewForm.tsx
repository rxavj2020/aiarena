"use client";
import { useActionState, useState } from "react";
import { reviewAction } from "@/actions/storefront";
import { Star } from "lucide-react";
export function ReviewForm({ productId, userName }: { productId: string; userName?: string }) {
  const [state, action, pending] = useActionState(reviewAction, undefined);
  const [rating, setRating] = useState(5);
  if (state?.ok) return <p className="text-sm text-green-700">Thanks! Your review will appear once approved.</p>;
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      <div className="flex gap-1">{[1, 2, 3, 4, 5].map((i) => <button type="button" key={i} onClick={() => setRating(i)}><Star className={`h-6 w-6 ${i <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} /></button>)}</div>
      <input name="authorName" defaultValue={userName} placeholder="Your name" required className="input" />
      <input name="title" placeholder="Title (optional)" className="input" />
      <textarea name="body" placeholder="What did you think?" required rows={4} className="input" />
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>Submit review</button>
    </form>
  );
}
