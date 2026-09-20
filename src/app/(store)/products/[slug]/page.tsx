import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getProductReviews, relatedProducts } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { formatMoney, formatDate } from "@/lib/format";
import { ProductCard } from "@/components/store/ProductCard";
import { AddToCart } from "@/components/store/AddToCart";
import { Gallery } from "@/components/store/Gallery";
import { ReviewForm } from "@/components/store/ReviewForm";
import { Star, Truck, ShieldCheck, RefreshCw } from "lucide-react";
import { getSession } from "@/lib/auth";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProductBySlug((await params).slug);
  return p ? { title: p.seoTitle || p.name, description: p.seoDescription || p.shortDescription, openGraph: { images: p.images.slice(0, 1) } } : {};
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProductBySlug((await params).slug);
  if (!p || p.status !== "active") notFound();
  const [s, session] = await Promise.all([getSettings(), getSession()]);
  const reviews = getProductReviews(p.id);
  const related = relatedProducts(p);
  const off = p.compareAtPrice && p.compareAtPrice > p.price ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100) : 0;
  const jsonLd = { "@context": "https://schema.org", "@type": "Product", name: p.name, image: p.images, description: p.shortDescription, sku: p.sku, offers: { "@type": "Offer", priceCurrency: s.currency, price: (p.price / 100).toFixed(2), availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" }, ...(p.reviewCount ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating.toFixed(1), reviewCount: p.reviewCount } } : {}) };

  return (
    <div className="container-x py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="text-xs text-gray-500 mb-6"><Link href="/">Home</Link> / <Link href="/shop">Shop</Link>{p.category && <> / <Link href={`/shop?category=${p.category.slug}`}>{p.category.name}</Link></>} / <span className="text-gray-800">{p.name}</span></nav>
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        <Gallery images={p.images} name={p.name} />
        <div>
          {p.category && <div className="text-xs uppercase tracking-widest text-gray-500">{p.category.name}</div>}
          <h1 className="font-display text-3xl md:text-4xl font-semibold mt-1">{p.name}</h1>
          {p.reviewCount > 0 && (
            <a href="#reviews" className="mt-3 inline-flex items-center gap-1.5 text-sm">
              <span className="flex">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`h-4 w-4 ${i <= Math.round(p.rating) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />)}</span>
              <span className="text-gray-600">{p.rating.toFixed(1)} · {p.reviewCount} reviews</span>
            </a>
          )}
          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-semibold">{formatMoney(p.price, s.currency)}</span>
            {off > 0 && <><span className="text-lg text-gray-400 line-through">{formatMoney(p.compareAtPrice!, s.currency)}</span><span className="badge bg-green-100 text-green-800">Save {off}%</span></>}
          </div>
          {s.tax.enabled && s.tax.inclusive && <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>}
          <p className="mt-5 text-gray-700 leading-relaxed">{p.shortDescription}</p>
          <div className="mt-6">
            <AddToCart product={{ id: p.id, stock: p.stock, trackStock: p.trackStock, options: p.options, price: p.price }} variants={p.variants} currency={s.currency} />
          </div>
          <ul className="mt-8 grid gap-3 text-sm text-gray-700 border-t pt-6">
            <li className="flex gap-2 items-center"><Truck className="h-4 w-4 text-gray-500" /> {s.shipping.estimateText}{s.shipping.freeAbove ? ` · Free shipping above ${formatMoney(s.shipping.freeAbove, s.currency)}` : ""}</li>
            <li className="flex gap-2 items-center"><RefreshCw className="h-4 w-4 text-gray-500" /> 7-day easy returns</li>
            <li className="flex gap-2 items-center"><ShieldCheck className="h-4 w-4 text-gray-500" /> Secure checkout {s.shipping.codEnabled ? "· Cash on Delivery available" : ""}</li>
          </ul>
          {p.sku && <p className="mt-4 text-xs text-gray-400">SKU: {p.sku}</p>}
        </div>
      </div>

      <div className="mt-16 grid lg:grid-cols-[1fr_360px] gap-12">
        <div>
          <h2 className="font-display text-2xl font-semibold mb-4">Description</h2>
          <div className="prose-store" dangerouslySetInnerHTML={{ __html: p.description }} />
          <h2 id="reviews" className="font-display text-2xl font-semibold mt-12 mb-4">Reviews ({reviews.length})</h2>
          <div className="space-y-5">
            {reviews.length === 0 && <p className="text-gray-500 text-sm">No reviews yet. Be the first!</p>}
            {reviews.map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex items-center justify-between">
                  <div className="flex">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`h-4 w-4 ${i <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />)}</div>
                  <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
                </div>
                {r.title && <div className="font-medium mt-2">{r.title}</div>}
                <p className="text-sm text-gray-700 mt-1">{r.body}</p>
                <div className="text-xs text-gray-500 mt-2">— {r.authorName}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="card p-5 sticky top-24">
            <h3 className="font-semibold mb-3">Write a review</h3>
            <ReviewForm productId={p.id} userName={session?.name} />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl font-semibold mb-6">You may also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">{related.map((r) => <ProductCard key={r.id} p={r} currency={s.currency} />)}</div>
        </section>
      )}
    </div>
  );
}
