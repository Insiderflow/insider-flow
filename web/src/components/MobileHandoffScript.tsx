import Script from "next/script";

/**
 * Client-side fallback when edge middleware is bypassed: mobile visitors → /app/.
 * Desktop users stay on the legacy Next.js site.
 */
export default function MobileHandoffScript() {
  return (
    <Script id="if-mobile-handoff" strategy="beforeInteractive">
      {`(function(){try{
var p=location.pathname;
if(p==="/app"||p.indexOf("/app/")===0)return;
if(document.cookie.indexOf("if_desktop=1")!==-1)return;
var q=location.search||"";
var forceMobile=/(?:^|[?&])mobile=1(?:&|$)/.test(q);
if(forceMobile){
  document.cookie="if_desktop=;path=/;max-age=0;SameSite=Lax";
  location.replace("/app/"+(q?q.replace(/^\\?/,"?"):""));
  return;
}
var ua=navigator.userAgent||"";
var mobile=/Android|webOS|iPhone|iPod|iPad|BlackBerry|IEMobile|Opera Mini|Mobile|CriOS|FxiOS/i.test(ua);
if(!mobile)return;
location.replace("/app/"+q);
}catch(e){}})();`}
    </Script>
  );
}
