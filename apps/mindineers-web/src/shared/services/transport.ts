import { ServiceError } from "./errors";
export interface RequestOptions<T> {
  path: string;
  decode: (value: unknown) => T;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
}
export interface Transport {
  request<T>(options: RequestOptions<T>): Promise<T>;
}
export const disconnectedTransport: Transport = {
  async request() {
    throw new ServiceError("unavailable");
  },
};
/** Opt-in same-origin transport. Nothing enables this adapter in the local app.
 * Mutations require a caller-supplied CSRF token from the future identity service.
 * No automatic retries: an interrupted write must not be silently duplicated.
 */
export function createHttpTransport(
  origin: string,
  fetcher: typeof fetch = fetch,
  csrfToken?: () => string | null,
): Transport {
  const base = new URL(origin);
  if (
    !["http:", "https:"].includes(base.protocol) ||
    base.username ||
    base.password
  )
    throw new ServiceError("validation");
  return {
    async request<T>(options: RequestOptions<T>): Promise<T> {
      if (!options.path.startsWith("/api/") || options.path.startsWith("//"))
        throw new ServiceError("validation");
      const url = new URL(options.path, base);
      if (
        url.origin !== base.origin ||
        !url.pathname.startsWith("/api/") ||
        url.hash
      )
        throw new ServiceError("validation");
      const method = options.method ?? "GET",
        headers = new Headers({ Accept: "application/json" });
      const timeout = options.timeoutMs ?? 15000;
      if (!Number.isFinite(timeout) || timeout < 1 || timeout > 120000)
        throw new ServiceError("validation");
      if (options.signal?.aborted) throw new ServiceError("cancelled");
      if (method !== "GET") {
        const token = csrfToken?.();
        if (!token) throw new ServiceError("unauthorized");
        headers.set("X-CSRF-Token", token);
      }
      let body: string | undefined;
      if (options.body !== undefined) {
        if (method === "GET") throw new ServiceError("validation");
        body = JSON.stringify(options.body);
        headers.set("Content-Type", "application/json");
      }
      const controller = new AbortController();
      let timedOut = false;
      const cancel = () => controller.abort();
      options.signal?.addEventListener("abort", cancel, { once: true });
      const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeout);
      try {
        const response = await fetcher(url, {
          method,
          headers,
          credentials: "same-origin",
          redirect: "error",
          cache: "no-store",
          signal: controller.signal,
          ...(body === undefined ? {} : { body }),
        });
        if (!response.ok) {
          const codes = {
            401: "unauthorized",
            403: "forbidden",
            404: "not-found",
            409: "conflict",
            422: "validation",
            429: "rate-limit",
          } as const;
          throw new ServiceError(
            codes[response.status as keyof typeof codes] ?? "unavailable",
          );
        }
        if (!response.headers.get("content-type")?.includes("application/json"))
          throw new ServiceError("validation");
        const declared = Number(response.headers.get("content-length") ?? 0);
        if (declared > 10 * 1024 * 1024) throw new ServiceError("validation");
        const reader = response.body?.getReader();
        let raw = "";
        if (reader) {
          const decoder = new TextDecoder();
          let bytes = 0;
          try {
            while (true) {
              const part = await reader.read();
              if (part.done) break;
              bytes += part.value.byteLength;
              if (bytes > 10 * 1024 * 1024) {
                await reader.cancel();
                throw new ServiceError("validation");
              }
              raw += decoder.decode(part.value, { stream: true });
            }
            raw += decoder.decode();
          } finally {
            reader.releaseLock();
          }
        }
        try {
          return options.decode(JSON.parse(raw) as unknown);
        } catch {
          throw new ServiceError("validation");
        }
      } catch (error) {
        if (error instanceof ServiceError) throw error;
        if (timedOut) throw new ServiceError("timeout");
        if (options.signal?.aborted) throw new ServiceError("cancelled");
        throw new ServiceError("offline");
      } finally {
        clearTimeout(timer);
        options.signal?.removeEventListener("abort", cancel);
      }
    },
  };
}
