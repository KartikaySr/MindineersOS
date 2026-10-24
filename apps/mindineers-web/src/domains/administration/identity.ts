import { ServiceError } from "../../shared/services/errors";
export type IdentityIntent = "sign-in" | "sign-up" | "recovery" | "join";
export interface IdentityInput {
  intent: IdentityIntent;
  email: string;
  name: string;
  invitation: string;
}
export interface IdentitySession {
  id: string;
  displayName: string;
  expiresAt: string;
  permissions: string[];
}
export type IdentityResult =
  | { kind: "challenge"; id: string; expiresAt: string; destination: string }
  | { kind: "authenticated"; session: IdentitySession }
  | { kind: "recovery-sent" }
  | {
      kind: "invitation";
      id: string;
      organization: string;
      role: string;
      expiresAt: string;
    };
export interface IdentityService {
  available: boolean;
  begin(input: IdentityInput, signal: AbortSignal): Promise<IdentityResult>;
  verify(
    id: string,
    code: string,
    signal: AbortSignal,
  ): Promise<IdentityResult>;
  acceptInvitation(id: string, signal: AbortSignal): Promise<IdentityResult>;
  signOut(signal: AbortSignal): Promise<void>;
}
const unavailable = async (): Promise<never> => {
  throw new ServiceError("unavailable");
};
export const disconnectedIdentity: IdentityService = {
  available: false,
  begin: unavailable,
  verify: unavailable,
  acceptInvitation: unavailable,
  signOut: unavailable,
};
export function validateIdentityInput(input: IdentityInput): void {
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email) ||
    input.email.length > 254
  )
    throw new ServiceError("validation");
  if (
    input.intent === "sign-up" &&
    (!input.name.trim() || input.name.length > 120)
  )
    throw new ServiceError("validation");
  if (
    input.intent === "join" &&
    (!input.invitation.trim() || input.invitation.length > 500)
  )
    throw new ServiceError("validation");
}
export function isExpired(expiresAt: string, now = Date.now()): boolean {
  return (
    !Number.isFinite(Date.parse(expiresAt)) || Date.parse(expiresAt) <= now
  );
}
export function checkedIdentityResult(value: unknown): IdentityResult {
  const obj = (x: unknown): x is Record<string, unknown> =>
    !!x && typeof x === "object" && !Array.isArray(x);
  const text = (x: unknown): x is string =>
    typeof x === "string" && x.length > 0 && x.length <= 1000;
  if (!obj(value)) throw new ServiceError("validation");
  if (value.kind === "recovery-sent") return { kind: "recovery-sent" };
  if (value.kind === "challenge") {
    if (!text(value.id) || !text(value.expiresAt) || !text(value.destination))
      throw new ServiceError("validation");
    if (isExpired(value.expiresAt)) throw new ServiceError("unauthorized");
    return {
      kind: "challenge",
      id: value.id,
      expiresAt: value.expiresAt,
      destination: value.destination,
    };
  }
  if (value.kind === "invitation") {
    if (
      !text(value.id) ||
      !text(value.expiresAt) ||
      !text(value.organization) ||
      !text(value.role)
    )
      throw new ServiceError("validation");
    if (isExpired(value.expiresAt)) throw new ServiceError("unauthorized");
    return {
      kind: "invitation",
      id: value.id,
      expiresAt: value.expiresAt,
      organization: value.organization,
      role: value.role,
    };
  }
  if (value.kind === "authenticated") {
    const session = value.session;
    if (
      !obj(session) ||
      !text(session.id) ||
      !text(session.expiresAt) ||
      !text(session.displayName) ||
      !Array.isArray(session.permissions) ||
      session.permissions.length > 1000 ||
      !session.permissions.every(text)
    )
      throw new ServiceError("validation");
    if (isExpired(session.expiresAt)) throw new ServiceError("unauthorized");
    return {
      kind: "authenticated",
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
        displayName: session.displayName,
        permissions: [...session.permissions],
      },
    };
  }
  throw new ServiceError("validation");
}
