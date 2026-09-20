"use client";
export function SalesChart({ data }: { data: { d: string; v: number; n: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.v));
  return (
    <div className="flex items-end gap-1 h-44">
      {data.map((d) => (
        <div key={d.d} className="flex-1 group relative flex flex-col justify-end h-full">
          <div className="bg-gray-900 rounded-t-sm min-h-[2px] transition-colors group-hover:bg-accent" style={{ height: `${(d.v / max) * 100}%` }} />
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-[10px] rounded px-1.5 py-1 whitespace-nowrap z-10">{d.d.slice(5)} · ₹{d.v.toLocaleString("en-IN")} · {d.n} orders</div>
        </div>
      ))}
    </div>
  );
}
