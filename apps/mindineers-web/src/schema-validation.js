import validateMeta from "./generated/schema-meta.js";
export function schemaErrors(raw) {
  if (raw.length > 50000) return ["Schema exceeds 50,000 characters."];
  let schema;
  try {
    schema = JSON.parse(raw);
  } catch {
    return ["Schema is not valid JSON."];
  }

  if (
    schema?.$schema &&
    ![
      "http://json-schema.org/draft-07/schema#",
      "http://json-schema.org/draft-07/schema",
    ].includes(schema.$schema)
  )
    return ["Only JSON Schema draft-07 is supported in this editor."];
  const errors = [];
  let count = 0;
  function walk(value, depth) {
    if (++count > 2000 || depth > 32) {
      errors.push("Schema exceeds the supported complexity.");
      return;
    }
    if (!value || typeof value !== "object") return;
    if (typeof value.$ref === "string" && !value.$ref.startsWith("#"))
      errors.push(
        "External schema references are unavailable. Use local # references.",
      );
    if (typeof value.$ref === "string" && value.$ref.startsWith("#/")) {
      const parts = value.$ref
        .slice(2)
        .split("/")
        .map((p) => p.replaceAll("~1", "/").replaceAll("~0", "~"));
      let target = schema;
      for (const part of parts)
        target =
          target && Object.hasOwn(target, part) ? target[part] : undefined;
      if (target === undefined)
        errors.push(`Unresolved reference: ${value.$ref}`);
    }
    for (const child of Object.values(value)) walk(child, depth + 1);
  }
  walk(schema, 0);
  if (errors.length) return [...new Set(errors)];
  if (!validateMeta(schema))
    return (validateMeta.errors || []).map(
      (e) => `${e.instancePath || "/"} ${e.message}`,
    );
  return [];
}
