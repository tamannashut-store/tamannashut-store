const retryableStatuses = new Set([408, 425, 429, 500, 502, 503, 504]);

export const isCanceledRequest = (error) => (
  error?.code === "ERR_CANCELED"
  || error?.name === "AbortError"
  || error?.name === "CanceledError"
);

export const isRetryableRequestError = (error) => {
  if (isCanceledRequest(error)) return false;
  if (!error?.response) return true;
  return retryableStatuses.has(Number(error.response.status));
};

const abortableDelay = (milliseconds, signal) => new Promise((resolve, reject) => {
  if (signal?.aborted) {
    reject(Object.assign(new Error("Request canceled"), { name: "AbortError" }));
    return;
  }

  const handleAbort = () => {
    globalThis.clearTimeout(timer);
    reject(Object.assign(new Error("Request canceled"), { name: "AbortError" }));
  };
  const timer = globalThis.setTimeout(() => {
    signal?.removeEventListener("abort", handleAbort);
    resolve();
  }, milliseconds);
  signal?.addEventListener("abort", handleAbort, { once: true });
});

export const requestWithRetry = async (request, {
  attempts = 3,
  delays = [2000, 5000],
  signal,
  onRetry,
} = {}) => {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (signal?.aborted) throw Object.assign(new Error("Request canceled"), { name: "AbortError" });
    try {
      return await request(attempt);
    } catch (error) {
      lastError = error;
      if (attempt >= attempts || !isRetryableRequestError(error)) throw error;
      onRetry?.(attempt, error);
      await abortableDelay(delays[attempt - 1] ?? delays.at(-1) ?? 0, signal);
    }
  }

  throw lastError;
};
