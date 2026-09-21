"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, LockKeyhole, Store } from "lucide-react";
import { loginAction } from "@/actions/auth";

export default function PlatformLogin() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  return (
    <div className="min-h-screen bg-[#11110f] px-4 py-8 text-white sm:flex sm:items-center sm:justify-center">
      <div className="grid w-full max-w-[960px] overflow-hidden rounded-[28px] border border-white/10 bg-[#191916] shadow-2xl sm:grid-cols-2">
        <div className="hidden flex-col justify-between bg-[#e9c78d] p-10 text-[#11110f] sm:flex">
          <div><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#11110f] text-[#e9c78d]"><Store className="h-5 w-5" /></div><div className="mt-6 text-xs font-bold uppercase tracking-[0.24em]">Aurelia Studio</div></div>
          <div><h1 className="font-display text-4xl font-bold leading-[1.03] tracking-tight">Build the store your brand deserves.</h1><p className="mt-5 max-w-sm text-sm leading-6 text-[#11110f]/70">One secure store control panel for your catalogue, customers, domains and the public site your customers see.</p></div>
          <div className="text-xs font-semibold text-[#11110f]/55">Fast to launch · Firestore ready · Built for India</div>
        </div>
        <div className="p-7 sm:p-10">
          <div className="mb-8 sm:hidden"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9c78d] text-[#11110f]"><Store className="h-4 w-4" /></div><div className="mt-3 text-xs font-bold uppercase tracking-[0.24em] text-[#e9c78d]">Aurelia Studio</div></div>
          <div className="mb-7"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-[#e9c78d]"><LockKeyhole className="h-5 w-5" /></div><h1 className="font-display text-2xl font-bold">Welcome back</h1><p className="mt-1 text-sm text-white/50">Sign in to open your store dashboard.</p></div>
          <form action={action} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <div><label className="mb-1.5 block text-xs font-semibold text-white/70">Email</label><input name="email" type="email" required autoComplete="email" className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#e9c78d]" placeholder="you@brand.com" /></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-white/70">Password</label><input name="password" type="password" required autoComplete="current-password" className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#e9c78d]" placeholder="Your password" /></div>
            {state?.error ? <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2.5 text-sm text-red-200">{state.error}</p> : null}
            <button disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e9c78d] px-4 py-3 text-sm font-bold text-[#11110f] transition hover:bg-[#f2d8a7] disabled:opacity-60">{pending ? "Signing in…" : "Continue to Dashboard"}<ArrowRight className="h-4 w-4" /></button>
          </form>
          <div className="mt-6 border-t border-white/10 pt-5 text-center text-xs text-white/45">New to Aurelia Studio? <Link href="/platform/signup" className="font-semibold text-[#e9c78d] hover:underline">Create your store <ArrowRight className="inline h-3 w-3" /></Link></div>
        </div>
      </div>
    </div>
  );
}
