import test from 'node:test';
import assert from 'node:assert/strict';
import { stagingSandboxEnabled, stagingDelivery, seedStagingSandbox } from '../server/src/utils/stagingSandbox.js';
const fixture = () => ({ STAGING_SANDBOX: 'true', RENDER_SERVICE_ID: 'srv-db9uqfqjnfac73dn85r0', MONGO_URI: 'mongodb://tamannashut_staging_app:test@host1:27017,host2:27017/tamannashut_staging?ssl=true', RAZORPAY_KEY_ID: 'rzp_test_fixture', RAZORPAY_KEY_SECRET: 'test-only-secret', STAGING_TEST_PASSWORD: 'TestOnlyPassword1234' });

test('sandbox defaults off without changing normal delivery', () => {
  assert.equal(stagingSandboxEnabled({}), false);
  assert.equal(stagingDelivery('711310', {}), null);
});
test('sandbox refuses production service, database, user and live payment keys', () => {
  for (const override of [{ RENDER_SERVICE_ID: 'production' }, { MONGO_URI: 'mongodb://tamannashut_staging_app:test@host/tamannashut' }, { MONGO_URI: 'mongodb://admin:test@host/tamannashut_staging' }, { RAZORPAY_KEY_ID: 'rzp_live_fixture' }]) assert.throws(() => stagingSandboxEnabled({ ...fixture(), ...override }));
});
test('sandbox refuses shipping, messaging and media credentials', () => {
  for (const key of ['SHIPROCKET_EMAIL', 'SHIPROCKET_PASSWORD', 'RESEND_API_KEY', 'TWILIO_SID', 'TWILIO_AUTH', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) assert.throws(() => stagingSandboxEnabled({ ...fixture(), [key]: 'configured' }));
});
test('sandbox test login requires an independently configured strong password', () => {
  for (const password of ['', 'short1', '1234567890123']) assert.throws(() => stagingSandboxEnabled({ ...fixture(), STAGING_TEST_PASSWORD: password }));
});
test('sandbox delivery verifies only the documented synthetic address', () => {
  const result = stagingDelivery('711310', fixture());
  assert.equal(result.sandbox, true); assert.equal(result.city, 'Test City');
  assert.throws(() => stagingDelivery('400001', fixture()), error => error.status === 400);
});
test('unsafe sandbox configuration cannot seed accounts or catalogue', async () => {
  let writes=0;
  await assert.rejects(seedStagingSandbox({ env: { ...fixture(), RAZORPAY_KEY_ID:'rzp_live_bad' }, Product:{updateOne:()=>{writes++;}},User:{updateOne:()=>{writes++;}},hashPassword:async()=> 'hash' }));
  assert.equal(writes,0);
});
test('sandbox seeds a customer without admin access and preserves existing records', async () => {
  const accounts=[],products=[];
  await seedStagingSandbox({env:fixture(),hashPassword:async()=> 'hashed-not-plaintext',User:{updateOne:async(...args)=>accounts.push(args)},Product:{updateOne:async(...args)=>products.push(args)}});
  assert.equal(accounts[0][1].$setOnInsert.isAdmin,false);
  assert.equal(accounts[0][1].$setOnInsert.accountType,'customer');
  assert.equal(accounts[0][1].$setOnInsert.password,'hashed-not-plaintext');
  assert.equal(accounts[0][1].$set,undefined);
  assert.equal(products.length,2);
  assert.ok(products.every(([, update])=>update.$set===undefined && update.$setOnInsert.name.startsWith('TEST ONLY')));
});
