export const PRESENCE_WINDOW_MS = 90_000;
export const validPresenceVisitor = (value) => typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);

export async function recordProductPresence(model, productId, visitorId, now = new Date()) {
  const key = `${productId}:${visitorId}`;
  const update = { productId, visitorId, lastSeen: now, expiresAt: new Date(now.getTime() + PRESENCE_WINDOW_MS) };
  try {
    await model.updateOne({ _id: key }, { $set: update }, { upsert: true });
  } catch (error) {
    // Concurrent heartbeats from duplicate tabs can race on the first insert.
    if (error.code !== 11000) throw error;
    await model.updateOne({ _id: key }, { $set: update });
  }
  // TTL cleanup is asynchronous; explicitly exclude stale records and this browser.
  return model.countDocuments({ productId, visitorId: { $ne: visitorId }, lastSeen: { $gt: new Date(now.getTime() - PRESENCE_WINDOW_MS) } });
}
