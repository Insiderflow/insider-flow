/** Common phone/tablet UA sniff (not exhaustive; good enough for marketing-site redirect). */
export function isMobileUserAgent(ua: string | null): boolean {
  if (!ua) return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(
    ua
  );
}
