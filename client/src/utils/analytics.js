export const trackEvent = (name, parameters = {}) => {
  if (typeof window === "undefined") return;
  window.gtag?.("event", name, parameters);
  if (name === "purchase") window.fbq?.("track", "Purchase", { value: parameters.value, currency: parameters.currency || "INR" });
  if (name === "add_to_cart") window.fbq?.("track", "AddToCart", { value: parameters.value, currency: parameters.currency || "INR", content_ids: parameters.items?.map((item) => item.item_id) });
};
