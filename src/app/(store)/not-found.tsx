import Link from "next/link";
export default function NotFound() {
  return <div className="container-x py-32 text-center"><h1 className="font-display text-5xl font-semibold">404</h1><p className="text-gray-500 mt-3">We couldn&apos;t find that page.</p><Link href="/" className="btn-primary mt-6">Back home</Link></div>;
}
