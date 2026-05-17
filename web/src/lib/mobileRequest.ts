import type { NextRequest } from "next/server";
import { isMobileUserAgent } from "@/lib/mobileUserAgent";

/** Server-side mobile detection: UA, Client Hints, Cloudflare device type. */
export function isMobileRequest(req: Pick<NextRequest, "headers">): boolean {
  const ua = req.headers.get("user-agent");
  if (isMobileUserAgent(ua)) return true;

  if (req.headers.get("sec-ch-ua-mobile") === "?1") return true;

  const cf = req.headers.get("cf-device-type")?.toLowerCase();
  if (cf === "mobile" || cf === "tablet") return true;

  return false;
}
