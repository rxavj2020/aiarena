import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { getAllPluginStates } from "@/lib/plugins/store";
import { CheckCircle2, XCircle, ChevronRight } from "lucide-react";

const CATS: Record<string, string> = { payments: "Payments", email: "Email & notifications", storage: "Storage & media", hosting: "Hosting & CDN", shipping: "Shipping", marketing: "Marketing", analytics: "Analytics" };

export default function PluginsPage() {
  const all = getAllPluginStates();
  const groups = Object.keys(CATS).map((c) => ({ c, items: all.filter((p) => p.def.category === c) })).filter((g) => g.items.length);
  return (
    <div>
      <PageHeader title="Plugins" subtitle="One-click integrations. Paste your keys, test the connection, flip the switch." />
      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g.c}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">{CATS[g.c]}</h2>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {g.items.map(({ def, state }) => (
                <Link key={def.id} href={`/admin/plugins/${def.id}`} className="card p-5 hover:shadow-md transition-shadow flex flex-col">
                  <div className="flex items-start gap-3"><span className="text-2xl">{def.icon}</span><div className="flex-1 min-w-0"><div className="font-semibold">{def.name}</div><p className="text-xs text-gray-500 mt-1 line-clamp-2">{def.description}</p></div></div>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    {state.enabled ? <span className="flex items-center gap-1 text-green-700 font-medium"><CheckCircle2 className="h-3.5 w-3.5" /> Enabled</span> : <span className="flex items-center gap-1 text-gray-400"><XCircle className="h-3.5 w-3.5" /> Not enabled</span>}
                    <span className="flex items-center gap-1 text-gray-500">{state.lastTestOk === true ? "Tested OK" : state.lastTestOk === false ? "Test failed" : "Configure"} <ChevronRight className="h-3.5 w-3.5" /></span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
