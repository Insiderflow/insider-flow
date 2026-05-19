import Script from "next/script";

/**
 * Client-side fallback: send marketing routes to /app when middleware is bypassed.
 * Skips when if_desktop=1 or already on /app.
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
location.replace("/app/"+q);
}catch(e){}})();`}
    </Script>
  );
}
