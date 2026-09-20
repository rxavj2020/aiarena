"use client";
import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
export default function AdminLogin() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <form action={action} className="w-full max-w-sm bg-white rounded-2xl p-8 space-y-4 shadow-2xl">
        <input type="hidden" name="next" value="/admin" />
        <div><h1 className="text-xl font-semibold">Admin console</h1><p className="text-sm text-gray-500">Sign in to manage your store</p></div>
        <div><label className="label">Email</label><input name="email" type="email" required className="input" defaultValue="" /></div>
        <div><label className="label">Password</label><input name="password" type="password" required className="input" /></div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button className="btn-primary w-full py-2.5" disabled={pending}>Sign in</button>
        <p className="text-[11px] text-gray-400 text-center">Default: admin@example.com / admin1234</p>
      </form>
    </div>
  );
}
