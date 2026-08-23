# Storefront client

This directory contains the React storefront and the administration and seller interfaces for Tamanna's Hut. Vite builds the application, Tailwind CSS provides the design system, and Playwright coverage is maintained from the repository root.

## Commands

Run these commands from the repository root:

```bash
npm run dev --prefix client
npm run lint --prefix client
npm run build --prefix client
npm run preview --prefix client
```

Local development requires `VITE_API_URL` in the root `.env` file. Production requests use the `/api` rewrite configured in `vercel.json`. Optional Sentry variables are documented in [`../docs/SENTRY_SETUP.md`](../docs/SENTRY_SETUP.md).

Project setup, testing, deployment notes, and the complete environment-variable reference are in the [main README](../README.md).
