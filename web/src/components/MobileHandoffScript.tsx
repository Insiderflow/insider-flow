import Script from "next/script";

/**
 * Catches phones Safari marks as "desktop" (Macintosh UA) and narrow touch viewports
 * that middleware UA sniffing misses. Skips when if_desktop=1 or already on /app.
 */
export default function MobileHandoffScript() {
  return (
    <Script id="if-mobile-handoff" strategy="beforeInteractive">
      {`(function(){try{
var p=location.pathname;
if(p==="/app"||p.indexOf("/app/")===0)return;
if(document.cookie.indexOf("if_desktop=1")!==-1)return;
var q=location.search||"";
if(/(?:^|[?&])mobile=1(?:&|$)/.test(q)){
  document.cookie="if_desktop=;path=/;max-age=0;SameSite=Lax";
  location.replace("/app/"+(q?q.replace(/^\\?/,"?"):""));
  return;
}
var touch="ontouchstart"in window||(navigator.maxTouchPoints|0)>0;
var narrow=window.matchMedia("(max-width: 900px)").matches;
if(touch&&narrow)location.replace("/app/"+q);
}catch(e){}})();`}
    </Script>
  );
}
