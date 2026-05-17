import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { isMobileUserAgent } from "@/lib/mobileUserAgent";

const DESKTOP_COOKIE = "if_desktop";
const MOBILE_APP_PREFIX = "/app";

/** Comma-separated list. Cross-origin Vite / static apps must be listed when using credentials. */
function getAllowedOrigins(): string[] {
  const raw =
    process.env.CORS_ALLOWED_ORIGINS ||
    [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:4173",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
      "https://www.insiderflow.asia",
      "https://insiderflow.asia",
      "capacitor://localhost",
      "ionic://localhost",
    ].join(",");
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function applyCors(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get("origin") || "";
  const allowed = getAllowedOrigins();
  if (origin && allowed.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    );
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-alerts-sync-secret, x-admin-token, X-Requested-With, x-csrf-token",
    );
    res.headers.set("Vary", "Origin");
  }
  return res;
}

function hasFileExtension(pathname: string): boolean {
  const last = pathname.split("/").pop() ?? "";
  return last.includes(".") && !last.endsWith(".");
}

function shouldServeMobileApp(pathname: string): boolean {
  if (pathname.startsWith("/api")) return false;
  if (pathname.startsWith(MOBILE_APP_PREFIX)) return false;
  if (pathname.startsWith("/_next")) return false;
  if (pathname === "/favicon.ico" || pathname === "/robots.txt") return false;
  if (hasFileExtension(pathname)) return false;
  return true;
}

function mobileAppRedirect(req: NextRequest): NextResponse | null {
  const { pathname, search } = req.nextUrl;
  if (!shouldServeMobileApp(pathname)) return null;

  if (req.nextUrl.searchParams.get("desktop") === "1") {
    const res = NextResponse.next();
    res.cookies.set(DESKTOP_COOKIE, "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
    return res;
  }

  if (req.cookies.get(DESKTOP_COOKIE)?.value === "1") return null;

  if (!isMobileUserAgent(req.headers.get("user-agent"))) return null;

  const dest = new URL(`${MOBILE_APP_PREFIX}${search}`, req.url);
  return NextResponse.redirect(dest);
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.pathname;

  if (url.startsWith("/api/")) {
    if (req.method === "OPTIONS") {
      const res = new NextResponse(null, { status: 204 });
      return applyCors(req, res);
    }
    const res = NextResponse.next();
    return applyCors(req, res);
  }

  const mobileRedirect = mobileAppRedirect(req);
  if (mobileRedirect) return mobileRedirect;

  const requiresAuth = ["/trades", "/politicians", "/issuers"].some((p) =>
    url.startsWith(p),
  );
  const requiresPaid = false;

  if (!requiresAuth && !requiresPaid) return NextResponse.next();

  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get("session")?.value ||
    cookieStore.get("__Secure-next-auth.session-token")?.value ||
    cookieStore.get("next-auth.session-token")?.value;
  if (!sessionToken) {
    return NextResponse.redirect(
      new URL(
        "/login?next=" + encodeURIComponent(req.nextUrl.pathname),
        req.url,
      ),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image).*)",
  ],
};
