"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, Check, LockKeyhole, Store } from "lucide-react";
import { registerOwnerAction } from "@/actions/auth";

export default function PlatformSignup() {
  const [state, action, pending] = useActionState(registerOwnerAction, undefined);
  return (
    <div className="min-h-screen bg-[#11110f] px-4 py-8 text-white sm:flex sm:items-center sm:justify-center">
      <div className="grid w-full max-w-[1000px] overflow-hidden rounded-[28px] border border-white/10 bg-[#191916] shadow-2xl sm:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col justify-between bg-[#e9c78d] p-8 text-[#11110f] sm:p-10">
          <div><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#11110f] text-[#e9c78d]"><Store className="h-5 w-5" /></div><div className="mt-6 text-xs font-bold uppercase tracking-[0.24em]">Aurelia Studio</div></div>
          <div className="py-10 sm:py-0"><h1 className="font-display text-4xl font-bold leading-[1.03] tracking-tight">Your brand.<br />Your data.<br />Your store.</h1><p className="mt-5 max-w-sm text-sm leading-6 text-[#11110f]/65">A fast, safe foundation for founders who want to sell online without stitching five tools together.</p></div>
          <div className="space-y-2 text-xs font-semibold text-[#11110f]/60"><div className="flex items-center gap-2"><Check className="h-3.5 w-3.5" /> Real Firestore data</div><div className="flex items-center gap-2"><Check className="h-3.5 w-3.5" /> Admin and public layers</div></div>
        </div>
        <div className="p-7 sm:p-10"><div className="mb-7"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-[#e9c78d]"><LockKeyhole className="h-5 w-5" /></div><h1 className="font-display text-2xl font-bold">Create your Studio account</h1><p className="mt-1 text-sm text-white/50">Then we’ll guide you through your first workspace.</p></div><form action={action} className="space-y-4"><div><label className="mb-1.5 block text-xs font-semibold text-white/70">Your name</label><input name="name" required minLength={2} autoComplete="name" className="dark-field" placeholder="Priya Sharma" /></div><div><label className="mb-1.5 block text-xs font-semibold text-white/70">Work email</label><input name="email" type="email" required autoComplete="email" className="dark-field" placeholder="you@brand.com" /></div><div><label className="mb-1.5 block text-xs font-semibold text-white/70">Password</label><input name="password" type="password" required minLength={8} autoComplete="new-password" className="dark-field" placeholder="At least 8 characters" /></div>{state?.error ? <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2.5 text-sm text-red-200">{state.error}</p> : null}<button disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e9c78d] px-4 py-3 text-sm font-bold text-[#11110f] transition hover:bg-[#f2d8a7] disabled:opacity-60">{pending ? "Creating account…" : "Continue to workspace setup"}<ArrowRight className="h-4 w-4" /></button></form><div className="mt-6 border-t border-white/10 pt-5 text-center text-xs text-white/45">Already have an account? <Link href="/platform/login" className="font-semibold text-[#e9c78d] hover:underline">Sign in</Link></div></div>
      </div>
    </div>
  );
}
