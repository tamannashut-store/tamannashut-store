import { passwordPolicyError } from './passwordPolicy.js';

const STAGING_SERVICE = 'srv-db9uqfqjnfac73dn85r0';
const disconnectedKeys = ['SHIPROCKET_EMAIL', 'SHIPROCKET_PASSWORD', 'RESEND_API_KEY', 'TWILIO_SID', 'TWILIO_AUTH', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];

export function stagingSandboxEnabled(env = process.env) {
  if (env.STAGING_SANDBOX !== 'true') return false;
  const uri = String(env.MONGO_URI || '');
  // MongoDB's multi-host connection strings cannot be parsed with URL.
  const database = uri.slice(uri.lastIndexOf('@') + 1).split('/')[1]?.split('?')[0];
  if (env.RENDER_SERVICE_ID !== STAGING_SERVICE || database !== 'tamannashut_staging'
    || !/^mongodb(?:\+srv)?:\/\/tamannashut_staging_app:/.test(uri)
    || !String(env.RAZORPAY_KEY_ID || '').startsWith('rzp_test_')
    || !env.RAZORPAY_KEY_SECRET || disconnectedKeys.some(key => env[key])) {
    throw new Error('Staging sandbox requires the dedicated staging service, database user/database, test payment keys and disconnected live integrations.');
  }
  if (String(env.STAGING_TEST_PASSWORD || '').length < 12 || passwordPolicyError(env.STAGING_TEST_PASSWORD)) {
    throw new Error('Set a separate staging test password of 12–128 characters including letters and numbers.');
  }
  return true;
}

export function stagingDelivery(postcode, env = process.env) {
  if (!stagingSandboxEnabled(env)) return null;
  const pin = String(postcode || '').trim();
  if (pin !== '711310') throw Object.assign(new Error('Sandbox delivery supports test pincode 711310 only.'), { status: 400 });
  return { pincode: pin, city: 'Test City', state: 'West Bengal', serviceable: true, sandbox: true };
}

export const stagingShopperEmail = 'shopper@example.test';

export async function seedStagingSandbox({ Product, User, hashPassword, env = process.env }) {
  if (!stagingSandboxEnabled(env)) return false;
  const password = await hashPassword(env.STAGING_TEST_PASSWORD, 12);
  await User.updateOne({ email: stagingShopperEmail }, { $setOnInsert: {
    name: 'Sandbox Shopper', email: stagingShopperEmail, password, passwordLoginEnabled: true,
    accountType: 'customer', isAdmin: false, emailVerifiedAt: new Date(),
  } }, { upsert: true, runValidators: true });
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750"><rect width="600" height="750" fill="#e8dcc6"/><text x="300" y="330" text-anchor="middle" font-size="42" fill="#355e3b">TEST PRODUCT</text><text x="300" y="400" text-anchor="middle" font-size="24" fill="#355e3b">Not for sale</text></svg>';
  for (const [slug, name, sku, price] of [
    ['sandbox-test-outfit', 'TEST ONLY — Sample Outfit', 'SANDBOX-OUTFIT-M', 100],
    ['sandbox-test-accessory', 'TEST ONLY — Sample Accessory', 'SANDBOX-ACCESSORY-ONE', 50],
  ]) {
    await Product.updateOne({ slug }, { $setOnInsert: {
      slug, name, baseSku: sku, price, mrp: price, category: 'general', status: 'active',
      approvalStatus: 'not_required', productType: 'variable', optionLabel: 'Size',
      description: 'Synthetic checkout fixture. No real product, shipping or fulfilment.',
      images: [{ url: `data:image/svg+xml,${encodeURIComponent(svg)}`, public_id: slug, color: 'Green' }],
      variants: [{ sku, size: 'M', color: 'Green', stock: 100, price, active: true }],
      sizeStock: [{ size: 'M', stock: 100 }],
    } }, { upsert: true, runValidators: true });
  }
  return true;
}
