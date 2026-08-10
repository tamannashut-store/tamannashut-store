const API_BASE = "https://apiv2.shiprocket.in/v1/external";
let cachedToken = "";
let tokenExpiresAt = 0;

const configurationError = () => {
  const required = ["SHIPROCKET_EMAIL", "SHIPROCKET_PASSWORD", "SHIPROCKET_PICKUP_LOCATION", "SHIPROCKET_PICKUP_POSTCODE"];
  const missing = required.filter((key) => !String(process.env[key] || "").trim());
  return missing.length ? `Missing server configuration: ${missing.join(", ")}` : "";
};

const login = async () => {
  const missing = configurationError();
  if (missing) throw Object.assign(new Error(missing), { status: 503 });
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: process.env.SHIPROCKET_EMAIL, password: process.env.SHIPROCKET_PASSWORD }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.token) throw Object.assign(new Error(data.message || "Shiprocket authentication failed"), { status: 502 });
  cachedToken = data.token;
  tokenExpiresAt = Date.now() + 9 * 24 * 60 * 60 * 1000;
  return cachedToken;
};

const request = async (path, { method = "GET", body, retry = true } = {}) => {
  const token = cachedToken && tokenExpiresAt > Date.now() ? cachedToken : await login();
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 401 && retry) {
    cachedToken = "";
    tokenExpiresAt = 0;
    await login();
    return request(path, { method, body, retry: false });
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = data.message || (data.errors && Object.values(data.errors).flat().join(", ")) || "Shiprocket request failed";
    throw Object.assign(new Error(details), { status: 502, providerStatus: response.status });
  }
  return data;
};

const cleanPhone = (phone) => String(phone || "").replace(/\D/g, "").slice(-10);
const orderReference = (order) => String(order._id).slice(-20);
const orderDate = (date) => new Date(date).toISOString().slice(0, 19).replace("T", " ");

export const createShiprocketOrder = async (order, parcel) => request("/orders/create/adhoc", {
  method: "POST",
  body: {
    order_id: orderReference(order),
    order_date: orderDate(order.createdAt),
    pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION,
    billing_customer_name: String(order.customerName || "Customer").slice(0, 50),
    billing_last_name: "",
    billing_address: String(order.address || "").slice(0, 80),
    billing_address_2: String(order.address || "").slice(80, 160),
    billing_city: order.city,
    billing_pincode: Number(order.pincode),
    billing_state: parcel.destinationState,
    billing_country: "India",
    billing_email: order.email,
    billing_phone: cleanPhone(order.phone),
    shipping_is_billing: true,
    order_items: order.products.map((item) => ({
      name: String(item.name || "Product").slice(0, 100),
      sku: String(item.sku || item._id).slice(0, 50),
      units: Number(item.qty),
      selling_price: Number(item.price),
      discount: 0,
      tax: 0,
      hsn: "",
    })),
    payment_method: order.paymentMethod === "COD" ? "COD" : "Prepaid",
    shipping_charges: 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: Number(order.discount || 0),
    sub_total: Number(order.totalAmount),
    length: parcel.length,
    breadth: parcel.breadth,
    height: parcel.height,
    weight: parcel.weight,
  },
});

export const getShiprocketCouriers = (order, parcel) => {
  const params = new URLSearchParams({
    pickup_postcode: String(process.env.SHIPROCKET_PICKUP_POSTCODE),
    delivery_postcode: String(order.pincode),
    cod: order.paymentMethod === "COD" ? "1" : "0",
    weight: String(parcel.weight), length: String(parcel.length), breadth: String(parcel.breadth), height: String(parcel.height),
    declared_value: String(order.totalAmount), is_return: "0",
  });
  return request(`/courier/serviceability/?${params}`);
};

export const assignShiprocketAwb = (shipmentId, courierId) => request("/courier/assign/awb", { method: "POST", body: { shipment_id: Number(shipmentId), courier_id: Number(courierId) } });
export const scheduleShiprocketPickup = (shipmentId) => request("/courier/generate/pickup", { method: "POST", body: { shipment_id: [Number(shipmentId)] } });
export const generateShiprocketLabel = (shipmentId) => request("/courier/generate/label", { method: "POST", body: { shipment_id: [Number(shipmentId)] } });
export const cancelShiprocketShipment = (awb) => request("/orders/cancel/shipment/awbs", { method: "POST", body: { awbs: [String(awb)] } });
