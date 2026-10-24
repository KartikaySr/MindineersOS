export interface OrganizationDraft {
  id: string;
  name: string;
  slug: string;
  contact: string;
  region: string;
  domains: string;
  state: "Draft" | "Ready for review";
}
export interface LifecycleRequest {
  id: string;
  provider: string;
  action: "Connect" | "Change scopes" | "Reconnect" | "Revoke";
  account: string;
  scopes: string[];
  reason: string;
  state: "Draft" | "Ready for review" | "Withdrawn";
  at: string;
}
export interface BillingRequest {
  id: string;
  action:
    | "Change plan"
    | "Cancel renewal"
    | "Resume renewal"
    | "Billing support";
  plan: string;
  cycle: string;
  effective: "Next renewal" | "Request immediate change";
  reason: string;
  state: "Draft" | "Ready for review" | "Withdrawn";
  at: string;
}
export interface BillingProfile {
  id: string;
  company: string;
  email: string;
  address: string;
  country: string;
  purchaseOrder: string;
}
export interface PhaseTwoCollections {
  organizations: OrganizationDraft[];
  connectionRequests: LifecycleRequest[];
  billingRequests: BillingRequest[];
  billingProfiles: BillingProfile[];
}
const object = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);
const fields = (x: unknown, keys: string[]): x is Record<string, string> =>
  object(x) &&
  keys.every((k) => typeof x[k] === "string" && x[k].length <= 20000);
export const phaseTwoValidators = {
  organizations: (x: unknown) =>
    fields(x, [
      "id",
      "name",
      "slug",
      "contact",
      "region",
      "domains",
      "state",
    ]) && ["Draft", "Ready for review"].includes(x.state ?? ""),
  connectionRequests: (x: unknown) =>
    fields(x, [
      "id",
      "provider",
      "action",
      "account",
      "reason",
      "state",
      "at",
    ]) &&
    ["Connect", "Change scopes", "Reconnect", "Revoke"].includes(
      x.action ?? "",
    ) &&
    ["Draft", "Ready for review", "Withdrawn"].includes(x.state ?? "") &&
    object(x) &&
    Array.isArray(x.scopes) &&
    x.scopes.length <= 50 &&
    x.scopes.every((s) => typeof s === "string" && s.length <= 300),
  billingRequests: (x: unknown) =>
    fields(x, [
      "id",
      "action",
      "plan",
      "cycle",
      "effective",
      "reason",
      "state",
      "at",
    ]) &&
    [
      "Change plan",
      "Cancel renewal",
      "Resume renewal",
      "Billing support",
    ].includes(x.action ?? "") &&
    ["Next renewal", "Request immediate change"].includes(x.effective ?? "") &&
    ["Draft", "Ready for review", "Withdrawn"].includes(x.state ?? ""),
  billingProfiles: (x: unknown) =>
    fields(x, [
      "id",
      "company",
      "email",
      "address",
      "country",
      "purchaseOrder",
    ]),
};
export function organizationErrors(d: OrganizationDraft): string[] {
  const errors = [];
  if (!d.name.trim()) errors.push("Organization name is required.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.slug) || d.slug.length > 60)
    errors.push(
      "Use a slug of lowercase letters, numbers and single hyphens (up to 60 characters).",
    );
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.contact))
    errors.push("A valid contact email is required.");
  if (
    d.domains
      .split(/[\s,]+/)
      .filter(Boolean)
      .some(
        (domain) =>
          !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain),
      )
  )
    errors.push("Enter domain names without URLs or wildcards.");
  return errors;
}
export type PermissionState =
  | { status: "disconnected" }
  | { status: "verified"; permissions: readonly string[]; expiresAt: string };
export function permissionDecision(
  state: PermissionState,
  capability: string,
  now = Date.now(),
): { allowed: boolean; reason: string } {
  if (state.status === "disconnected")
    return {
      allowed: false,
      reason: "Verified access is unavailable until identity is connected.",
    };
  if (
    !Number.isFinite(Date.parse(state.expiresAt)) ||
    Date.parse(state.expiresAt) <= now
  )
    return {
      allowed: false,
      reason: "Your permission snapshot has expired. Refresh your session.",
    };
  return state.permissions.includes(capability)
    ? {
        allowed: true,
        reason: "Allowed by the current verified permission snapshot.",
      }
    : {
        allowed: false,
        reason: "Your current role does not grant this action.",
      };
}
export function readyRequest<T extends LifecycleRequest | BillingRequest>(
  request: T,
): T {
  if (request.state !== "Draft")
    throw new Error("Only a draft can be prepared for review.");
  if (!request.reason.trim())
    throw new Error("Explain why this change is needed.");
  if (
    "provider" in request &&
    (!request.provider ||
      !request.account.trim() ||
      (request.action !== "Revoke" && !request.scopes.length))
  )
    throw new Error("Choose an account and requested scopes.");
  if (
    "plan" in request &&
    request.action === "Change plan" &&
    !request.plan.trim()
  )
    throw new Error("Select the requested plan.");
  return { ...request, state: "Ready for review" };
}
