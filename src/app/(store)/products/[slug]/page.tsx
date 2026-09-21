import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getProductReviews, relatedProducts } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { formatMoney, formatDate } from "@/lib/format";
import { ProductCard } from "@/components/store/ProductCard";
import { ReviewForm } from "@/components/store/ReviewForm";
import { PincodeEstimator } from "@/components/store/PincodeEstimator";
import { WishlistButton } from "@/components/store/WishlistButton";
import { StickyBuyBar } from "@/components/store/StickyBuyBar";
import { RecentlyViewed } from "@/components/store/RecentlyViewed";
import { ProductDetail } from "@/components/store/ProductDetail";
import { Star, Truck, ShieldCheck, RefreshCw, Award, CreditCard, Info, Share2 } from "lucide-react";
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
    <div className="bg-[#f1f2f4] min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="bg-white border-b border-[#e0e0e0]">
        <div className="container-x py-3">
          <nav className="text-[11px] text-[#878787] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <Link href="/" className="hover:text-[#212121] shrink-0">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-[#212121] shrink-0">Shop</Link>
            {p.category && (
              <>
                <span>/</span>
                <Link href={`/shop?category=${p.category.slug}`} className="hover:text-[#212121] shrink-0">{p.category.name}</Link>
              </>
            )}
            <span>/</span>
            <span className="text-[#212121] font-medium truncate max-w-[200px] sm:max-w-xs">{p.name}</span>
          </nav>
        </div>
      </div>

      <div className="container-x py-4 sm:py-6">
        {/* ProductDetail handles gallery + variant images + main info */}
        <ProductDetail
          product={{
            id: p.id,
            name: p.name,
            slug: p.slug,
            images: p.images,
            price: p.price,
            compareAtPrice: p.compareAtPrice,
            stock: p.stock,
            trackStock: p.trackStock,
            options: p.options,
            sku: p.sku,
            shortDescription: p.shortDescription,
            rating: p.rating,
            reviewCount: p.reviewCount,
          }}
          variants={p.variants}
          currency={s.currency}
          category={p.category ? { name: p.category.name, slug: p.category.slug } : null}
        />

        {/* Additional sections below ProductDetail */}
        <div className="mt-6 grid lg:grid-cols-[1.1fr_0.9fr] xl:grid-cols-[1.1fr_0.9fr_360px] gap-6 lg:gap-8">
          <div className="space-y-4 lg:col-span-1">
            <div className="bg-white rounded-xl border border-[#e0e0e0] p-3 flex items-center justify-between">
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
              <button className="flex items-center gap-1.5 text-xs font-medium text-[#212121] hover:text-[#2874f0] px-3 py-2 rounded-full hover:bg-[#f1f2f4]">
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>

            <PincodeEstimator freeAbove={s.shipping.freeAbove} price={p.price} codEnabled={s.shipping.codEnabled} currency={s.currency} />

            <div className="bg-white rounded-xl border border-[#e0e0e0] p-5">
              <h3 className="font-bold text-sm mb-3 text-[#212121]">Services & Highlights</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex gap-2.5 p-3 rounded-xl bg-[#f8f9fb] border border-[#f0f0f0]">
                  <Award className="h-5 w-5 text-[#fb641b] shrink-0" />
                  <div className="text-xs">
                    <div className="font-bold text-[#212121]">Genuine Product</div>
                    <div className="text-[#878787] text-[11px] leading-tight">Quality checked</div>
                  </div>
                </div>
                <div className="flex gap-2.5 p-3 rounded-xl bg-[#f8f9fb] border border-[#f0f0f0]">
                  <RefreshCw className="h-5 w-5 text-[#2874f0] shrink-0" />
                  <div className="text-xs">
                    <div className="font-bold text-[#212121]">7 Days Return</div>
                    <div className="text-[#878787] text-[11px] leading-tight">Easy returns</div>
                  </div>
                </div>
                <div className="flex gap-2.5 p-3 rounded-xl bg-[#f8f9fb] border border-[#f0f0f0]">
                  <Truck className="h-5 w-5 text-[#388e3c] shrink-0" />
                  <div className="text-xs">
                    <div className="font-bold text-[#212121]">{s.shipping.freeAbove ? `Free over ${formatMoney(s.shipping.freeAbove, s.currency)}` : "Fast Delivery"}</div>
                    <div className="text-[#878787] text-[11px] leading-tight">{s.shipping.estimateText}</div>
                  </div>
                </div>
                <div className="flex gap-2.5 p-3 rounded-xl bg-[#f8f9fb] border border-[#f0f0f0]">
                  <ShieldCheck className="h-5 w-5 text-[#212121] shrink-0" />
                  <div className="text-xs">
                    <div className="font-bold text-[#212121]">Secure Payment</div>
                    <div className="text-[#878787] text-[11px] leading-tight">UPI / Cards / COD</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#e0e0e0] p-5">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-[#212121]">
                <Info className="h-5 w-5 text-[#878787]" /> Product Details
              </h2>
              <div className="prose-store text-sm" dangerouslySetInnerHTML={{ __html: p.description }} />
            </div>

            <div className="bg-white rounded-xl border border-[#e0e0e0] p-5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#212121] mb-3">
                <CreditCard className="h-4 w-4" /> Available offers
              </div>
              <ul className="space-y-2 text-xs text-[#212121]">
                <li className="flex gap-2"><span className="text-[#388e3c] font-bold">•</span> <span><b>Bank Offer</b> 10% off on HDFC Bank Cards, up to ₹1500. <span className="text-[#2874f0] font-semibold cursor-pointer">T&C</span></span></li>
                <li className="flex gap-2"><span className="text-[#388e3c] font-bold">•</span> <span><b>Special Price</b> Extra ₹{Math.round(p.price * 0.05 / 100)} off (price inclusive of discount)</span></li>
                <li className="flex gap-2"><span className="text-[#388e3c] font-bold">•</span> <span>Free delivery · No cost EMI available</span></li>
              </ul>
            </div>
          </div>

          <div className="hidden xl:block">
            <div className="sticky top-[88px] space-y-4">
              <div className="bg-[#f8f9fb] rounded-xl border border-dashed border-[#e0e0e0] p-4 text-center">
                <div className="text-xs font-bold text-[#212121]">Need help?</div>
                <div className="text-[11px] text-[#878787] mt-1">Call {s.supportPhone} or email {s.supportEmail}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div id="reviews" className="mt-8 grid lg:grid-cols-[1fr_380px] gap-6">
          <div className="bg-white rounded-xl border border-[#e0e0e0] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-xl text-[#212121]">Customer Reviews</h2>
              <span className="text-xs bg-[#f1f2f4] px-2.5 py-1 rounded-full font-medium text-[#212121]">{reviews.length} reviews</span>
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-16 w-16 rounded-full bg-[#f1f2f4] flex items-center justify-center mb-3">
                  <Star className="h-8 w-8 text-[#878787]" />
                </div>
                <div className="font-semibold text-[#212121]">No reviews yet</div>
                <p className="text-sm text-[#878787] mt-1">Be the first to share your experience</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="border border-[#f0f0f0] rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-[#212121] text-white flex items-center justify-center text-xs font-bold">
                          {r.authorName[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-[#212121]">{r.authorName}</div>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star key={i} className={`h-3.5 w-3.5 ${i <= r.rating ? "fill-[#ff9f00] text-[#ff9f00]" : "text-[#e0e0e0]"}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-[#878787]">{formatDate(r.createdAt)}</span>
                    </div>
                    {r.title && <div className="font-semibold text-sm mt-3 text-[#212121]">{r.title}</div>}
                    <p className="text-sm text-[#212121] mt-1 leading-relaxed">{r.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-[#e0e0e0] p-6 h-fit lg:sticky lg:top-[88px]">
            <h3 className="font-bold mb-4 text-[#212121]">Write a review</h3>
            <ReviewForm productId={p.id} userName={session?.name} />
            <div className="mt-6 p-3 bg-[#f8f9fb] rounded-xl text-xs text-[#212121] border border-[#f0f0f0]">
              <div className="font-semibold text-[#212121] mb-1">Review guidelines</div>
              Share your honest experience to help others. Keep it respectful.
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-8">
            <div className="bg-white rounded-xl border border-[#e0e0e0] p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-xl text-[#212121]">Similar products</h2>
                <Link href={`/shop?category=${p.category?.slug ?? ""}`} className="text-xs font-bold text-[#2874f0] hover:underline">
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
