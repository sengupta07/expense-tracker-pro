import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = new Set(["/login", "/signup", "/", "/api", "/onboarding"]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = [...PUBLIC_PATHS].some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (isPublic) return NextResponse.next();

  const hasAuthCookie = req.cookies.get("auth")?.value === "1";
  if (!hasAuthCookie) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/expenses/:path*",
    "/goals/:path*",
    "/profile/:path*",
    "/onboarding/:path*",
  ],
};
