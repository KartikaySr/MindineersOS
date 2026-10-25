# Frontend implementation status

Updated 25 October 2026. Backend/database implementation remains explicitly gated on user approval.

## Implemented and usable locally

Independent workspace switching, corrupt-data recovery and cross-tab conflict decisions; searchable integration catalog and access configuration; artifact previews, archive/restore, tags and review states; navigation, mobile drawer, global search; onboarding with optional example content; personal theme/motion preferences; projects and agents; activity posts/comments; file storage/download; calendar month/agenda, event editing, overlap warnings, meeting notes and follow-up missions; CRM pipeline/contacts, duplicate warning, relationship timeline and CSV export; mission board/list/timeline and task dependencies; conversation threads/drafts/context/pins/task extraction; workflow node/dependency editing and validation; document previews/Markdown exports; evidence registers; invoice calculator; evaluation trial records; detail sections, linked work, checklists, comments, version compare/restore; scope defaults and inheritance preview; source resource library; optional 3D office; deployment configuration.

## Dedicated screens added in this revision

- Documents: Markdown editing/preview, quoted comments, version checkpoints/restore; sheets with safe arithmetic and SUM formulas and TSV export; slides with ordering and speaker notes.
- Decisions: payload/destination/scope review, expiry validation, version snapshots and invalidation after revision. Local review only.
- Knowledge: excerpt search, source metadata, archive/restore and confirmed/corrected/forgotten memories.
- Engineering: supplied file before/after comparison, review notes, manual CI evidence and release/rollback drafts.
- Creative: campaign and variant editing, copy preview, accessibility/rights fields and publication readiness.
- Administration: member invitation drafts, custom roles, policy preferences and subscription/budget preferences.
- Runtime settings: model routing and device resource/access profiles.
- Runs and observability: explicit example or imported trace inspection, graph nodes, event filters, artifacts and checkpoints.
- Help: searchable guides and diagnostics that omit record contents and personal details.
- Workflow editing: input/output JSON schema syntax, basic type compatibility, branch conditions, parallel concurrency, merge and failure-policy drafts.

## Entry and personal experience added 24 October

Public landing page with interactive previews/use cases/FAQs; light green and luxury dark themes; account entry and recovery availability screens; editable local profile/avatar; three-step resumable setup; personalized dashboard with saved ordering/visibility; six-step guided tour; Core navigation and saved-record briefing; offline/missing-route notices; lazy-loaded product modules. See TWO_PHASE_DELIVERY.md.

CRM now includes CSV field mapping, validation previews, duplicate skips, reviewed contact merge and guarded undo. Review requests now support local delegation/escalation, routing history, snoozing and revision comparison.

## Business, evidence, and security expansion

- Finance/procurement: invoice, expense and purchase-request documents; exact minor-unit totals for USD/EUR/GBP/INR/JPY/KWD; tax assumptions; locked submitted values; revised drafts; evidence-backed status history; statement/PO reference and exact-amount reconciliation.
- Delivery: customer/project assignment, service targets, sourced requirements, acceptance checklists and evidence, escalation notes, response drafts, internal/shared updates, customer-scoped document previews and export. Customer changes reset sharing and acceptance; exports omit document comments and speaker notes.
- Operations: procedure/onboarding/obligation/supplier/request/policy checklists, ownership, cadence preferences, completion evidence and repeat-cycle history.
- Evaluations: locked evaluation context after first trial, baseline/candidate repetitions, evidence references, exclusions with reasons, adjudication notes, error-inclusive pass rates, Wilson intervals and recorded cost/latency/violations.
- Scenarios: environment/roster/seed/assumption records, intervention timeline, branching and side-by-side comparison. No simulation engine is implied.
- Improvements: before/after proposals, regression/holdout/compatibility/rollback gates, staged promotion and rollback evidence records. No deployment is performed.
- Knowledge: SVG evidence map, support/contradiction/related links, contradiction-resolution notes and an accessible relationship list.
- Documents: selected-range replacement proposals, explicit apply/decline review, stale-revision guards and automatic pre-apply checkpoints.
- Security: incident response records with evidence gates and timelines; access-review snapshots of proposed roles. These are local records, not authoritative security enforcement.
- Hardening: draft-07 schema structure checks generated at build-authoring time (no browser eval), schema size/depth limits, unsafe import-key and duplicate-ID rejection, credential-free outbound URLs, per-route error recovery, restrictive production CSP and Permissions-Policy, and removal of remote font requests.

## Backend-dependent functions with connection boundaries

Authentication/session recovery, organization permissions, agent/model responses, workflow execution, live run state and controls, real tool approvals, provider connections/OAuth, external calendar sync, multi-user presence, billing, telemetry, verified evaluation runs, external publishing, device workers, retention enforcement, secure search/indexing and synchronization.

## Frontend work still required for full architectural parity

These are real frontend gaps, not tasks that can all be solved by merely adding a backend:

