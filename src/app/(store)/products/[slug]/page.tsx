import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getProductReviews, relatedProducts } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { formatMoney, formatDate } from "@/lib/format";
import { ProductCard } from "@/components/store/ProductCard";
import { AddToCart } from "@/components/store/AddToCart";
import { Gallery } from "@/components/store/Gallery";
import { ReviewForm } from "@/components/store/ReviewForm";
import { PincodeEstimator } from "@/components/store/PincodeEstimator";
import { WishlistButton } from "@/components/store/WishlistButton";
import { StickyBuyBar } from "@/components/store/StickyBuyBar";
import { RecentlyViewed } from "@/components/store/RecentlyViewed";
import { Star, Truck, ShieldCheck, RefreshCw, Award, CheckCircle2 } from "lucide-react";
import { getSession } from "@/lib/auth";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProductBySlug((await params).slug);
  return p
    ? {
        title: p.seoTitle || p.name,
        description: p.seoDescription || p.shortDescription,
        openGraph: { images: p.images.slice(0, 1) },
      }
    : {};
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProductBySlug((await params).slug);
  if (!p || p.status !== "active") notFound();
  const [s, session] = await Promise.all([getSettings(), getSession()]);
  const reviews = getProductReviews(p.id);
  const related = relatedProducts(p);
  const off =
    p.compareAtPrice && p.compareAtPrice > p.price
      ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)
      : 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    image: p.images,
    description: p.shortDescription,
    sku: p.sku,
    offers: {
      "@type": "Offer",
      priceCurrency: s.currency,
      price: (p.price / 100).toFixed(2),
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(p.reviewCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: p.rating.toFixed(1),
            reviewCount: p.reviewCount,
          },
        }
      : {}),
  };

  return (
    <div className="container-x py-8 md:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="text-xs text-gray-500 mb-6 flex flex-wrap items-center gap-1.5">
        <Link href="/" className="hover:text-black">
          Home
        </Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-black">
          Shop
        </Link>
        {p.category && (
          <>
            <span>/</span>
            <Link href={`/shop?category=${p.category.slug}`} className="hover:text-black">
              {p.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-900 font-medium truncate max-w-xs">{p.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-14">
        <Gallery images={p.images} name={p.name} />

        <div className="space-y-6">
          <div>
            {p.category && (
              <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1">
                {p.category.name}
              </div>
            )}
            <h1 className="font-display text-2xl md:text-4xl font-semibold text-gray-900 leading-tight">
              {p.name}
            </h1>

            {/* Ratings & Reviews summary (Flipkart / Amazon style) */}
            <div className="mt-3 flex items-center gap-3">
              {p.reviewCount > 0 ? (
                <a
                  href="#reviews"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition"
                >
                  <span className="flex items-center gap-1">
                    {p.rating.toFixed(1)} <Star className="h-3 w-3 fill-emerald-600 text-emerald-600" />
                  </span>
                  <span className="text-emerald-700">| {p.reviewCount} Ratings</span>
                </a>
              ) : (
                <span className="text-xs text-gray-500">No ratings yet</span>
              )}
              <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> In Stock & Ready to Ship
              </span>
            </div>
          </div>

          {/* Pricing Box with Flipkart-style highlight */}
          <div className="border-y border-gray-100 py-4">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900">
                {formatMoney(p.price, s.currency)}
              </span>
              {off > 0 && (
                <>
                  <span className="text-lg text-gray-400 line-through">
                    {formatMoney(p.compareAtPrice!, s.currency)}
                  </span>
                  <span className="badge bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 text-xs">
                    {off}% off
                  </span>
                </>
              )}
            </div>
            {s.tax.enabled && s.tax.inclusive && (
              <p className="text-[11px] text-gray-500 mt-1">Inclusive of all taxes</p>
            )}
          </div>

          {p.shortDescription && (
            <p className="text-sm text-gray-600 leading-relaxed">{p.shortDescription}</p>
          )}

          {/* Add to Cart & Buy Buttons */}
          <div className="space-y-3">
            <AddToCart
              product={{
                id: p.id,
                stock: p.stock,
                trackStock: p.trackStock,
                options: p.options,
                price: p.price,
              }}
              variants={p.variants}
              currency={s.currency}
            />

            <div className="flex items-center justify-between pt-1">
              <WishlistButton
                item={{
                  id: p.id,
                  name: p.name,
                  slug: p.slug,
                  price: p.price,
                  compareAtPrice: p.compareAtPrice,
                  image: p.images[0],
                }}
                showText
                size="md"
              />
              {p.sku && <span className="text-xs text-gray-400">SKU: {p.sku}</span>}
            </div>
          </div>

          {/* Flipkart / Amazon style PIN Code Delivery Estimator */}
          <PincodeEstimator
            freeAbove={s.shipping.freeAbove}
            price={p.price}
            codEnabled={s.shipping.codEnabled}
            currency={s.currency}
          />

          {/* Trust Highlights Matrix (Amazon / Flipkart Trust Badges) */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-100 bg-white">
              <Award className="h-5 w-5 text-amber-600 shrink-0" />
              <div className="text-xs">
                <div className="font-semibold text-gray-900">100% Genuine</div>
                <div className="text-gray-500 text-[11px]">Direct brand guarantee</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-100 bg-white">
              <RefreshCw className="h-5 w-5 text-sky-600 shrink-0" />
              <div className="text-xs">
                <div className="font-semibold text-gray-900">7 Days Return</div>
                <div className="text-gray-500 text-[11px]">Hassle-free exchange</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-100 bg-white">
              <Truck className="h-5 w-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <div className="font-semibold text-gray-900">
                  {s.shipping.freeAbove ? `Free over ${formatMoney(s.shipping.freeAbove, s.currency)}` : "Fast Shipping"}
                </div>
                <div className="text-gray-500 text-[11px]">{s.shipping.estimateText}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-100 bg-white">
              <ShieldCheck className="h-5 w-5 text-violet-600 shrink-0" />
              <div className="text-xs">
                <div className="font-semibold text-gray-900">Secure Payment</div>
                <div className="text-gray-500 text-[11px]">
                  {s.shipping.codEnabled ? "UPI / Cards / COD" : "UPI / Cards"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Reviews */}
      <div className="mt-16 grid lg:grid-cols-[1fr_360px] gap-12 border-t border-gray-200 pt-12">
        <div>
          <h2 className="font-display text-2xl font-semibold mb-4">Product Details</h2>
          <div className="prose-store" dangerouslySetInnerHTML={{ __html: p.description }} />

          <h2 id="reviews" className="font-display text-2xl font-semibold mt-12 mb-4">
            Customer Reviews ({reviews.length})
          </h2>
          <div className="space-y-4">
            {reviews.length === 0 && (
              <p className="text-gray-500 text-sm">No reviews yet. Be the first to share your thoughts!</p>
            )}
            {reviews.map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex items-center justify-between">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
                </div>
                {r.title && <div className="font-medium text-sm mt-2">{r.title}</div>}
                <p className="text-sm text-gray-700 mt-1">{r.body}</p>
                <div className="text-xs text-gray-500 mt-2 font-medium">— {r.authorName}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="card p-5 sticky top-24 shadow-xs">
            <h3 className="font-semibold text-base mb-3">Write a Review</h3>
            <ReviewForm productId={p.id} userName={session?.name} />
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-16 pt-12 border-t border-gray-200">
          <h2 className="font-display text-2xl font-semibold mb-6">Similar Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {related.map((r) => (
              <ProductCard key={r.id} p={r} currency={s.currency} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Viewed Products (Automatic visitor memory) */}
      <RecentlyViewed
        currentProduct={{
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          compareAtPrice: p.compareAtPrice,
          image: p.images[0],
        }}
        currency={s.currency}
      />

      {/* Sticky Mobile Buy Action Bar */}
      <StickyBuyBar
        product={{
          id: p.id,
          name: p.name,
          price: p.price,
          compareAtPrice: p.compareAtPrice,
          images: p.images,
          stock: p.stock,
          trackStock: p.trackStock,
          hasOptions: p.options.length > 0,
        }}
        currency={s.currency}
      />
    </div>
  );
}
