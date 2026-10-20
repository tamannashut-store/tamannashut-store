import { test, expect } from '@playwright/test';
import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';

test('seller enrolls a virtual passkey and signs in using device unlock', async ({ page, baseURL }) => {
  // Only the disposable local browser authenticator is used; no production account/credential.
  const url = new URL(baseURL); url.hostname = 'localhost';
  const origin = url.origin, userID = new Uint8Array(32).fill(7);
  const session = { token: 'test-only-session', user: { id: 'seller-passkey-test', accountType: 'seller', sellerRole: 'member', sellerAccessStatus: 'active', name: 'Test Seller', email: 'seller@example.com' } };
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', { options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true } });
  let stored, registrationChallenge, authenticationChallenge, loggedIn = false;
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const body = route.request().method() === 'POST' ? route.request().postDataJSON() : {};
    let result = {};
    if (path.endsWith('/seller-profile/me')) result = { account: session.user, profile: { tradeName: 'Test Store', verificationStatus: 'approved', completeness: { complete: true }, bankVerification: {}, gstVerification: {} } };
    else if (path.endsWith('/seller-passkeys/manage')) {
      expect(body.password).toBe('test-password'); result = { challengeToken: 'email-step-up', maskedEmail: 'se***@example.com' };
    } else if (path.endsWith('/seller-passkeys/confirm')) {
      expect(body.code).toBe('123456'); expect(body.challengeToken).toBe('email-step-up');
      const options = await generateRegistrationOptions({ rpID: 'localhost', rpName: 'Test Seller Centre', userID, userName: session.user.email, attestationType: 'none', authenticatorSelection: { residentKey: 'required', userVerification: 'required' } });
      registrationChallenge = options.challenge; result = { options, challengeToken: 'registration-step' };
    } else if (path.endsWith('/seller-passkeys/register')) {
      expect(body.challengeToken).toBe('registration-step');
      const verified = await verifyRegistrationResponse({ response: body.credential, expectedChallenge: registrationChallenge, expectedRPID: 'localhost', expectedOrigin: origin, requireUserVerification: true });
      expect(verified.verified).toBe(true); stored = verified.registrationInfo.credential; result = { message: 'Passkey added.' };
    } else if (path.endsWith('/seller-passkeys/options')) {
      const options = await generateAuthenticationOptions({ rpID: 'localhost', userVerification: 'required' }); authenticationChallenge = options.challenge;
      result = { options, challengeToken: 'authentication-step' };
    } else if (path.endsWith('/seller-passkeys/authenticate')) {
      expect(body.challengeToken).toBe('authentication-step');
      const verified = await verifyAuthenticationResponse({ response: body.credential, credential: stored, expectedChallenge: authenticationChallenge, expectedOrigin: origin, expectedRPID: 'localhost', requireUserVerification: true });
      expect(verified.verified).toBe(true); loggedIn = true; result = session;
    } else if (path.endsWith('/seller-passkeys')) result = { passkeys: stored ? [{ id: stored.id, name: 'Test phone', createdAt: '2026-10-20T00:00:00Z' }] : [] };
    else if (path.endsWith('/cart')) result = { items: [] };
    else if (path.endsWith('/store-stats')) result = { deliveredOrders: 0, registeredCustomers: 0, activeBags: 0 };
    else if (path.endsWith('/products')) result = [];
    await route.fulfill({ json: result, headers: { 'Access-Control-Allow-Origin': '*' } });
  });
  await page.goto(`${origin}/admin-login`);
  await page.evaluate(value => localStorage.setItem('user', JSON.stringify(value)), session);
  await page.goto(`${origin}/seller/profile`);
  await page.getByRole('button', { name: 'Add a passkey', exact: true }).click();
  await page.getByLabel('Passkey name', { exact: true }).fill('Test phone');
  await page.getByLabel('Current password', { exact: true }).first().fill('test-password');
  await page.getByRole('button', { name: 'Send confirmation code', exact: true }).click();
  await page.getByLabel('Email code sent to se***@example.com', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Verify email code', exact: true }).click();
  await page.getByRole('button', { name: 'Create passkey on my device', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Passkey added');
  await expect(page.getByRole('button', { name: 'Remove Test phone', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.getByRole('button', { name: 'Seller sign in with passkey', exact: true }).click();
  await page.getByRole('button', { name: 'Continue with device unlock', exact: true }).click();
  await expect(page).toHaveURL(`${origin}/seller/dashboard`);
  expect(loggedIn).toBe(true);
  await cdp.detach();
});
