import Order from "../models/Order.js";
import { syncOrderSettlementsSafely } from "../services/sellerSettlementService.js";

export async function backfillSellerSettlements() {
  let processed = 0;
  const cursor = Order.find({ "products.sellerId": { $exists: true } }).cursor();
  for await (const order of cursor) {
    const settlements = await syncOrderSettlementsSafely(order);
    if (settlements.length) processed += 1;
  }
  return processed;
}
