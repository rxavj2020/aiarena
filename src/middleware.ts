import { NextResponse, type NextRequest } from "next/server";
export function middleware(req: NextRequest) {
  const h = new Headers(req.headers);
  h.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: h } });
}
export const config = { matcher: ["/admin/:path*"] };
