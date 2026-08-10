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

export const resolveShiprocketPostcode = async (postcode) => {
  const pin = String(postcode || "").trim();
  if (!/^\d{6}$/.test(pin)) throw Object.assign(new Error("Enter a valid 6-digit pincode"), { status: 400 });
  const data = await request(`/open/postcode/details?postcode=${encodeURIComponent(pin)}`);
  const rawDetails = data.postcode_details || data.data?.postcode_details || data.data || data;
  const details = Array.isArray(rawDetails) ? rawDetails[0] || {} : rawDetails;
  const city = String(details.city || details.district || details.post_office || "").trim();
  const state = String(details.state || details.state_name || "").trim();
  if (!city || !state) throw Object.assign(new Error("This pincode could not be verified for delivery"), { status: 400 });
  return { pincode: pin, city, state };
};

export const verifyShiprocketDeliveryPostcode = async (postcode, cod = false) => {
  const locality = await resolveShiprocketPostcode(postcode);
  const params = new URLSearchParams({ pickup_postcode: String(process.env.SHIPROCKET_PICKUP_POSTCODE), delivery_postcode: locality.pincode, cod: cod ? "1" : "0", weight: "0.5", declared_value: "100", is_return: "0" });
  const data = await request(`/courier/serviceability/?${params}`);
  const couriers = data.data?.available_courier_companies || [];
  if (!couriers.length) throw Object.assign(new Error("Delivery is currently unavailable for this pincode"), { status: 400 });
  return { ...locality, serviceable: true };
};

const getConfiguredPickupAddress = async () => {
  const data = await request("/settings/company/pickup");
  const locations = data.data?.shipping_address || data.shipping_address || [];
  const configured = String(process.env.SHIPROCKET_PICKUP_LOCATION || "").trim().toLowerCase();
  const location = locations.find((item) => String(item.pickup_location || item.name || "").trim().toLowerCase() === configured);
  if (!location) throw Object.assign(new Error("Configured Shiprocket pickup location could not be found"), { status: 502 });
  return location;
};

export const createShiprocketReturn = async (order, parcel) => {
  const seller = await getConfiguredPickupAddress();
  return request("/shipments/create/return-shipment", { method: "POST", body: {
    order_id: `R${orderReference(order)}`,
    order_date: orderDate(new Date()),
    pickup_customer_name: String(order.customerName || "Customer").slice(0, 50), pickup_last_name: "", pickup_address: String(order.address || "").slice(0, 80), pickup_address_2: String(order.address || "").slice(80, 160), pickup_city: order.city, pickup_state: order.state || order.shipping?.destinationState, pickup_country: "India", pickup_pincode: Number(order.pincode), pickup_email: order.email, pickup_phone: cleanPhone(order.phone), pickup_isd_code: "91",
    shipping_customer_name: seller.name || "Tamanna's Hut", shipping_last_name: "", shipping_address: seller.address, shipping_address_2: seller.address_2 || "", shipping_city: seller.city, shipping_state: seller.state, shipping_country: seller.country || "India", shipping_pincode: Number(seller.pin_code || seller.pincode), shipping_email: seller.email || process.env.SHIPROCKET_EMAIL, shipping_phone: cleanPhone(seller.phone), shipping_isd_code: "91",
    order_items: order.products.map((item) => ({ sku: String(item.sku || item._id).slice(0, 50), name: String(item.name || "Product").slice(0, 100), units: Number(item.qty), selling_price: Number(item.price), discount: 0, qc_enable: false })),
    payment_method: "Prepaid", total_discount: 0, sub_total: Number(order.totalAmount), length: parcel.length, breadth: parcel.breadth, height: parcel.height, weight: parcel.weight, request_pickup: false,
  } });
};

export const assignShiprocketAwb = (shipmentId, courierId) => request("/courier/assign/awb", { method: "POST", body: { shipment_id: Number(shipmentId), courier_id: Number(courierId) } });
export const scheduleShiprocketPickup = (shipmentId) => request("/courier/generate/pickup", { method: "POST", body: { shipment_id: [Number(shipmentId)] } });
export const generateShiprocketLabel = (shipmentId) => request("/courier/generate/label", { method: "POST", body: { shipment_id: [Number(shipmentId)] } });
export const cancelShiprocketShipment = (awb) => request("/orders/cancel/shipment/awbs", { method: "POST", body: { awbs: [String(awb)] } });
