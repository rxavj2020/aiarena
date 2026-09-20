"use client";
import { useActionState } from "react";
import Link from "next/link";
import { loginAction, registerAction } from "@/actions/auth";

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const [state, action, pending] = useActionState(mode === "login" ? loginAction : registerAction, undefined);
  return (
    <div className="container-x py-16 max-w-md">
      <h1 className="font-display text-3xl font-semibold">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
      <p className="text-gray-600 mt-1 text-sm">{mode === "login" ? "Log in to track orders and check out faster." : "Save addresses, track orders and more."}</p>
      <form action={action} className="card p-6 mt-6 space-y-4">
        {next && <input type="hidden" name="next" value={next} />}
        {mode === "register" && <div><label className="label">Full name</label><input name="name" required className="input" /></div>}
        <div><label className="label">Email</label><input name="email" type="email" required className="input" /></div>
        <div><label className="label">Password</label><input name="password" type="password" required minLength={mode === "register" ? 8 : 1} className="input" /></div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button className="btn-primary w-full py-3" disabled={pending}>{mode === "login" ? "Log in" : "Create account"}</button>
      </form>
      <p className="text-sm text-gray-600 mt-4 text-center">
        {mode === "login" ? <>New here? <Link href={`/register${next ? `?next=${next}` : ""}`} className="underline">Create an account</Link></> : <>Already have an account? <Link href={`/login${next ? `?next=${next}` : ""}`} className="underline">Log in</Link></>}
      </p>
      {mode === "login" && <p className="text-xs text-gray-400 mt-6 text-center">Demo: customer@example.com / customer1234 · Admin: admin@example.com / admin1234</p>}
    </div>
  );
}
