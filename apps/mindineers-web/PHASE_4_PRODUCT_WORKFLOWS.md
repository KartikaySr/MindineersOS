# Phase 4 — product workflows

Implemented 25 October 2026 following approval. Backend/database work remains separately gated. Phase 5 requires explicit approval.

## Knowledge → research → documents

Knowledge → Ingestion accepts plain text or Markdown drafts, including bounded `.txt`/`.md` uploads. Users inspect excerpt boundaries before importing searchable source records. Imports reject empty, oversized or binary text, reject unsafe source URLs, deduplicate identical excerpts and preserve provenance. Imported drafts are locked; source references remain editable. No crawler, embedding service or provider sync is simulated.

Research now has a dedicated workspace rather than defaulting to generic details. Briefs include a question, claims, exact quoted evidence, supporting/contradicting/context relationships, synthesis and limitations. Review requires current, unarchived sources and matching excerpts. Any source change invalidates the saved review. Creating a document copies a reviewed evidence snapshot, preserving its sources and limitations independently of later source edits.

Documents retains sheets, slides, comments, suggestions and version history. Markdown previews now render headings, strong text, inline/fenced code, quotations and safe HTTP(S) links. Raw HTML stays inert; credential-bearing, script and relative links remain text. This is Markdown authoring with formatted preview, not a collaborative WYSIWYG editor. Editor state resets when switching documents; empty slides and nullable text selections are handled safely.

## Engineering, business and creative review

Engineering, Finance and Creative now share ordered revision review. A request snapshots the exact current entity, author and distinct reviewers. Each review step requires a rationale, follows the assigned order and records its timestamp. Content changes make old reviews stale; stale or terminal reviews cannot accept further decisions. Review withdrawal and earlier snapshots remain visible. All reviewer identities and decisions are locally supplied; these records do not grant server permissions or perform external actions.

Engineering release readiness checks the repository URL, branch, relative file paths, release/rollback notes, passing reported checks and evidence. Repository inspection has a typed, disconnected service interface with response validation, loading/error/retry states, file filtering and provider check display. Responses must match the requested repository/ref and obey path, duplicate and size limits. Command execution remains unavailable and its required isolation/authorization boundaries are explained.

Finance review captures financial documents without changing existing exact minor-unit calculations, reconciliation or status evidence. Creative review requires rights information, complete variants and accessibility descriptions. Delivery retains customer-scoped handoff previews/exports; Operations retains evidence-backed checklist completion. Neither local review nor export claims authenticated customer delivery, payment or publication.

## Evaluation and scenario work

Evaluation adjudication records a separate reviewer finding, rationale, evidence snapshot and whether original labels were revealed. Findings never silently overwrite original trials or aggregate reports. Changed trial/context evidence marks prior findings stale. Initially masked labels reduce priming but are explicitly not secure blind evaluation; local records and evidence may reveal identity. Distinct author/reviewer names are required but cannot be authenticated without the backend.

Scenario design/branching/comparison and improvement review/history remain available after strict type conversion. Whole-evaluation revision reviews are available alongside per-trial adjudication.

## Type safety and compatibility

Eight product screens are now strict TSX: Documents, Knowledge, Engineering, Creative, Finance, Delivery, Operations and Experiment Workspace. Business and experiment computation/validation modules are strict TypeScript. Existing JSX/JS entry files are thin re-export facades for compatibility. New research, ingestion, review, adjudication and repository modules and persisted collections have typed contracts and runtime validators.

The overall main shell, legacy Workbench, and some unrelated domain helpers remain JavaScript. Full-application conversion and the architecture-wide release checklist remain Phase 5/6 work. This phase does not certify whole-product completion or production security.

## Recovery and verification

The interrupted temporary checkout was no longer present on resumption. Phase 4 edit commands were recovered from this chat's own tool history into a persistent checkout at `Documents/Codex/2026-10-06/what/mindineers-phase4`, based on GitHub commit `e0660e5`. Verification was rerun against the recovered files.

Automated coverage includes source import limits/deduplication, exact evidence matching and stale research handoffs, ordered review and stale revisions, release path validation, repository-response identity checks, separate adjudication and unsafe Markdown rendering. The original 71 tests are retained, with 10 product-workflow tests and six new server-render cases.

Browser acceptance performed before the interruption covered ingestion → research → reviewed document handoff and reload persistence. Browser testing also found and fixed a Vite startup import-order issue (`lazy` used before its generated initialization). After recovery, all 81 tests, strict type checking and production build passed again. Focused browser acceptance additionally covered engineering stale-revision decisions, mobile Research at 390 × 844, keyboard focus and both themes. A duplicate sibling React key discovered during tab switching was fixed and rechecked. Final verification results and limitations are recorded in VERIFICATION.md.

No backend implementation, live provider connection, hosted Vercel deployment or external business action is included. The existing Vercel deployment configuration is retained.
