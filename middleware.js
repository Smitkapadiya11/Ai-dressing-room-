import { NextResponse } from "next/server";
import { ACCESS_COOKIE, accessToken, gateDisabled } from "@/lib/access";

export async function middleware(req) {
  if (gateDisabled()) return NextResponse.next();

  const token = await accessToken();
  if (token && req.cookies.get(ACCESS_COOKIE)?.value === token) return NextResponse.next();

  const { pathname, search } = req.nextUrl;
  if (pathname.startsWith("/api/")) {
    return Response.json({ error: "Access required", locked: true }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/access";
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

// Everything that shows the try-on or spends model credits.
export const config = {
  matcher: ["/mirror/:path*", "/api/tryon/:path*", "/api/body-read", "/api/verify", "/api/share"],
};
