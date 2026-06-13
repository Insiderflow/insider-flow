import { NextRequest, NextResponse } from "next/server";

const CRYPTO_ORIGIN = "https://insiderflow-crypto.vercel.app";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const target = `${CRYPTO_ORIGIN}${pathname}${search}`;

  const headers = new Headers(request.headers);
  headers.set("host", "insiderflow-crypto.vercel.app");
  headers.delete("connection");

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body:
      request.method !== "GET" && request.method !== "HEAD"
        ? await request.arrayBuffer()
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

export const config = {
  matcher: ["/crypto", "/crypto/:path*"],
};
