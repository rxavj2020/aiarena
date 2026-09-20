"use client";
import { useActionState } from "react";
import { subscribeAction } from "@/actions/storefront";

export function Newsletter() {
  const [state, action, pending] = useActionState(subscribeAction, undefined);
  if (state?.ok) return <p className="text-sm text-green-700">Thanks — you&apos;re subscribed!</p>;
  return (
    <form action={action} className="flex gap-2">
      <input name="email" type="email" required placeholder="you@example.com" className="input" />
      <button className="btn-primary shrink-0" disabled={pending}>Join</button>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
