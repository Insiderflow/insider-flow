import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { isMobileUserAgent } from "@/lib/isMobileUserAgent";

const DESKTOP_COOKIE = "if_desktop";
const MOBILE_APP_PREFIX = "/app";
const CRYPTO_ORIGIN = "https://insiderflow-crypto.vercel.app";

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
  if (pathname.startsWith("/crypto")) return false;
  if (pathname.startsWith("/ai-agent")) return false;
  if (pathname.startsWith(MOBILE_APP_PREFIX)) return false;
  if (pathname.startsWith("/_next")) return false;
  if (pathname === "/favicon.ico" || pathname === "/robots.txt") return false;
  if (hasFileExtension(pathname)) return false;
  return true;
}

function mobileAppRedirect(req: NextRequest): NextResponse | null {
  const { pathname, search } = req.nextUrl;
  if (!shouldServeMobileApp(pathname)) return null;

  if (req.nextUrl.searchParams.get("mobile") === "1") {
    const dest = new URL(`/app/${search}`, req.url);
    const res = NextResponse.redirect(dest);
    res.cookies.set(DESKTOP_COOKIE, "", { path: "/", maxAge: 0, sameSite: "lax" });
    return res;
  }

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

  const dest = new URL(`${MOBILE_APP_PREFIX}/${search}`, req.url);
  return NextResponse.redirect(dest);
}

async function proxyCryptoApp(req: NextRequest): Promise<NextResponse> {
  const { pathname, search } = req.nextUrl;
  const target = `${CRYPTO_ORIGIN}${pathname}${search}`;
  const headers = new Headers(req.headers);
  headers.set("host", "insiderflow-crypto.vercel.app");
  headers.delete("connection");

  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body:
      req.method !== "GET" && req.method !== "HEAD"
        ? await req.arrayBuffer()
        : undefined,
    redirect: "manual",
  });

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.pathname;

  const withPathname = (res: NextResponse) => {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", url);
    return NextResponse.next({
      request: { headers: requestHeaders },
      headers: res.headers,
    });
  };

  if (url === "/crypto" || url.startsWith("/crypto/")) {
    return proxyCryptoApp(req);
  }

  if (url.startsWith("/api/")) {
    if (req.method === "OPTIONS") {
      const res = new NextResponse(null, { status: 204 });
      return applyCors(req, res);
    }
    return withPathname(applyCors(req, NextResponse.next()));
  }

  const mobileRedirect = mobileAppRedirect(req);
  if (mobileRedirect) return mobileRedirect;

  const requiresAuth = ["/trades", "/politicians", "/issuers"].some((p) =>
    url.startsWith(p),
  );
  const requiresPaid = false;

  if (!requiresAuth && !requiresPaid) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", url);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

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

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", url);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image).*)",
  ],
};
