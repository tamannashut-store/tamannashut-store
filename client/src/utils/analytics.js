const GA_ID = "G-8L2DBJTSTG";
const META_PIXEL_ID = "1137463968714611";
let loadingStarted = false;

const prepareQueues = () => {
  window.dataLayer ||= [];
  window.gtag ||= function gtag() {
    window.dataLayer.push(arguments);
  };

  if (!window.fbq) {
    const fbq = function fbq() {
      if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments);
      else fbq.queue.push(arguments);
    };
    fbq.queue = [];
    fbq.loaded = false;
    fbq.version = "2.0";
    window.fbq = fbq;
    window._fbq = fbq;
  }
};

const loadAnalytics = () => {
  if (loadingStarted) return;
  loadingStarted = true;
  prepareQueues();

  window.gtag("js", new Date());
  window.gtag("config", GA_ID);
  const googleScript = document.createElement("script");
  googleScript.async = true;
  googleScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(googleScript);

  window.fbq("init", META_PIXEL_ID);
  window.fbq("track", "PageView");
  const metaScript = document.createElement("script");
  metaScript.async = true;
  metaScript.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(metaScript);
};

const scheduleAnalytics = () => {
  prepareQueues();
  const interactionEvents = ["pointerdown", "keydown", "touchstart"];
  const activate = () => {
    interactionEvents.forEach((event) => window.removeEventListener(event, activate));
    loadAnalytics();
  };
  interactionEvents.forEach((event) => window.addEventListener(event, activate, { passive: true }));

  const loadAfterPageSettles = () => window.setTimeout(loadAnalytics, 3500);
  if (document.readyState === "complete") loadAfterPageSettles();
  else window.addEventListener("load", loadAfterPageSettles, { once: true });
};

if (typeof window !== "undefined") scheduleAnalytics();

export const trackEvent = (name, parameters = {}) => {
  if (typeof window === "undefined") return;
  // Initialize the destination before a product event can enter its queue.
  loadAnalytics();
  window.gtag("event", name, parameters);
  const metaEvents = { view_item: "ViewContent", add_to_cart: "AddToCart", begin_checkout: "InitiateCheckout", purchase: "Purchase" };
  const metaEvent = metaEvents[name];
  if (!metaEvent) return;
  const items = parameters.items || [];
  const details = {
    value: Number(parameters.value || 0),
    currency: parameters.currency || "INR",
    content_type: "product",
    content_ids: items.map((item) => item.item_id).filter(Boolean),
    contents: items.map((item) => ({ id: item.item_id, quantity: Number(item.quantity || 1), item_price: Number(item.price || 0) })).filter((item) => item.id),
  };
  if (name === "purchase" && parameters.transaction_id) {
    const key = `meta_purchase_${parameters.transaction_id}`;
    try { if (sessionStorage.getItem(key)) return; } catch { /* Storage may be unavailable. */ }
    window.fbq("track", metaEvent, details, { eventID: `purchase_${parameters.transaction_id}` });
    try { sessionStorage.setItem(key, "1"); } catch { /* Do not interrupt checkout for analytics. */ }
    return;
  }
  window.fbq("track", metaEvent, details);
};
