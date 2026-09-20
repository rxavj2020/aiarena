"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserRole } from "@/actions/admin";
import { useToast, notify } from "@/components/ui/Toast";
export function RoleToggle({ userId, role, isMe }: { userId: string; role: "customer" | "admin"; isMe: boolean }) {
  const [pending, start] = useTransition(); const toast = useToast(); const router = useRouter();
  return <select disabled={pending || isMe} value={role} onChange={(e) => start(async () => { notify(toast, await setUserRole(userId, e.target.value as "customer" | "admin")); router.refresh(); })} className="input py-1 text-xs w-28"><option value="customer">customer</option><option value="admin">admin</option></select>;
}