- Dedicated domain screens are now strict TypeScript. Finish the main.jsx shell and remaining runtime-validator audit; generate API contracts once the backend interface is agreed. Phase 1 adds a strict typed foundation, workspace contracts, repository/transport adapters, routing and shared UI. See PHASE_1_FOUNDATION.md for the explicit migration boundary.
- Cloud organization creation, connected identity challenge/error/session flows, and effective-permission interfaces. Local workspace switching and account-entry availability screens are implemented; these are not working cloud authentication.
- Runtime payload validation against schemas, conditional/parallel runtime semantics, trigger history, visual edge routing and configuration diff UI. Draft-07 schema structure and local-reference checks are implemented; formats and schema-to-schema assignability are not fully validated. Named ports, endpoint/type checks, nested subflow editing (four levels), schema syntax and concurrency validation are implemented.
- Server-connected run DAG, partial artifacts, acknowledged controls, replay, checkpoints and incident correlation.
- Server-authorized review ownership, timed notifications and field-level revision highlighting. Local delegation, escalation, snooze, before/after comparison and version invalidation are implemented.
- Rich-text editing, collaborative suggestion attribution and more artifact preview formats. Selected-range proposals and stale-edit protection are implemented.
- Knowledge ingestion/sync state and connected evidence retrieval. Local evidence mapping, contradiction resolution, search and memory confirmation/forget are implemented.
- Connected repository tree/CI interfaces and terminal capability boundaries. Local supplied-file diffs/review and creative variant editing/publication drafts are implemented.
- Authenticated customer portal delivery, provider reconciliation/import contracts and richer procurement approval routing. Local customer-scoped exports, finance matching, purchase requests, and delivery reference remapping after CRM merge are implemented.
- Executable scenario environments, independent/blind evaluation adjudication, and connected improvement promotion/rollback acknowledgements. Local comparisons, descriptive evaluation statistics and evidence-gated review records are implemented.
- Detailed connector/device lifecycle and catalog install/update/revocation. Model/device configuration profiles are implemented; health/resource inspection requires runtime contracts.
- Connected billing/subscription administration, authoritative effective permissions and incident telemetry. Local access-review and incident-response interfaces are implemented.
- Per-entity overrides and mandatory-policy conflict previews are implemented. Authoritative entity relationships and enforcement require backend integration.
- Local workspace undo/redo and stale-save isolation are implemented. Collaborative conflict resolution, externally executed action recovery and offline synchronization still need connected contracts.
- Comprehensive mobile/keyboard/screen-reader regression coverage and performance budgets.

No claim of complete full-scope or production readiness should be made until these remaining frontend requirements are implemented and verified. Current mock/example content is presentation data, not evidence of executed agents or live integrations.

## Phase 1 verification

Typed infrastructure implementation is complete and passes type checking, 58 tests and the production build. New browser acceptance is blocked by disabled local browser use; the full-domain migration remains scheduled across subsequent phases. Phase 2 was subsequently approved and implemented as documented below.

## Phase 2 interface delivery

Typed identity challenge/invitation/recovery/session journeys, organization setup drafts, fail-closed permission inspection, session revocation confirmation/acknowledgement UI, provider lifecycle requests and billing management drafts are implemented. All 64 tests, strict typecheck and the production build pass. Browser use was disabled; connected services and interactive acceptance remain unverified. See PHASE_2_ADMINISTRATION.md. Phase 3 was subsequently approved and implemented as documented below.

## Phase 3 interface delivery

Workflow dependency canvas/layout, snapshot comparisons, trigger configuration/evidence, recorded run graph/replay, checkpoint continuation drafts, partial-artifact labels, runtime command interfaces and incident associations are implemented. Import and persistence use the same strict trace validator. All 71 tests, type checking and the production build pass. Browser acceptance remains unverified because local browser use is disabled; parent-shell JSX migration and performance acceptance remain open. See PHASE_3_EXECUTION.md. Phase 4 was subsequently approved and implemented as documented below.

## Phase 4 product workflow delivery

Source ingestion and dedicated research briefs now connect exact evidence to reviewed document snapshots. Revision-bound engineering/procurement/creative/evaluation review and independent trial adjudication preserve local evidence and flag stale revisions. Repository inspection has a typed disconnected service boundary. Eight product screens and business/evaluation models are converted to strict TypeScript. See PHASE_4_PRODUCT_WORKFLOWS.md for scope and remaining architecture limitations. Phase 5 implementation is documented below.

## Phase 5 delivery

Settings, bounded workspace recovery, mobile/keyboard interaction improvements and the remaining 25 dedicated TSX screen migrations are implemented. Strict checks, 94 tests and the production build pass. Server rendering covers 38 domain and 70 entry/component cases. Browser acceptance remains pending because local browser use stayed disabled. See PHASE_5_SETTINGS.md and PHASE_5_ACCEPTANCE.md. The main shell and some legacy helpers remain JavaScript; Phase 6 release acceptance has not started.
