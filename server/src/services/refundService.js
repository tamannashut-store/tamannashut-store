const razorpayRefundRequest = async ({ paymentId, amount, reason, orderId, idempotencyKey }) => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw Object.assign(new Error("Razorpay refund credentials are not configured"), { status: 503 });
  }
  const credentials = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/json", "X-Refund-Idempotency": idempotencyKey },
    body: JSON.stringify({ amount: Math.round(Number(amount) * 100), speed: "normal", receipt: idempotencyKey, notes: { reason, order_id: String(orderId) } }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error?.description || data.error?.reason || "Razorpay refund request failed"), { status: response.status >= 500 ? 502 : 400 });
  return data;
};

export const createRazorpayRefund = razorpayRefundRequest;
