"use client";
import { useActionState } from "react";
import { contactAction } from "@/actions/storefront";
export function ContactForm() {
  const [state, action, pending] = useActionState(contactAction, undefined);
  if (state?.ok) return <p className="text-green-700">Thanks! We&apos;ve received your message.</p>;
  return (
    <form action={action} className="space-y-3">
      <div><label className="label">Name</label><input name="name" required className="input" /></div>
      <div><label className="label">Email</label><input name="email" type="email" required className="input" /></div>
      <div><label className="label">Message</label><textarea name="message" rows={5} required className="input" /></div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button className="btn-primary" disabled={pending}>Send message</button>
    </form>
  );
}
