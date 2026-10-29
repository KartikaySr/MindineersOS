export type Settings = Record<string, Record<string, string>>;
export interface Layer {
  id: string;
  label: string;
}
export const entityKey = (scope: string, id: string) =>
  `entity:${scope}:${encodeURIComponent(id)}`;
export function resolveSetting(
  settings: Settings,
  layers: Layer[],
  key: string,
  fallback: string,
) {
  let value = fallback,
    source = "Default",
    locked = false;
  const conflicts: string[] = [];
  for (const layer of layers) {
    const bucket = settings[layer.id] || {};
    if (Object.hasOwn(bucket, key)) {
      if (locked && bucket[key] !== value) conflicts.push(layer.label);
      else if (!locked) {
        value = bucket[key]!;
        source = layer.label;
      }
    }
    if (bucket[`mandatory:${key}`] === "true") locked = true;
  }
  return { value, source, locked, conflicts };
}
export function settingError(key: string, value: string): string | null {
  if (!value.trim() || value.length > 200)
    return "Enter between 1 and 200 characters.";
  const limits: Record<string, number> = {
    maxDelegation: 32,
    concurrency: 1000,
    retention: 36500,
    budget: 100000000,
    tokens: 100000000,
    timeout: 86400,
    retries: 100,
  };
  if (
    Object.hasOwn(limits, key) &&
    (!/^\d+(\.\d+)?$/.test(value) ||
      Number(value) > limits[key]! ||
      (key !== "budget" && !Number.isInteger(Number(value))))
  )
    return `Enter a nonnegative ${key === "budget" ? "number" : "integer"} no greater than ${limits[key]}.`;
  if (key === "timezone") {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value });
    } catch {
      return "Enter a valid IANA timezone.";
    }
  }
  return null;
}
export function setOverride(
  settings: Settings,
  target: string,
  key: string,
  value?: string,
): Settings {
  const bucket = { ...settings[target] };
  if (value === undefined) delete bucket[key];
  else bucket[key] = value;
  return { ...settings, [target]: bucket };
}
// Undo touches only the selected field and refuses to overwrite a later edit.
export function undoOverride(
  settings: Settings,
  target: string,
  key: string,
  expected: string | undefined,
  previous: string | undefined,
): Settings {
  if (settings[target]?.[key] !== expected)
    throw new Error(
      "This setting changed again. Undo was cancelled to preserve the newer value.",
    );
  return setOverride(settings, target, key, previous);
}

export const settingScopes = [
  "Organization",
  "Workspace",
  "User",
  "Device",
  "Project",
  "Team",
  "Agent",
  "Run",
] as const;
/** Explicit preview ancestry; user/device settings never leak into agent policy. */
export function scopeAncestors(scope: string): string[] {
  const chains: Record<string, string[]> = {
    Organization: ["Organization"],
    Workspace: ["Organization", "Workspace"],
    User: ["Organization", "Workspace", "User"],
    Device: ["Organization", "Workspace", "Device"],
    Project: ["Organization", "Workspace", "Project"],
    Team: ["Organization", "Workspace", "Project", "Team"],
    Agent: ["Organization", "Workspace", "Project", "Team", "Agent"],
    Run: ["Organization", "Workspace", "Project", "Team", "Agent", "Run"],
  };
  return chains[scope] || [];
}
