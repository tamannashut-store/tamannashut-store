// Build the replacement before removing the legacy index so present emails
// remain unique while multiple mobile-only customers can omit email.
export async function prepareCustomerEmailIndex(collection) {
  await collection.createIndex({ email: 1 }, { name: "user_email_unique", unique: true, partialFilterExpression: { email: { $type: "string" } } });
  const indexes = await collection.indexes();
  for (const index of indexes) {
    if (index.unique && !index.partialFilterExpression && !index.sparse && Object.keys(index.key).length === 1 && index.key.email === 1) await collection.dropIndex(index.name);
  }
}
