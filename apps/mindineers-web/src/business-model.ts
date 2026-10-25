import type {
  LedgerRecord,
  DeliveryRecord,
  DocumentRecord,
} from "./shared/contracts/workspace";
export const currencies: Record<string, number> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  INR: 2,
  JPY: 0,
  KWD: 3,
};
export const financeStates = [
  "Draft",
  "Submitted",
  "Accepted",
  "Paid",
  "Disputed",
  "Reconciled",
];
export function minorAmount(value: string | number, currency: string) {
  const digits = currencies[currency];
  if (digits === undefined) throw new Error("Choose a supported currency.");
  const pattern = digits
    ? new RegExp(`^\\d+(?:\\.\\d{1,${digits}})?$`)
    : /^\d+$/;
  if (!pattern.test(String(value)))
    throw new Error(
      `Use a non-negative amount with at most ${digits} decimal places.`,
    );
  const [whole = "0", fraction = ""] = String(value).split(".");
  const amount =
    BigInt(whole) * 10n ** BigInt(digits) +
    BigInt(fraction.padEnd(digits, "0") || "0");
  if (amount > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error("Amount exceeds supported range.");
  return Number(amount);
}
export function financeTotals(
  record: Pick<LedgerRecord, "lines" | "tax" | "currency">,
) {
  if (!record.lines.length) throw new Error("Add at least one line item.");
  let subtotal = 0n;
  for (const line of record.lines) {
    if (!/^\d+$/.test(line.quantity) || BigInt(line.quantity) < 1n)
      throw new Error("Quantities must be positive whole numbers.");
    subtotal +=
      BigInt(minorAmount(line.price, record.currency)) * BigInt(line.quantity);
  }
  if (!/^\d+(?:\.\d{1,2})?$/.test(record.tax) || Number(record.tax) > 100)
    throw new Error(
      "Tax must be between 0 and 100%, with at most two decimals.",
    );
  const bps = BigInt(minorAmount(record.tax, "USD"));
  const tax = (subtotal * bps + 5000n) / 10000n;
  if (subtotal + tax > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error("Total exceeds supported range.");
  return {
    subtotal: Number(subtotal),
    tax: Number(tax),
    total: Number(subtotal + tax),
  };
}
export function money(amount: number, currency: string) {
  const digits = currencies[currency];
  if (digits === undefined) throw new Error("Unsupported currency.");
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
  }).format(amount / 10 ** digits);
}
export function transitionFinance(
  record: LedgerRecord,
  next: string,
  evidence: string,
  actor: string,
  at = new Date().toISOString(),
) {
  const allowed: Record<string, string[]> = {
    Draft: ["Submitted"],
    Submitted: ["Accepted", "Disputed"],
    Accepted: ["Paid", "Disputed"],
    Paid: ["Reconciled", "Disputed"],
    Disputed: ["Submitted"],
    Reconciled: ["Disputed"],
  };
  if (!allowed[record.state]?.includes(next))
    throw new Error("This status transition is not allowed.");
  if (
    !record.name.trim() ||
    !record.counterparty.trim() ||
    record.lines.some((l) => !l.description.trim())
  )
    throw new Error(
      "Add a reference, counterparty, and descriptions for all lines.",
    );
  const { total } = financeTotals(record);
  if (!evidence.trim())
    throw new Error("Record the source or evidence for this status.");
  if (next === "Reconciled") {
    if (!record.matchReference.trim())
      throw new Error("A statement or purchase-order reference is required.");
    if (minorAmount(record.matchedAmount, record.currency) !== total)
      throw new Error("Matched amount must equal the document total.");
  }
  return {
    ...record,
    state: next,
    history: [
      ...record.history,
      {
        id: crypto.randomUUID(),
        from: record.state,
        to: next,
        evidence: evidence.trim(),
        actor,
        at,
      },
    ],
  };
}
export function portalSnapshot(
  delivery: DeliveryRecord,
  customer: { id: string; name: string } | undefined,
  documents: DocumentRecord[],
) {
  if (!customer || delivery.customerId !== customer.id)
    throw new Error("Select an existing customer before preparing a portal.");
  return {
    customer: { id: customer.id, name: customer.name },
    delivery: {
      name: delivery.name,
      status: delivery.state,
      due: delivery.due,
    },
    updates: delivery.updates
      .filter((u) => u.visible)
      .map((u) => ({ text: u.text, at: u.at })),
    artifacts: delivery.artifacts
      .filter((a) => a.customerId === customer.id && a.visible)
      .flatMap((a) => {
        const doc = documents.find((d) => d.id === a.documentId);
        return doc
          ? [
              {
                name: doc.name,
                kind: doc.kind,
                body: doc.body,
                rows: doc.rows,
                slides: doc.slides.map((s) => ({
                  title: s.title,
                  body: s.body,
                })),
              },
            ]
          : [];
      }),
  };
}
export function acceptanceReady(delivery: DeliveryRecord) {
  return (
    !!delivery.customerId &&
    delivery.checklist.length > 0 &&
    delivery.checklist.every((c) => c.done) &&
    delivery.requirements.trim().length > 0 &&
    delivery.source.trim().length > 0
  );
}
const text = (x: unknown): x is string =>
  typeof x === "string" && x.length <= 200000;
const fields = <K extends string>(
  x: unknown,
  keys: K[],
): x is Record<string, unknown> & Record<K, string> =>
  !!x &&
  typeof x === "object" &&
  !Array.isArray(x) &&
  keys.every((k) => text(Reflect.get(x, k)));
const rows = (x: unknown, fn: (value: unknown) => boolean) =>
  Array.isArray(x) && x.length <= 10000 && x.every(fn);
const checklist = (x: unknown) =>
  fields(x, ["id", "text"]) && typeof x.done === "boolean";
export const businessValidators = {
  ledger: (r: unknown) =>
    fields(r, [
      "id",
      "name",
      "kind",
      "counterparty",
      "currency",
      "tax",
      "due",
      "state",
      "matchReference",
      "matchedAmount",
      "notes",
    ]) &&
    ["Invoice", "Expense", "Purchase request"].includes(r.kind) &&
    Object.hasOwn(currencies, r.currency) &&
    financeStates.includes(r.state) &&
    rows(r.lines, (l) =>
      fields(l, ["id", "description", "quantity", "price"]),
    ) &&
    rows(r.history, (h) =>
      fields(h, ["id", "from", "to", "evidence", "actor", "at"]),
    ),
  deliveries: (r: unknown) =>
    fields(r, [
      "id",
      "name",
      "customerId",
      "projectId",
      "owner",
      "priority",
      "due",
      "state",
      "requirements",
      "source",
      "escalation",
      "response",
      "acceptanceEvidence",
    ]) &&
    [
      "Intake",
      "Assigned",
      "In progress",
      "Awaiting acceptance",
      "Accepted",
      "Escalated",
    ].includes(r.state) &&
    rows(r.checklist, checklist) &&
    rows(
      r.updates,
      (u) => fields(u, ["id", "text", "at"]) && typeof u.visible === "boolean",
    ) &&
    rows(
      r.artifacts,
      (a) =>
        fields(a, ["id", "documentId", "customerId"]) &&
        typeof a.visible === "boolean",
    ),
  procedures: (r: unknown) =>
    fields(r, [
      "id",
      "name",
      "kind",
      "owner",
      "due",
      "cadence",
      "supplier",
      "source",
      "notes",
      "state",
    ]) &&
    rows(r.checklist, checklist) &&
    rows(r.completions, (c) => fields(c, ["id", "at", "actor", "evidence"])),
};
