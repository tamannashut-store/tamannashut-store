const money = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export const welcomePromotionDecision = ({ subtotal, existingDiscount = 0, eligible = false }) => {
  const welcomeDiscount = eligible ? money(Number(subtotal) * 0.10) : 0;
  const applied = welcomeDiscount > Number(existingDiscount || 0);
  return { applied, discount: applied ? welcomeDiscount : money(existingDiscount || 0) };
};
