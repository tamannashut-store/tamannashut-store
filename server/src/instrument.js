import "dotenv/config";
import * as Sentry from "@sentry/node";

const dsn = String(process.env.SENTRY_DSN || "").trim();
const enabled = process.env.NODE_ENV === "production" && Boolean(dsn);
const sampleRate = Math.min(Math.max(Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.05), 0), 1);

const scrubEvent = (event) => {
  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    if (event.request.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.Authorization;
      delete event.request.headers.cookie;
      delete event.request.headers.Cookie;
    }
  }
  if (event.user) event.user = { id: event.user.id };
  return event;
};

Sentry.init({
  dsn,
  enabled,
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
  release: process.env.RENDER_GIT_COMMIT || process.env.SENTRY_RELEASE,
  sendDefaultPii: false,
  tracesSampleRate: sampleRate,
  beforeSend: scrubEvent,
});

export { enabled as sentryEnabled };
