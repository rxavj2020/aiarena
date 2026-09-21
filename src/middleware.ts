import { NextResponse, type NextRequest } from "next/server";
export function middleware(req: NextRequest) {
  const h = new Headers(req.headers);
  h.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: h } });
}
// The pathname header is used to keep the SaaS shell, store shell and tenant website
// from accidentally sharing each other’s chrome. Static assets are excluded.
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
