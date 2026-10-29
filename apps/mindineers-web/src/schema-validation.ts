function isRecord(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }
import validateMeta from "./generated/schema-meta.js";
export function schemaErrors(raw: string): string[] {
  if (raw.length > 50000) return ["Schema exceeds 50,000 characters."];
  let schema: unknown;
  try {
    schema = JSON.parse(raw);
  } catch {
    return ["Schema is not valid JSON."];
  }

  if (
    isRecord(schema) && schema.$schema &&
    ![
      "http://json-schema.org/draft-07/schema#",
      "http://json-schema.org/draft-07/schema",
    ].includes(String(schema.$schema))
  )
    return ["Only JSON Schema draft-07 is supported in this editor."];
  const errors: string[] = [];
  let count = 0;
  function walk(value: unknown, depth: number) {
    if (++count > 2000 || depth > 32) {
      errors.push("Schema exceeds the supported complexity.");
      return;
    }
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) { for (const child of value) walk(child, depth + 1); return; }
    const record = value as Record<string, unknown>;
    if (typeof record.$ref === "string" && !record.$ref.startsWith("#"))
      errors.push(
        "External schema references are unavailable. Use local # references.",
      );
    if (typeof record.$ref === "string" && record.$ref.startsWith("#/")) {
      const parts = record.$ref
        .slice(2)
        .split("/")
        .map((p) => p.replaceAll("~1", "/").replaceAll("~0", "~"));
      let target = schema;
      for (const part of parts)
        target =
          isRecord(target) && Object.hasOwn(target, part) ? target[part] : undefined;
      if (target === undefined)
        errors.push(`Unresolved reference: ${record.$ref}`);
    }
    for (const child of Object.values(value)) walk(child, depth + 1);
  }
  walk(schema, 0);
  if (errors.length) return [...new Set(errors)];
  if (!validateMeta(schema))
    return (validateMeta.errors || []).map(
      (e: {instancePath?: string; message?: string}) => `${e.instancePath || "/"} ${e.message}`,
    );
  return [];
}
