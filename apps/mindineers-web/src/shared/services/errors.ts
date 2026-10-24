export type ErrorCode =
  | "unavailable"
  | "unauthorized"
  | "forbidden"
  | "not-found"
  | "conflict"
  | "validation"
  | "rate-limit"
  | "offline"
  | "timeout"
  | "cancelled"
  | "storage"
  | "unknown";
const messages: Record<ErrorCode, string> = {
  unavailable: "This service is not connected yet.",
  unauthorized: "Sign in again to continue.",
  forbidden: "You do not have access to this resource.",
  "not-found": "This resource could not be found.",
  conflict: "A newer version exists. Review it before saving.",
  validation: "The supplied data could not be validated.",
  "rate-limit": "Too many requests. Try again later.",
  offline: "You are offline. Your local work remains available.",
  timeout: "The request timed out. Try again when the service is available.",
  cancelled: "The request was cancelled.",
  storage:
    "Changes could not be saved on this device. Export your work before leaving.",
  unknown: "Something went wrong. Your saved data has not been cleared.",
};
export class ServiceError extends Error {
  readonly code: ErrorCode;
  readonly retryable: boolean;
  constructor(code: ErrorCode) {
    super(messages[code]);
    this.name = "ServiceError";
    this.code = code;
    this.retryable = [
      "timeout",
      "offline",
      "rate-limit",
      "unavailable",
      "unknown",
    ].includes(code);
  }
}
export function normalizeError(error: unknown): ServiceError {
  if (error instanceof ServiceError) return error;
  if (error instanceof Error && error.name === "AbortError")
    return new ServiceError("cancelled");
  // Do not render raw provider/server errors: they can include payloads or credentials.
  return new ServiceError("unknown");
}
