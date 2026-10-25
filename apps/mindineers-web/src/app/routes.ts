export const routeIds = [
  "welcome",
  "sign-in",
  "sign-up",
  "recovery",
  "join",
  "profile",
  "home",
  "chat",
  "feed",
  "projects",
  "missions",
  "agents",
  "teams",
  "workflows",
  "office",
  "files",
  "documents",
  "knowledge",
  "research",
  "engineering",
  "creative",
  "calendar",
  "customers",
  "delivery",
  "finance",
  "operations",
  "simulation",
  "evaluations",
  "improvement",
  "integrations",
  "tools",
  "models",
  "observability",
  "usage",
  "security",
  "inbox",
  "help",
  "settings",
  "resources",
  "runs",
] as const;
export type RouteId = (typeof routeIds)[number];
export type RouteLocation =
  | { kind: "known"; id: RouteId }
  | { kind: "missing"; id: string };
const known = new Set<string>(routeIds);
export function readRoute(hash: string): RouteLocation {
  const raw = hash.replace(/^#/, "");
  // #main is an accessibility anchor, not a product route.
  const id = raw || "welcome";
  return known.has(id)
    ? { kind: "known", id: id as RouteId }
    : { kind: "missing", id: id.slice(0, 120) };
}
export function defaultWorkbench(id: string): boolean {
  return ["workflows", "teams", "tools"].includes(id);
}
export function routeHref(id: RouteId): string {
  return "#" + id;
}
export function navigationTitle(id: string, title: string): string {
  const publicTitles: Partial<Record<RouteId, string>> = {
    welcome: "A world of work. One clear mind.",
    "sign-in": "Sign in",
    "sign-up": "Create account",
    recovery: "Recover access",
    join: "Join a team",
  };
  return `MindineersOS — ${known.has(id) ? (publicTitles[id as RouteId] ?? title) : "Page not found"}`;
}
