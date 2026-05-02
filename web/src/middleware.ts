import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

/** Comma-separated list. Cross-origin Vite / static apps must be listed when using credentials. */
function getAllowedOrigins(): string[] {
  const raw =
    process.env.CORS_ALLOWED_ORIGINS ||
    [
      "http://localhost:5173",
      "http://localhost:4173",
      "http://127.0.0.1:5173",
      "https://www.insiderflow.asia",
      // Capacitor WKWebView origins (confirm via Safari Web Inspector → Network → Request Headers → Origin)
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
    "/trades/:path*",
    "/politicians/:path*",
    "/issuers/:path*",
    "/insider/:path*",
  ],
};
