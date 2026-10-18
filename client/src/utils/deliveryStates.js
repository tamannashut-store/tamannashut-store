export const deliveryStateMessage = (states = []) => states.length ? `Delivery within ${states.join(" or ")} only` : "";
export const matchesDeliveryState = (states = [], state) => !states.length || states.some((allowed) => allowed.trim().toLowerCase() === String(state || "").trim().toLowerCase());
