const DEFAULT_MEASUREMENT_ID = "G-XNQRFHM8EV";

function measurementId(): string | null {
  const id =
    import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() || DEFAULT_MEASUREMENT_ID;
  if (import.meta.env.DEV && !import.meta.env.VITE_GA_MEASUREMENT_ID?.trim()) {
    return null;
  }
  return id;
}

let initialized = false;

export function initGoogleAnalytics(): void {
  if (initialized || typeof window === "undefined") return;
  const id = measurementId();
  if (!id) return;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", id, { send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);

  initialized = true;
}

export function trackPageView(pagePath: string): void {
  const id = measurementId();
  if (!id || !window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: pagePath,
    page_location: window.location.href,
    page_title: document.title,
  });
}
