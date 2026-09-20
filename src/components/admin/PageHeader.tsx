export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">{title}</h1>{subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}</div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
