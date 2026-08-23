# Tamanna's Hut ecommerce platform

Tamanna's Hut is a production ecommerce application for children's clothing. The repository contains the customer storefront, customer accounts and checkout, an administration centre, and isolated marketplace-seller workflows.

## Architecture

- `client/` — React and Vite storefront, customer account, administration, and seller interfaces
- `server/src/` — Express API, MongoDB models, payments, fulfilment, notifications, and marketplace services
- `tests/` — server unit tests and Playwright browser tests
- `docs/` — operational notes for integrations and marketplace workflows
- `.github/workflows/quality-gate.yml` — pull-request and production quality checks

Product media is uploaded to Cloudinary. Razorpay handles online payments, Shiprocket provides shipping services, Resend sends transactional email, and Twilio Verify can verify customer phone numbers. Optional Sentry monitoring is privacy-filtered on both the client and server.

## Local development

Use Node.js 22 and a local or hosted MongoDB database.

```bash
npm ci
npm ci --prefix client
```

Copy `.env.example` to `.env`, replace the development placeholders, then start both applications:

```bash
npm run dev
```

The storefront runs on `http://localhost:5173`; the API defaults to `http://localhost:5000`. Never commit `.env`, provider credentials, access tokens, customer exports, or generated uploads.

## Quality checks

Run the same checks used by the production quality gate before opening a pull request:

```bash
npm run test:unit
npm run lint --prefix client
npm run build --prefix client
npm run test:e2e
```

The Playwright command builds the client first and runs browser tests against the local application. Failure screenshots, traces, and HTML reports are generated locally and are ignored by Git.

## Deployment

The Express API is deployed to Render with `npm start`. The Vite client is deployed from `client/` to Vercel; `client/vercel.json` proxies API, sitemap, and product-feed requests to the backend.

Production readiness can be checked without exposing configuration values:

- `/api/health/live` reports that the server process is running.
- `/api/health/ready` reports whether the database connection is ready.
- Seller Centre → Operations reports whether required integrations are configured.

All production changes should pass `.github/workflows/quality-gate.yml` on a pull request before merging to `main`.

## Operational guides

- [Seller onboarding and encrypted verification data](docs/SELLER_ONBOARDING.md)
- [Marketplace settlement ledger](docs/MARKETPLACE_SETTLEMENTS.md)
- [Customer phone verification and first-order discount](docs/PHONE_VERIFICATION.md)
- [Sentry production setup](docs/SENTRY_SETUP.md)

These guides describe the current application boundaries. Format checks for GSTIN, PAN, bank accounts, and IFSC codes are not a substitute for verification by an authorised provider.
