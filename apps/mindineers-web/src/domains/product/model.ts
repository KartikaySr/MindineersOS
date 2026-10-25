import type {
  SourceRecord,
  DocumentRecord,
  ChangeRecord,
} from "../../shared/contracts/workspace";
import { validateDataTree } from "../../shared/services/input-safety";
export interface ResearchClaim {
  id: string;
  text: string;
  sourceId: string;
  quote: string;
  stance: "Supports" | "Contradicts" | "Context";
}
export interface ResearchBrief {
  id: string;
  name: string;
  question: string;
  conclusion: string;
  limitations: string;
  claims: ResearchClaim[];
  state: "Draft" | "Reviewed";
  snapshot: string;
}
export interface IngestionDraft {
  id: string;
  name: string;
  origin: string;
  scope: string;
  content: string;
  state: "Draft" | "Imported";
  sourceIds: string[];
  at: string;
}
export interface ProductReview {
  id: string;
  entityId: string;
  domain: "Engineering" | "Procurement" | "Creative" | "Evaluation";
  snapshot: string;
  author: string;
  reviewers: string[];
  decisions: {
    reviewer: string;
    decision: "Accept" | "Request changes";
    reason: string;
    at: string;
  }[];
  createdAt: string;
  state: "In review" | "Accepted locally" | "Changes requested" | "Withdrawn";
}
export interface ProductWorkflowCollections {
  adjudications: AdjudicationRecord[];
  researchBriefs: ResearchBrief[];
  ingestionDrafts: IngestionDraft[];
  productReviews: ProductReview[];
}
export const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const fields = (v: unknown, keys: string[]): v is Record<string, string> =>
  object(v) &&
  keys.every((k) => typeof v[k] === "string" && v[k].length <= 200000);
const list = (v: unknown, check: (v: unknown) => boolean) =>
  Array.isArray(v) && v.length <= 1000 && v.every(check);
