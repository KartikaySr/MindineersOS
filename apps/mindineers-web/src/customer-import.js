export function parseCSV(text) {
  if (text.length > 1000000) throw new Error("CSV must be under 1 MB.");
  const rows = [];
  let row = [],
    field = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (!quoted && field !== "")
        throw new Error("Unexpected quote in CSV.");
      else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (quoted) throw new Error("Unclosed quoted CSV field.");
  row.push(field);
  if (row.some((x) => x.trim())) rows.push(row);
  if (rows.length < 2)
    throw new Error("Include a header and at least one contact.");
  if (rows.length > 1001 || rows[0].length > 40)
    throw new Error("Use up to 1,000 contacts and 40 columns.");
  const headers = rows.shift().map((h) => h.replace(/^\uFEFF/, "").trim());
  if (new Set(headers).size !== headers.length || headers.some((h) => !h))
    throw new Error("Column headers must be unique and non-empty.");
  if (rows.some((r) => r.length !== headers.length))
    throw new Error("All rows must have the same number of columns.");
  return { headers, rows };
}
export const contactFields = [
  "name",
  "email",
  "company",
  "description",
  "owner",
  "value",
  "currency",
  "nextContact",
];
export function mapContacts(csv, mapping, existing) {
  const seen = new Set(
    existing.map((x) => x.email?.trim().toLowerCase()).filter(Boolean),
  );
  return csv.rows.map((row, i) => {
    const record = Object.fromEntries(
      contactFields.map((k) => [
        k,
        mapping[k] === undefined || mapping[k] === ""
          ? ""
          : (row[Number(mapping[k])] || "").trim(),
      ]),
    );
    const errors = [];
    if (!record.name) errors.push("Name required");
    if (record.name.length > 300) errors.push("Name too long");
    if (record.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email))
      errors.push("Invalid email");
    if (
      record.value &&
      (!Number.isFinite(Number(record.value)) || Number(record.value) < 0)
    )
      errors.push("Invalid value");
    if (record.currency && !/^[A-Z]{3}$/.test(record.currency))
      errors.push("Use a three-letter currency");
    if (record.nextContact && !/^\d{4}-\d{2}-\d{2}$/.test(record.nextContact))
      errors.push("Use YYYY-MM-DD");
    const email = record.email.toLowerCase(),
      duplicate = Boolean(email && seen.has(email));
    if (email) seen.add(email);
    return { line: i + 2, record, errors, duplicate };
  });
}
export function mergeContacts(target, source, choices) {
  if (target.id === source.id) throw new Error("Choose two distinct contacts.");
  return {
    ...target,
    ...Object.fromEntries(
      contactFields.map((k) => [
        k,
        choices[k] === "source" ? source[k] || "" : target[k] || "",
      ]),
    ),
    activities: [
      ...(target.activities || []),
      ...(source.activities || []),
      {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        text: `Merged local contact: ${source.name}`,
      },
    ],
  };
}
