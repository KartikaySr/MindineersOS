import test from "node:test";
import assert from "node:assert/strict";
import {
  canonical,
  ingestionChunks,
  importIngestion,
  researchSnapshot,
  researchErrors,
  researchDocument,
  prepareReview,
  reviewDecision,
  releaseErrors,
  adjudicate,
} from "../src/domains/product/model.ts";
import {
  checkedRepository,
  disconnectedRepository,
} from "../src/domains/product/RepositoryInspector.tsx";
import { validateProduct } from "../src/product-model.js";
const draft = () => ({
  id: "i",
  name: "Source",
  origin: "https://example.org/source",
  scope: "Workspace",
  content: "A measured result.",
  state: "Draft",
  sourceIds: [],
  at: new Date().toISOString(),
});
const source = () => ({
  id: "s",
  kind: "source",
  name: "Study",
  url: "https://example.org",
  excerpt: "A measured result.",
  collection: "Research",
  scope: "Workspace",
  state: "Reference only",
  retrievedAt: "2026-10-25",
  notes: "",
});
const brief = () => ({
  id: "b",
  name: "Brief",
  question: "What happened?",
  conclusion: "A result was measured.",
  limitations: "Small sample.",
  claims: [
    {
      id: "c",
      text: "Measurement exists",
      sourceId: "s",
      quote: "A measured result.",
      stance: "Supports",
    },
  ],
  state: "Draft",
  snapshot: "",
});
test("ingestion bounds content, preserves it across chunks and rejects binary or unsafe origins", () => {
  const content = "x".repeat(8001);
  assert.equal(ingestionChunks(content).join(""), content);
  assert.equal(ingestionChunks(content).length, 3);
  for (const value of ["", "x".repeat(100001), "x\0y"])
    assert.throws(() => ingestionChunks(value));
  for (const origin of [
    "javascript:alert(1)",
    "file:///etc/passwd",
    "https://user:secret@example.org",
  ])
    assert.throws(() => importIngestion({ ...draft(), origin }, []));
});
test("reviewed ingestion creates valid references and prevents repeated or duplicate imports", () => {
  const result = importIngestion(draft(), []);
  assert.equal(result.draft.state, "Imported");
  assert.equal(result.sources[0].excerpt, draft().content);
  assert.equal(result.draft.sourceIds[0], result.sources[0].id);
  validateProduct({ ingestionDrafts: [result.draft], sources: result.sources });
  assert.throws(() => importIngestion(result.draft, result.sources));
  assert.throws(() => importIngestion(draft(), result.sources));
  assert.equal(
    importIngestion({ ...draft(), content: "x".repeat(8000) }, []).sources
      .length,
    1,
  );
});
test("research requires exact current evidence and detects archived or missing sources", () => {
  assert.deepEqual(researchErrors(brief(), [source()]), []);
  for (const sources of [
    [],
    [{ ...source(), state: "Archived" }],
    [{ ...source(), excerpt: "Changed" }],
  ])
    assert.ok(researchErrors(brief(), sources).length);
  assert.ok(
    researchErrors(
      { ...brief(), claims: [{ ...brief().claims[0], quote: "   " }] },
      [source()],
    ).length,
  );
});
test("document handoff snapshots reviewed evidence and rejects stale source changes", () => {
  const sources = [source()],
    b = brief();
  assert.throws(() => researchDocument(b, sources));
  b.state = "Reviewed";
  b.snapshot = researchSnapshot(b, sources);
  const doc = researchDocument(b, sources);
  validateProduct({ researchBriefs: [b], documents: [doc] });
  assert.match(doc.body, /https:\/\/example.org/);
  assert.match(doc.body, /Small sample/);
  sources[0].excerpt = "Changed";
  assert.throws(() => researchDocument(b, sources));
  assert.match(doc.body, /A measured result/);
});
test("ordered review enforces separation, rationale, exact revision and terminal states", () => {
  assert.throws(() =>
    prepareReview("Engineering", "e", "{}", "Author", ["author"]),
  );
  assert.throws(() =>
    prepareReview("Engineering", "e", "{}", "Author", ["Reviewer", "reviewer"]),
  );
  const r = prepareReview("Engineering", "e", '{"revision":1}', "Author", [
    "One",
    "Two",
  ]);
  validateProduct({ productReviews: [r] });
  assert.throws(() =>
    reviewDecision(r, r.snapshot, "Two", "Accept", "evidence"),
  );
  assert.throws(() =>
    reviewDecision(r, "changed", "One", "Accept", "evidence"),
  );
  assert.throws(() => reviewDecision(r, r.snapshot, "One", "Accept", " "));
  const first = reviewDecision(
    r,
    r.snapshot,
    "One",
    "Accept",
    "tests reviewed",
  );
  assert.equal(first.state, "In review");
  const final = reviewDecision(
    first,
    first.snapshot,
    "Two",
    "Accept",
    "risk reviewed",
  );
  assert.equal(final.state, "Accepted locally");
  assert.throws(() =>
    reviewDecision(final, final.snapshot, "Two", "Accept", "again"),
  );
  assert.equal(r.decisions.length, 0);
  assert.equal(
    reviewDecision(r, r.snapshot, "One", "Request changes", "missing check")
      .state,
    "Changes requested",
  );
});
test("canonical snapshots ignore object key order but preserve array order and reject unsafe keys", () => {
  assert.equal(canonical({ a: 1, b: 2 }), canonical({ b: 2, a: 1 }));
  assert.notEqual(canonical([1, 2]), canonical([2, 1]));
  assert.throws(() => canonical(JSON.parse('{"__proto__":1}')));
});
test("release preparation rejects missing evidence and repository path traversal", () => {
  const change = {
    repository: "https://example.org/repo",
    branch: "main",
    release: "Release notes",
    rollback: "Revert revision",
    files: [{ id: "f", path: "src/app.ts", before: "old", after: "new" }],
    checks: [{ id: "c", name: "Build", status: "Passed", evidence: "run-1" }],
  };
  assert.deepEqual(releaseErrors(change), []);
  for (const path of [
    "../secrets",
    "/absolute",
    "src/../key",
    "src\\file",
    "src//file",
  ])
    assert.ok(
      releaseErrors({ ...change, files: [{ ...change.files[0], path }] })
        .length,
    );
  assert.ok(releaseErrors({ ...change, checks: [] }).length);
  assert.ok(
    releaseErrors({ ...change, repository: "javascript:alert(1)" }).length,
  );
  assert.ok(
    releaseErrors({ ...change, files: [...change.files, ...change.files] })
      .length,
  );
});
test("repository boundary checks requested identity, unique safe paths and response limits", async () => {
  const value = {
    repository: "repo",
    ref: "main",
    revision: "abc",
    files: [{ path: "src/a.ts", content: "safe text" }],
    checks: [{ name: "Build", status: "Passed", evidence: "run" }],
  };
  assert.equal(checkedRepository(value, "repo", "main").revision, "abc");
  for (const v of [
    { ...value, repository: "other" },
    { ...value, files: [{ path: "../secret", content: "" }] },
    { ...value, files: [...value.files, ...value.files] },
    { ...value, checks: [{ name: "Build", status: "Unknown", evidence: "" }] },
  ])
    assert.throws(() => checkedRepository(v, "repo", "main"));
  assert.equal(disconnectedRepository.available, false);
  await assert.rejects(() =>
    disconnectedRepository.read("repo", "main", new AbortController().signal),
  );
});
test("adjudication preserves separate findings and rejects same-author review or unsupported outcomes", () => {
  const decision = adjudicate(
    "e",
    "t",
    "{}",
    "Author",
    "Reviewer",
    "Inconclusive",
    "Evidence insufficient",
    false,
  );
  assert.equal(decision.revealed, false);
  validateProduct({ adjudications: [decision] });
  assert.throws(() =>
    adjudicate("e", "t", "{}", "Author", "author", "Pass", "reason", true),
  );
  assert.throws(() =>
    adjudicate(
      "e",
      "t",
      "{}",
      "Author",
      "Reviewer",
      "Unknown",
      "reason",
      false,
    ),
  );
});
test("workflow import rejects unknown states and mismatched source discriminants", () => {
  assert.throws(() =>
    validateProduct({ researchBriefs: [{ ...brief(), state: "Published" }] }),
  );
  assert.throws(() =>
    validateProduct({ sources: [{ ...source(), kind: "memory" }] }),
  );
  assert.throws(() =>
    validateProduct({ ingestionDrafts: [{ ...draft(), state: "Synced" }] }),
  );
});
