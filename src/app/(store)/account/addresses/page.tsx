import { getSession } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { id } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { Trash2 } from "lucide-react";

export const metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const s = (await getSession())!;
  const list = db.select().from(schema.addresses).where(eq(schema.addresses.userId, s.id)).all();

  async function add(fd: FormData) {
    "use server";
    const u = (await getSession())!;
    db.insert(schema.addresses).values({ id: id("adr_"), userId: u.id, label: String(fd.get("label") || "Home"), name: String(fd.get("name")), phone: String(fd.get("phone")), line1: String(fd.get("line1")), line2: String(fd.get("line2") || ""), city: String(fd.get("city")), state: String(fd.get("state")), postalCode: String(fd.get("postalCode")), country: "IN" }).run();
    revalidatePath("/account/addresses");
  }
  async function remove(fd: FormData) {
    "use server";
    const u = (await getSession())!;
    db.delete(schema.addresses).where(and(eq(schema.addresses.id, String(fd.get("id"))), eq(schema.addresses.userId, u.id))).run();
    revalidatePath("/account/addresses");
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-6">Addresses</h1>
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {list.map((a) => (
          <div key={a.id} className="card p-4 text-sm relative">
            <div className="font-medium">{a.label}</div>
            <div className="text-gray-600 mt-1">{a.name}<br />{a.line1}{a.line2 && <>, {a.line2}</>}<br />{a.city}, {a.state} {a.postalCode}<br />{a.phone}</div>
            <form action={remove} className="absolute top-3 right-3"><input type="hidden" name="id" value={a.id} /><button className="text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></form>
          </div>
        ))}
      </div>
      <form action={add} className="card p-6 grid sm:grid-cols-2 gap-3">
        <h2 className="font-semibold sm:col-span-2">Add address</h2>
        <input name="label" placeholder="Label (Home, Office)" className="input" />
        <input name="name" required placeholder="Full name" className="input" />
        <input name="phone" required placeholder="Phone" className="input" />
        <input name="postalCode" required placeholder="PIN code" className="input" />
        <input name="line1" required placeholder="Address line 1" className="input sm:col-span-2" />
        <input name="line2" placeholder="Address line 2" className="input sm:col-span-2" />
        <input name="city" required placeholder="City" className="input" />
        <input name="state" required placeholder="State" className="input" />
        <button className="btn-primary sm:col-span-2">Save address</button>
      </form>
    </div>
  );
}