export const productWorkflowValidators = {
  adjudications: (v: unknown) =>
    fields(v, [
      "id",
      "evaluationId",
      "trialId",
      "snapshot",
      "author",
      "reviewer",
      "outcome",
      "reason",
      "at",
    ]) &&
    ["Pass", "Fail", "Inconclusive"].includes(v.outcome ?? "") &&
    object(v) &&
    typeof v.revealed === "boolean",

  researchBriefs: (v: unknown) =>
    fields(v, [
      "id",
      "name",
      "question",
      "conclusion",
      "limitations",
      "state",
      "snapshot",
    ]) &&
    ["Draft", "Reviewed"].includes(v.state ?? "") &&
    object(v) &&
    list(
      v.claims,
      (c) =>
        fields(c, ["id", "text", "sourceId", "quote", "stance"]) &&
        ["Supports", "Contradicts", "Context"].includes(c.stance ?? ""),
    ),
  ingestionDrafts: (v: unknown) =>
    fields(v, ["id", "name", "origin", "scope", "content", "state", "at"]) &&
    ["Draft", "Imported"].includes(v.state ?? "") &&
    object(v) &&
    list(v.sourceIds, (x) => typeof x === "string"),
  productReviews: (v: unknown) =>
    fields(v, [
      "id",
      "entityId",
      "domain",
      "snapshot",
      "author",
      "createdAt",
      "state",
    ]) &&
    ["Engineering", "Procurement", "Creative", "Evaluation"].includes(
      v.domain ?? "",
    ) &&
    [
      "In review",
      "Accepted locally",
      "Changes requested",
      "Withdrawn",
    ].includes(v.state ?? "") &&
    object(v) &&
    list(v.reviewers, (x) => typeof x === "string") &&
    list(
      v.decisions,
      (d) =>
        fields(d, ["reviewer", "decision", "reason", "at"]) &&
        ["Accept", "Request changes"].includes(d.decision ?? ""),
    ),
};
export function canonical(value: unknown): string {
  validateDataTree(value);
  const sort = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(sort)
      : object(v)
        ? Object.fromEntries(
            Object.keys(v)
              .sort()
              .map((k) => [k, sort(v[k])]),
          )
        : v;
  return JSON.stringify(sort(value));
}
export function ingestionChunks(text: string): string[] {
  if (!text.trim()) throw new Error("Add text to ingest.");
  if (text.length > 100000)
    throw new Error("Use at most 100,000 characters per ingestion draft.");
  if (text.includes("\u0000"))
    throw new Error(
      "Binary content is not supported. Use plain text or Markdown.",
    );
  const result: string[] = [];
  for (let start = 0; start < text.length; start += 4000)
    result.push(text.slice(start, start + 4000));
  return result;
}
export function importIngestion(
  draft: IngestionDraft,
  sources: SourceRecord[],
): { draft: IngestionDraft; sources: SourceRecord[] } {
  if (draft.state !== "Draft")
    throw new Error("This draft was already imported.");
  if (!draft.name.trim()) throw new Error("Name the source.");
  if (draft.origin) {
    const u = new URL(draft.origin);
    if (!["http:", "https:"].includes(u.protocol) || u.username || u.password)
      throw new Error("Use an HTTP(S) source URL without credentials.");
  }
  const chunks = ingestionChunks(draft.content);
  const added = [...new Set(chunks)]
    .filter(
      (excerpt) =>
        !sources.some((s) => s.excerpt === excerpt && s.url === draft.origin),
    )
    .map(
      (excerpt, i): SourceRecord => ({
        id: crypto.randomUUID(),
        kind: "source",
        name: `${draft.name} · part ${i + 1}`,
        url: draft.origin,
        excerpt,
        collection: draft.name,
        scope: draft.scope,
        state: "Reference only",
        retrievedAt: new Date().toISOString().slice(0, 10),
        notes:
          "Imported from user-supplied text. Retrieval and accuracy not verified.",
      }),
    );
  if (!added.length)
    throw new Error("All excerpts already exist for this source URL.");
  return {
    draft: { ...draft, state: "Imported", sourceIds: added.map((s) => s.id) },
    sources: [...sources, ...added],
  };
}
export function researchSnapshot(
  brief: ResearchBrief,
  sources: SourceRecord[],
): string {
  return canonical({
    name: brief.name,
    question: brief.question,
    conclusion: brief.conclusion,
    limitations: brief.limitations,
    claims: brief.claims,
    sources: brief.claims.map(
      (c) => sources.find((s) => s.id === c.sourceId) ?? null,
    ),
  });
}
export function researchErrors(
  brief: ResearchBrief,
  sources: SourceRecord[],
): string[] {
  const errors: string[] = [];
  if (
    !brief.question.trim() ||
    !brief.conclusion.trim() ||
    !brief.limitations.trim()
  )
    errors.push("Add a question, conclusion and limitations.");
  if (!brief.claims.length)
    errors.push("Add at least one evidence-backed claim.");
  for (const c of brief.claims) {
    const s = sources.find((s) => s.id === c.sourceId);
    if (
      !c.text.trim() ||
      !c.quote.trim() ||
      !s ||
      s.state === "Archived" ||
      !s.excerpt.includes(c.quote)
    )
      errors.push(
        "Every claim needs a current source and an exact, nonempty supporting excerpt.",
      );
  }
  if (researchSnapshot(brief, sources).length > 200000)
    errors.push(
      "This brief exceeds the supported review size. Split it into smaller briefs.",
    );
  return [...new Set(errors)];
}
export function researchDocument(
  brief: ResearchBrief,
  sources: SourceRecord[],
): DocumentRecord {
  const errors = researchErrors(brief, sources);
  if (
    errors.length ||
    brief.state !== "Reviewed" ||
    brief.snapshot !== researchSnapshot(brief, sources)
  )
    throw new Error(
      "Review the current brief and source evidence before creating a document.",
    );
  return {
    id: crypto.randomUUID(),
    name: brief.name,
    kind: "Document",
    body: `# ${brief.name}\n\n## Question\n${brief.question}\n\n## Conclusion\n${brief.conclusion}\n\n## Evidence\n${brief.claims
      .map((c, i) => {
        const s = sources.find((s) => s.id === c.sourceId)!;
        return `${i + 1}. ${c.text} (${c.stance})\n> ${c.quote}\nSource: ${s.name} · ${s.url || "Local source"} · ${s.retrievedAt}`;
      })
      .join(
        "\n\n",
      )}\n\n## Limitations\n${brief.limitations}\n\nLocally reviewed, user-supplied evidence; not independently verified.`,
    rows: [],
    slides: [],
    comments: [],
    versions: [],
    updatedAt: new Date().toISOString(),
  };
}
export function prepareReview(
  domain: ProductReview["domain"],
  entityId: string,
  snapshot: string,
  author: string,
  reviewers: string[],
): ProductReview {
  const names = reviewers.map((r) => r.trim()).filter(Boolean);
  if (
    !author.trim() ||
    !names.length ||
    names.length > 10 ||
    new Set(names.map((n) => n.toLowerCase())).size !== names.length ||
    names.some((n) => n.toLowerCase() === author.trim().toLowerCase())
  )
    throw new Error(
      "Provide an author and 1–10 distinct reviewers other than the author.",
    );
  if (snapshot.length > 200000)
    throw new Error(
      "Review snapshot exceeds 200,000 characters. Reduce the supplied content.",
    );
  return {
    id: crypto.randomUUID(),
    domain,
    entityId,
    snapshot,
    author: author.trim(),
    reviewers: names,
    decisions: [],
    createdAt: new Date().toISOString(),
    state: "In review",
  };
}
export function reviewDecision(
  review: ProductReview,
  current: string,
  reviewer: string,
  decision: "Accept" | "Request changes",
  reason: string,
): ProductReview {
  if (review.state !== "In review" || review.snapshot !== current)
    throw new Error(
      "This review is closed or stale. Prepare a new review for the current content.",
    );
  if (review.reviewers[review.decisions.length] !== reviewer)
    throw new Error("Only the next assigned reviewer can record this step.");
  if (!reason.trim())
    throw new Error("Evidence or a review rationale is required.");
  const decisions = [
    ...review.decisions,
    { reviewer, decision, reason: reason.trim(), at: new Date().toISOString() },
  ];
  return {
    ...review,
    decisions,
    state:
      decision === "Request changes"
        ? "Changes requested"
        : decisions.length === review.reviewers.length
          ? "Accepted locally"
          : "In review",
  };
}
export function releaseErrors(change: ChangeRecord): string[] {
  const errors: string[] = [];
  try {
    const u = new URL(change.repository);
    if (u.protocol !== "https:" || u.username || u.password)
      errors.push("Use an HTTPS repository URL without credentials.");
  } catch {
    errors.push("Use a valid HTTPS repository URL.");
  }
  if (
    !change.repository.trim() ||
    !change.branch.trim() ||
    !change.release.trim() ||
    !change.rollback.trim()
  )
    errors.push(
      "Add repository, branch, release notes and rollback instructions.",
    );
  if (!change.files.length) errors.push("Supply at least one changed file.");
  const paths = new Set<string>();
  for (const f of change.files) {
    if (
      !f.path.trim() ||
      f.path.startsWith("/") ||
      f.path.includes("\\") ||
      f.path.split("/").some((p) => p === ".." || p === "." || !p) ||
      paths.has(f.path)
    )
      errors.push(
        "Use unique, relative repository file paths without traversal.",
      );
    paths.add(f.path);
  }
  if (
    !change.checks.length ||
    change.checks.some((c) => c.status !== "Passed" || !c.evidence.trim())
  )
    errors.push(
      "Every required check needs a reported passing result and evidence.",
    );
  return [...new Set(errors)];
}
export interface AdjudicationRecord {
  id: string;
  evaluationId: string;
  trialId: string;
  snapshot: string;
  author: string;
  reviewer: string;
  outcome: "Pass" | "Fail" | "Inconclusive";
  reason: string;
  at: string;
  revealed: boolean;
}
export function adjudicate(
  evaluationId: string,
  trialId: string,
  snapshot: string,
  author: string,
  reviewer: string,
  outcome: AdjudicationRecord["outcome"],
  reason: string,
  revealed: boolean,
): AdjudicationRecord {
  if (
    !author.trim() ||
    !reviewer.trim() ||
    author.trim().toLowerCase() === reviewer.trim().toLowerCase() ||
    !reason.trim()
  )
    throw new Error(
      "Use distinct author and reviewer names and provide adjudication evidence.",
    );
  if (!["Pass", "Fail", "Inconclusive"].includes(outcome))
    throw new Error("Invalid adjudication outcome.");
  if (snapshot.length > 200000)
    throw new Error("Trial snapshot exceeds the supported review size.");
  return {
    id: crypto.randomUUID(),
    evaluationId,
    trialId,
    snapshot,
    author: author.trim(),
    reviewer: reviewer.trim(),
    outcome,
    reason: reason.trim(),
    at: new Date().toISOString(),
    revealed,
  };
}
