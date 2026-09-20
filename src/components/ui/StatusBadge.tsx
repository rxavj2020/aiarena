const colors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800", confirmed: "bg-blue-100 text-blue-800", processing: "bg-indigo-100 text-indigo-800", shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800", cancelled: "bg-gray-200 text-gray-700", refunded: "bg-red-100 text-red-800",
  paid: "bg-green-100 text-green-800", unpaid: "bg-amber-100 text-amber-800", failed: "bg-red-100 text-red-800", cod: "bg-sky-100 text-sky-800",
  active: "bg-green-100 text-green-800", draft: "bg-gray-200 text-gray-700", archived: "bg-red-100 text-red-800",
};
export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge capitalize ${colors[status] ?? "bg-gray-100 text-gray-700"}`}>{status}</span>;
}
