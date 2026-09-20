import Link from "next/link";
import { listCategories, categoryProductCounts } from "@/lib/catalog";
export const metadata = { title: "Categories" };
export default function CategoriesPage() {
  const cats = listCategories().filter((c) => !c.parentId);
  const counts = categoryProductCounts();
  return (
    <div className="container-x py-12">
      <h1 className="font-display text-4xl font-semibold mb-8">Categories</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cats.map((c) => (
          <Link key={c.id} href={`/shop?category=${c.slug}`} className="group card overflow-hidden">
            <div className="aspect-[4/3] bg-gray-100 overflow-hidden">{c.image && <img src={c.image} alt={c.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />}</div>
            <div className="p-5"><div className="font-semibold text-lg">{c.name}</div><p className="text-sm text-gray-600 mt-1">{c.description}</p><div className="text-xs text-gray-400 mt-2">{counts.find((x) => x.categoryId === c.id)?.n ?? 0} products</div></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
