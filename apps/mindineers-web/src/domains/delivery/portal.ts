import { ServiceError } from "../../shared/services/errors";
import { validateDataTree } from "../../shared/services/input-safety";
export interface PortalSession {
  customerId: string;
  displayName: string;
  expiresAt: string;
  permissions: string[];
}
export interface PortalDelivery {
  id: string;
  revision: string;
  customerId: string;
  name: string;
  status: string;
  due: string;
  updates: { id: string; text: string; at: string }[];
  documents: { id: string; name: string; body: string }[];
}
export interface PortalResponse {
  deliveryId: string;
  revision: string;
  decision: "Accept" | "Request changes";
  message: string;
  requestId: string;
}
export interface PortalService {
  available: boolean;
  session(signal: AbortSignal): Promise<unknown>;
  list(signal: AbortSignal): Promise<unknown>;
  respond(input: PortalResponse, signal: AbortSignal): Promise<unknown>;
  signOut(signal: AbortSignal): Promise<void>;
}
const unavailable = async (): Promise<never> => {
  throw new ServiceError("unavailable");
};
export const disconnectedPortal: PortalService = {
  available: false,
  session: unavailable,
  list: unavailable,
  respond: unavailable,
  signOut: unavailable,
};
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown): v is string =>
  typeof v === "string" && v.length <= 100000;
export function checkedPortalSession(value: unknown): PortalSession {
  validateDataTree(value);
  if (
    !object(value) ||
    !text(value.customerId) ||
    !value.customerId ||
    !text(value.displayName) ||
    !text(value.expiresAt) ||
    !Number.isFinite(Date.parse(value.expiresAt)) ||
    Date.parse(value.expiresAt) <= Date.now() ||
    !Array.isArray(value.permissions) ||
    !value.permissions.every(text)
  )
    throw new ServiceError("unauthorized");
  return {
    customerId: value.customerId,
    displayName: value.displayName,
    expiresAt: value.expiresAt,
    permissions: value.permissions,
  };
}
export function checkedPortalDeliveries(
  value: unknown,
  session: PortalSession,
): PortalDelivery[] {
  validateDataTree(value);
  if (Date.parse(session.expiresAt) <= Date.now())
    throw new ServiceError("unauthorized");
  if (!session.permissions.includes("delivery:read"))
    throw new ServiceError("forbidden");
  if (!Array.isArray(value) || value.length > 1000)
    throw new ServiceError("validation");
  const result = value.map((v: unknown): PortalDelivery => {
    if (
      !object(v) ||
      !text(v.id) ||
      !v.id ||
      !text(v.revision) ||
      !v.revision ||
      v.customerId !== session.customerId ||
      !text(v.name) ||
      !text(v.status) ||
      !text(v.due) ||
      !Array.isArray(v.updates) ||
      v.updates.length > 1000 ||
      !Array.isArray(v.documents) ||
      v.documents.length > 100
    )
      throw new ServiceError("validation");
    const updates = v.updates.map((u: unknown) => {
      if (!object(u) || !text(u.id) || !text(u.text) || !text(u.at))
        throw new ServiceError("validation");
      return { id: u.id, text: u.text, at: u.at };
    });
    const documents = v.documents.map((d: unknown) => {
      if (!object(d) || !text(d.id) || !text(d.name) || !text(d.body))
        throw new ServiceError("validation");
      return { id: d.id, name: d.name, body: d.body };
    });
    for (const records of [updates, documents])
      if (new Set(records.map((r) => r.id)).size !== records.length)
        throw new ServiceError("validation");
    // Explicit DTO construction excludes internal notes, other fields and permission claims.
    return {
      id: v.id,
      revision: v.revision,
      customerId: session.customerId,
      name: v.name,
      status: v.status,
      due: v.due,
      updates,
      documents,
    };
  });
  if (new Set(result.map((r) => r.id)).size !== result.length)
    throw new ServiceError("validation");
  return result;
}
export function checkedPortalAcknowledgement(
  value: unknown,
  input: PortalResponse,
): string {
  if (
    !object(value) ||
    value.requestId !== input.requestId ||
    value.deliveryId !== input.deliveryId ||
    value.revision !== input.revision ||
    !text(value.receiptId) ||
    !value.receiptId
  )
    throw new ServiceError("validation");
  return value.receiptId;
}

/** Do not request customer records until the session grants delivery access. */
export async function loadPortal(service: PortalService, signal: AbortSignal) {
  const session = checkedPortalSession(await service.session(signal));
  if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
  if (!session.permissions.includes("delivery:read"))
    throw new ServiceError("forbidden");
  const deliveries = checkedPortalDeliveries(
    await service.list(signal),
    session,
  );
  if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
  return { session, deliveries };
}
