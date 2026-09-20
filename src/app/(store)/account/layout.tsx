import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import { Package, MapPin, User, LogOut, LayoutDashboard } from "lucide-react";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login?next=/account");
  return (
    <div className="container-x py-10 grid md:grid-cols-[220px_1fr] gap-10">
      <aside>
        <div className="mb-6"><div className="font-semibold">{s.name}</div><div className="text-xs text-gray-500">{s.email}</div></div>
        <nav className="flex md:flex-col gap-1 text-sm">
          <Link href="/account" className="btn-ghost justify-start"><User className="h-4 w-4" /> Overview</Link>
          <Link href="/account/orders" className="btn-ghost justify-start"><Package className="h-4 w-4" /> Orders</Link>
          <Link href="/account/addresses" className="btn-ghost justify-start"><MapPin className="h-4 w-4" /> Addresses</Link>
          {s.role === "admin" && <Link href="/admin" className="btn-ghost justify-start text-accent"><LayoutDashboard className="h-4 w-4" /> Admin console</Link>}
          <form action={logoutAction}><button className="btn-ghost justify-start w-full text-red-600"><LogOut className="h-4 w-4" /> Log out</button></form>
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}
