/** Match phones / mobile browsers — not desktop Chrome/Safari/Firefox/Edge. */
const MOBILE_UA_RE =
  /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|CriOS|FxiOS/i;

/** iPadOS 13+ often reports MacIntel + touch. */
export function isMobileUserAgent(userAgent: string | null | undefined): boolean {
  const ua = userAgent ?? "";
  if (!ua) return false;
  if (MOBILE_UA_RE.test(ua)) return true;
  if (/iPad/i.test(ua)) return true;
  return false;
}
