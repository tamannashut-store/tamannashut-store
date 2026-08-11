import * as Sentry from "@sentry/react";

const dsn = String(import.meta.env.VITE_SENTRY_DSN || "").trim();
const enabled = import.meta.env.PROD && Boolean(dsn);
const sampleRate = Math.min(Math.max(Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.05), 0), 1);

Sentry.init({
  dsn,
  enabled,
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
  release: import.meta.env.VITE_APP_RELEASE,
  sendDefaultPii: false,
  integrations: enabled ? [Sentry.browserTracingIntegration()] : [],
  tracesSampleRate: sampleRate,
  tracePropagationTargets: [/^\//, /^https:\/\/(www\.)?tamannashut\.com\/api\//],
  beforeSend(event) {
    if (event.request?.url) event.request.url = event.request.url.split("?")[0];
    if (event.request) delete event.request.data;
    if (event.user) event.user = { id: event.user.id };
    return event;
  },
});

export { enabled as sentryEnabled };
