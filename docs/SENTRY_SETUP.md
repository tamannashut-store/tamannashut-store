# Sentry production setup

The application remains fully functional when Sentry is not configured. Monitoring activates only in production and only when a DSN is present.

## 1. Create projects

Create one Sentry JavaScript/React project and one Node.js/Express project. A DSN is a public ingestion URL; never add a Sentry auth token to frontend environment variables.

## 2. Backend environment variables

Add these to the Render backend service:

```text
SENTRY_DSN=<Node/Express project DSN>
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.05
```

Render provides `RENDER_GIT_COMMIT`, which is used automatically as the backend release identifier.

Use the repository start command (`npm start`) in Render. It preloads monitoring before Express, which is required for complete server instrumentation.

## 3. Frontend environment variables

Add these to the service that builds the React client, then trigger a new build:

```text
VITE_SENTRY_DSN=<React project DSN>
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_TRACES_SAMPLE_RATE=0.05
VITE_APP_RELEASE=<Git commit SHA or release name>
```

Vite variables are embedded at build time. Restarting without rebuilding will not apply them.

## 4. Privacy defaults

- Default personally identifiable information collection is disabled.
- Authorization headers, cookies, request bodies, and URL query strings are removed.
- Session Replay is not enabled.
- Only five percent of performance transactions are sampled by default.
- Passwords, payment details, webhook secrets, and environment variables must never be added as custom Sentry context.

## 5. Verify

After deployment, open Seller Centre > Operations. `Sentry monitoring` should show `Configured`. Confirm that ordinary browsing and checkout still work before creating a controlled test error in a staging environment.
