# Frontend implementation status

Updated 23 October 2026. Backend/database implementation remains explicitly gated on user approval.

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

## Backend-dependent functions with connection boundaries

Authentication/session recovery, organization permissions, agent/model responses, workflow execution, live run state and controls, real tool approvals, provider connections/OAuth, external calendar sync, multi-user presence, billing, telemetry, verified evaluation runs, external publishing, device workers, retention enforcement, secure search/indexing and synchronization.

## Frontend work still required for full architectural parity

These are real frontend gaps, not tasks that can all be solved by merely adding a backend:

- Strict TypeScript conversion; typed transport adapters and generated API contracts once the backend interface is agreed.
- Cloud organization creation and administration; sign-in, invitation, account recovery and effective-permission interfaces. Local workspace creation/switching with isolated stores is implemented.
- Full workflow named typed ports, full JSON Schema validation, conditional/parallel semantics, nested subflows, trigger history and configuration diff UI. Basic schema/type and concurrency validation is implemented.
- Server-connected run DAG, partial artifacts, acknowledged controls, replay, checkpoints and incident correlation.
- Approval delegation, escalation, snooze and detailed revision diff; version-bound payload review and invalidation are implemented locally.
- Rich document suggestions, selected-region proposals and more artifact preview formats. Basic document/sheet/slide editors are implemented.
- Evidence-map visualization, contradiction linking and knowledge ingestion/sync state. Local source search and memory confirmation/forget are implemented.
- Connected repository tree/CI interfaces and terminal capability boundaries. Local supplied-file diffs/review and creative variant editing/publication drafts are implemented.
- CRM merge/deduplication and import mapping, delivery portal scope, finance reconciliation and procurement-specific interactions.
- Advanced simulation/scenario comparisons, statistical evaluation reporting, improvement promotion/rollback controls.
- Detailed connector/device lifecycle and catalog install/update/revocation. Model/device configuration profiles are implemented; health/resource inspection requires runtime contracts.
- Connected billing/subscription administration, effective permission/access review and security incident UI. Local role/policy/plan preferences are implemented.
- Per-entity settings overrides and mandatory-policy conflict resolution; currently one draft per scope level.
- Collaborative conflict resolution, undo/restore for all actions, offline synchronization, richer loading/error/denied/stale states.
- Comprehensive mobile/keyboard/screen-reader regression coverage and performance budgets.

No claim of complete full-scope or production readiness should be made until these remaining frontend requirements are implemented and verified. Current mock/example content is presentation data, not evidence of executed agents or live integrations.
