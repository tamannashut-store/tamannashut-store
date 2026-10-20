# Seller passkeys

Active marketplace sellers can add passkeys at **My seller profile → Sign-in methods**.
They first confirm their current password and a fresh email code, then personally complete
their phone/computer's passkey prompt. Neither biometrics nor device PINs reach the server.
Passkeys are optional. Existing password + email-code login remains available for recovery;
administrator login is unchanged. Pending/rejected/suspended/closed accounts cannot use
seller passkey endpoints. Seller approval, listing ownership, regional restrictions and
settlement checks are unchanged.

## Configuration

Production defaults require no new environment values:

- RP ID: `tamannashut.com`
- Origins: `https://www.tamannashut.com,https://tamannashut.com`

For a dedicated local/staging environment only, set `PASSKEY_RP_ID` and
`PASSKEY_ORIGINS` to that environment's hostname and exact frontend origin(s).
Origins must use HTTPS (HTTP is accepted only for an explicit `localhost` RP).
Never broaden production origins to staging, wildcard hosts or request Host headers.
Cross-origin API deployments still verify the **frontend** origin.
Passkeys from localhost/staging will not work on production.

## Security and storage

`SellerPasskey` stores the public credential, signature counter, seller ID and a user-chosen
device label. A globally unique credential ID prevents cross-account reassignment.
`PasskeyChallenge` stores server-generated, hashed 256-bit flow tokens, short-lived challenges,
attempt-limited hashed email codes and a TTL index. Application expiry checks do not rely on
MongoDB's asynchronous TTL cleanup. Registration and email-management challenges bind to the
seller's ID and session version. Verification atomically consumes each challenge before use.

The WebAuthn library verifies challenge, RP ID, exact origin, user presence, required user
verification and signatures. Discoverable credentials are required at enrollment; login is
account-neutral until the signed credential is verified. The user handle must match the
credential owner. Authentication re-checks seller status/session version, uses a compare-and-set
counter update and rejects keys deleted during verification. All writes have the existing auth
rate limiter; security-code delivery also has a one-minute per-account cooldown. Credential
management requires password + fresh email code even with a valid session. Adding, removal and
sign-in emit audit events without credential secrets. Existing email fallback remains available.

## Validation

`tests/seller-passkeys.test.js` uses a software authenticator with real EC signatures and the
production WebAuthn verifier (in-memory database adapters only). It covers successful enrollment
and login, missing user verification, wrong origins/challenges/signatures/handles, replay,
counter rollback, email attempts/expiry/session binding, account status and removal.
The browser test covers the device prompt via a virtual test authenticator only; no real seller
credential is created by tests. Each seller must personally enroll their own passkey after release.
