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
import { Star, Truck, ShieldCheck, RefreshCw, Award, CheckCircle2, CreditCard, Info, Heart, Share2 } from "lucide-react";
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
  const related = relatedProducts(p, 8);
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
    <div className="bg-[#f8f9fb] min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb - minimal */}
      <div className="bg-white border-b border-gray-100">
        <div className="container-x py-3">
          <nav className="text-[11px] text-gray-500 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <Link href="/" className="hover:text-gray-900 shrink-0">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-gray-900 shrink-0">Shop</Link>
            {p.category && (
              <>
                <span>/</span>
                <Link href={`/shop?category=${p.category.slug}`} className="hover:text-gray-900 shrink-0">{p.category.name}</Link>
              </>
            )}
            <span>/</span>
            <span className="text-gray-900 font-medium truncate max-w-[200px] sm:max-w-xs">{p.name}</span>
          </nav>
        </div>
      </div>

      <div className="container-x py-4 sm:py-6">
        {/* Main product grid - Flipkart style: gallery left, details center, buy box right */}
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] xl:grid-cols-[1.1fr_0.9fr_360px] gap-6 lg:gap-8">
          {/* Gallery */}
          <div className="lg:sticky lg:top-[88px] h-fit">
            <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4">
              <Gallery images={p.images} name={p.name} />
            </div>

            {/* Share + wishlist bar */}
            <div className="mt-3 bg-white rounded-2xl border border-gray-100 p-3 flex items-center justify-between">
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
              <button className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-full hover:bg-gray-50">
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>
          </div>

          {/* Details center */}
          <div className="space-y-4">
            {/* Title + rating */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              {p.category && (
                <Link href={`/shop?category=${p.category.slug}`} className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-[#2874f0] bg-[#e8f0fe] px-2.5 py-1 rounded-full mb-3">
                  {p.category.name}
                </Link>
              )}
              <h1 className="font-display text-[22px] sm:text-[26px] font-bold leading-tight text-gray-900 tracking-tight">
                {p.name}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {p.reviewCount > 0 ? (
                  <a href="#reviews" className="inline-flex items-center gap-1.5 bg-[#f1f8e9] border border-[#d8edc0] text-[#2e7d32] px-2.5 py-1 rounded-full text-xs font-bold hover:bg-[#e8f5d8] transition">
                    <span className="flex items-center gap-1">
                      {p.rating.toFixed(1)} <Star className="h-3 w-3 fill-[#2e7d32] text-[#2e7d32]" />
                    </span>
                    <span className="font-medium">· {p.reviewCount} ratings</span>
                  </a>
                ) : (
                  <span className="text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">No ratings yet · Be first</span>
                )}
                <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="h-3.5 w-3.5" /> In stock
                </span>
                {p.sku && <span className="text-xs text-gray-400">SKU: {p.sku}</span>}
              </div>

              {p.shortDescription && (
                <p className="mt-4 text-sm text-gray-600 leading-relaxed">{p.shortDescription}</p>
              )}
            </div>

            {/* Price + offers - Flipkart style */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-[28px] font-bold tracking-tight text-gray-900">{formatMoney(p.price, s.currency)}</span>
                {off > 0 && (
                  <>
                    <span className="text-[16px] text-gray-400 line-through">{formatMoney(p.compareAtPrice!, s.currency)}</span>
                    <span className="bg-[#e8f5e9] text-[#2e7d32] font-bold px-2.5 py-1 rounded-full text-xs">{off}% off</span>
                  </>
                )}
              </div>
              {s.tax.enabled && s.tax.inclusive && <p className="text-[11px] text-gray-500 mt-1">Inclusive of all taxes · {s.shipping.estimateText}</p>}

              {/* Bank offers - Amazon/Flipkart hallmark */}
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-2">
                  <CreditCard className="h-4 w-4" /> Available offers
                </div>
                <ul className="space-y-1.5 text-xs text-gray-700">
                  <li className="flex gap-2">
                    <span className="text-emerald-600 font-bold">•</span> <span><b>Bank Offer</b> 10% off on HDFC Bank Cards, up to ₹1500. <span className="text-[#2874f0] font-semibold cursor-pointer">T&C</span></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-600 font-bold">•</span> <span><b>Special Price</b> Extra ₹{Math.round(p.price * 0.05 / 100)} off (price inclusive of discount)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-600 font-bold">•</span> <span>Free delivery · No cost EMI available</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Variants + Add to cart */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
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
            </div>

            {/* Delivery */}
            <PincodeEstimator freeAbove={s.shipping.freeAbove} price={p.price} codEnabled={s.shipping.codEnabled} currency={s.currency} />

            {/* Highlights - Amazon style */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-sm mb-3">Services & Highlights</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <Award className="h-5 w-5 text-amber-600 shrink-0" />
                  <div className="text-xs">
                    <div className="font-bold text-gray-900">Genuine Product</div>
                    <div className="text-gray-500 text-[11px] leading-tight">Brand warranty</div>
                  </div>
                </div>
                <div className="flex gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <RefreshCw className="h-5 w-5 text-sky-600 shrink-0" />
                  <div className="text-xs">
                    <div className="font-bold text-gray-900">7 Days Return</div>
                    <div className="text-gray-500 text-[11px] leading-tight">Easy returns</div>
                  </div>
                </div>
                <div className="flex gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <Truck className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div className="text-xs">
                    <div className="font-bold text-gray-900">{s.shipping.freeAbove ? `Free over ${formatMoney(s.shipping.freeAbove, s.currency)}` : "Fast Delivery"}</div>
                    <div className="text-gray-500 text-[11px] leading-tight">{s.shipping.estimateText}</div>
                  </div>
                </div>
                <div className="flex gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <ShieldCheck className="h-5 w-5 text-violet-600 shrink-0" />
                  <div className="text-xs">
                    <div className="font-bold text-gray-900">Secure Payment</div>
                    <div className="text-gray-500 text-[11px] leading-tight">UPI / Cards / COD</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-gray-400" /> Product Details
              </h2>
              <div className="prose-store text-sm" dangerouslySetInnerHTML={{ __html: p.description }} />
            </div>
          </div>

          {/* Buy box right - Amazon style sticky */}
          <div className="hidden xl:block">
            <div className="sticky top-[88px] space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-bold">{formatMoney(p.price, s.currency)}</span>
                  {off > 0 && <span className="text-sm text-gray-400 line-through">{formatMoney(p.compareAtPrice!, s.currency)}</span>}
                </div>
                <div className="text-xs text-emerald-700 font-medium flex items-center gap-1 mb-4">
                  <CheckCircle2 className="h-4 w-4" /> In Stock · Ready to ship
                </div>
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
                  compact
                />
                <div className="mt-4 pt-4 border-t text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between"><span>Sold by</span><span className="font-medium text-gray-900">{s.storeName}</span></div>
                  <div className="flex justify-between"><span>Ships from</span><span className="font-medium text-gray-900">India</span></div>
                </div>
              </div>

              <div className="bg-[#f8f9fb] rounded-2xl border border-dashed border-gray-300 p-4 text-center">
                <div className="text-xs font-bold text-gray-700">Need help?</div>
                <div className="text-[11px] text-gray-500 mt-1">Call {s.supportPhone} or email {s.supportEmail}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div id="reviews" className="mt-8 grid lg:grid-cols-[1fr_380px] gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-xl">Customer Reviews</h2>
              <span className="text-xs bg-gray-100 px-2.5 py-1 rounded-full font-medium">{reviews.length} reviews</span>
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                  <Star className="h-8 w-8 text-gray-300" />
                </div>
                <div className="font-semibold text-gray-900">No reviews yet</div>
                <p className="text-sm text-gray-500 mt-1">Be the first to share your experience</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">
                          {r.authorName[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{r.authorName}</div>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star key={i} className={`h-3.5 w-3.5 ${i <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
                    </div>
                    {r.title && <div className="font-semibold text-sm mt-3">{r.title}</div>}
                    <p className="text-sm text-gray-700 mt-1 leading-relaxed">{r.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 h-fit lg:sticky lg:top-[88px]">
            <h3 className="font-bold mb-4">Write a review</h3>
            <ReviewForm productId={p.id} userName={session?.name} />
            <div className="mt-6 p-3 bg-gray-50 rounded-xl text-xs text-gray-600">
              <div className="font-semibold text-gray-900 mb-1">Review guidelines</div>
              Share your honest experience to help others. Keep it respectful.
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-8">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-bold text-xl">Similar products</h2>
                <Link href={`/shop?category=${p.category?.slug ?? ""}`} className="text-xs font-semibold text-[#2874f0] hover:underline">
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {related.map((r) => (
                  <ProductCard key={r.id} p={r} currency={s.currency} />
                ))}
              </div>
            </div>
          </section>
        )}

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
    </div>
  );
}
