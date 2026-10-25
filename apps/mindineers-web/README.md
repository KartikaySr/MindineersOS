# MindineersOS frontend

A React workspace for projects, missions, agent profiles, workflows, documents, research, and business operations. This application deploys as a static Vite site. It does not start a backend or database.

## Run locally

Use Node 24 and npm:

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

The dev command prints the available local URL. If port 5173 belongs to another application, Vite selects the next available port. Browser data is scoped to that URL's origin.

## Deploy on Vercel

### From the MindineersOS repository

Import `KartikaySr/MindineersOS`, leave **Root Directory** at the repository root (`.`), and deploy. The root `vercel.json` installs only `apps/mindineers-web`, builds that app, and serves its `dist` directory. It deliberately bypasses the root Bun workspace and its backend postinstall scripts. No API keys, database URLs, or backend environment variables are required.

For an existing Vercel project, set Root Directory back to `.` if a different folder was previously selected. An old project configuration may need to be reset before retrying deployment. The frontend uses hash routes, so URLs such as `/#workflows` reload without an SPA rewrite.

### From this standalone folder

Import this directory as a repository root. Its own `vercel.json` uses `npm ci`, `npm run build`, and `dist`.

A local production build has been verified. A hosted Vercel deployment must still be confirmed in the user's account; a successful local build does not prove a hosted deployment.

## Public website and personal experience

The default URL now opens the public landing page; `/#home` opens the personal command center. `/#profile` edits the local profile and appearance. Account entry routes are `/#sign-in`, `/#sign-up`, `/#recovery` and `/#join`; cloud identity remains unconnected.

The two-phase delivery adds light green/luxury dark themes, resumable setup, dashboard customization, a six-step guided tour, and a persistent Core guide for local navigation and saved-record briefings. See [TWO_PHASE_DELIVERY.md](TWO_PHASE_DELIVERY.md) for exact scope and verification. CRM import/merge and review routing are now dedicated interactions.

## Working features

- Independent on-device workspaces, recovery of damaged stored data, explicit cross-tab conflict handling.
- Searchable integration catalog with account labels, requested scopes, and region preferences; no secret collection.
- Artifact library with upload, image/text preview, review status, tags, archive/restore and download.
- First-use setup, optional example data, light/dark themes, reduced motion, responsive navigation, and global record search.
- Projects and agent profiles with create/edit controls.
- Mission board, list and date timeline; owner/search filters; drag-and-drop and keyboard-accessible status controls; dependencies, priority, deadline, and acceptance criteria. Completion is blocked while criteria or dependencies remain open in the mission planner.
- Conversation threads, saved drafts, project context selection, pinned decisions, and message-to-mission conversion. Earlier drafts can be imported into a thread.
- Workflow graph/list editor with node types, dependencies, retry/timeout validation, cycle detection, and saved graph versions.
- Detailed module workspaces with searchable record lists, configuration sections, linked records, checklists, comments, version comparison/restore, and JSON export.
- Document preview and Markdown export, evidence registers, manually entered evaluation trials, and deterministic invoice draft calculations.
- Calendar month/agenda views, meeting notes, time conflict warnings and follow-up mission creation; CRM pipeline/contact views, duplicate warnings, timeline entries and CSV export.
- File upload/download using IndexedDB; workspace JSON backups include metadata and records, but not uploaded file binaries.
- Scope inheritance designer for organization/workspace/project/agent/run defaults. These drafts do not enforce server policy.
- Optional Three.js office with keyboard-accessible agent controls and imported furniture/portrait resources.
- Source library documenting all ten supplied archives and their reuse/license boundaries.

## Dedicated product workspaces

The latest frontend adds document, sheet and slide editing with comments and checkpoints; version-bound local approval reviews; knowledge excerpts and memory review; engineering change proposals with supplied file diffs and manual check evidence; creative variants and publication planning; member, role and policy drafts; subscription preferences; model/device profiles; imported execution traces with task graphs, events, artifacts and checkpoints; and searchable help with a content-free diagnostic export.

These are local product interactions. They do not grant permissions, execute changes, publish content, charge subscriptions or run models. Workflow drafts also validate JSON schema syntax and basic edge type compatibility. The optional 3D office respects reduced motion and avoids rebuilding its scene for unrelated edits.

## Backend boundary

AI responses, agent execution, live run controls, authentication, permissions, OAuth, team presence, cross-device sync, external publishing, billing, and verified telemetry are not connected. Their screens must not imply successful execution. No simulated execution engine is shipped. Example records are ordinary editable data and are identified in the header when included during setup.

The browser persistence layer is intended for frontend use and development before backend integration. It is not an enterprise authorization boundary or a multi-user database. Do not put provider secrets in frontend environment variables or local storage.

## Scope status

This is an expanded frontend implementation, **not yet a verified completion of every requirement in the full-scope architecture**. Some enterprise modules currently provide structured configuration/review workspaces rather than their final specialized interactions. See `FRONTEND_STATUS.md` for remaining frontend work; adding backend endpoints alone does not finish those gaps.

The code currently uses JavaScript/JSX. A strict TypeScript migration and broader automated accessibility/end-to-end coverage remain outstanding. The optional Three.js chunk is lazy loaded and still emits a bundle-size warning.

## Source structure

- `src/main.jsx`: application shell, existing overview screens, local state and dialogs.
- `src/MissionPlanner.jsx`: mission planning and completion review.
- `src/Conversations.jsx`: conversation and context workspace.
- `src/Workbench.jsx`: detail workspaces, versions, workflow editor, invoice/evidence/trial tools, scoped settings.
- `src/workbench-model.js`: pure validation and calculation helpers.
- `src/workbench-schema.js`: module sections and setting definitions.
- `src/storage.js`: imported-backup validation.
- `src/files.js`: local binary storage.
- `src/Office.jsx`: optional 3D view.
- `tests/`: invariant and backup validation tests.

See `THIRD_PARTY_NOTICES.md` before redistributing imported resources commercially. Framework references are not running framework integrations.

## Business and security workspaces

Finance now supports invoices, expenses, procurement requests and documented reconciliation. Delivery provides customer-scoped previews, acceptance and progress updates. Operations adds repeatable checklists. Evaluations, scenarios and improvement reviews have dedicated interfaces for comparison and evidence. Knowledge includes an evidence map; documents support selected-text suggestions with stale-edit protection. Security includes incident response and access-review records.

These records remain local until the backend is connected. Status labels never imply payments, publishing, deployment, access revocation or agent execution occurred.

Production deployment includes a Content Security Policy without inline scripts or eval, frame restrictions and a restrictive Permissions Policy. The local production preview applies the same headers. Schema checks are pre-generated with `npm run generate:schema`; regenerate and commit `src/generated/schema-meta.js` when changing the validator. The frontend validates backup structure, rejects unsafe keys/duplicate product IDs, and bounds schema complexity. See [SECURITY_FRONTEND.md](SECURITY_FRONTEND.md) for security boundaries and remaining acceptance work.

## Phase 1 foundation

The typed foundation lives in `src/app` (bootstrap/routing) and `src/shared` (contracts, repository/transport adapters and UI controls). Run `npm run verify` for strict type checking, tests and the production build. Existing domain JSX is still supported through compatibility exports; it is not yet fully type-checked. See [Phase 1 delivery](PHASE_1_FOUNDATION.md) and the [approval-gated phase plan](FRONTEND_PHASES.md).

Storage failures now stay visible with export/retry actions, even when ordinary notifications are disabled. Local backup and workspace key formats remain compatible. The optional typed HTTP transport is disconnected by default and does not start backend services.

## Phase 2 identity and administration

Account entry now has a typed, service-ready identity journey. Security adds Organization and Effective access tabs plus an acknowledgement-based session interface. Integration inspectors include lifecycle review requests. Usage & billing adds Manage subscription with profile/change-request drafts. All cloud services remain disconnected by default; no grants, revocations, accounts, emails, or purchases are simulated as completed. See [Phase 2 report](PHASE_2_ADMINISTRATION.md).

## Phase 3 multi-agent environment

Workflow Studio adds a visual dependency canvas, configuration comparisons and trigger drafts with supplied history. Runs adds read-only dependency inspection, event replay, checkpoint continuation plans, partial-artifact labels, incident associations and service-ready runtime controls. Strict trace validation protects import and restore boundaries. Execution remains disconnected; local plans and evidence never claim live agent actions. See [Phase 3 report](PHASE_3_EXECUTION.md). Phase 4 was subsequently delivered.

## Phase 4 product workflows

Knowledge ingestion → research brief → reviewed document now forms a usable local workflow. Exact source evidence, contradictory claims, revision-bound review, release-readiness checks and separate evaluation adjudication preserve context without claiming backend execution. Eight product screens and the business/evaluation models now use strict TypeScript. See [Phase 4 delivery](PHASE_4_PRODUCT_WORKFLOWS.md) and [verification](VERIFICATION.md). Phase 5 implementation is delivered below.

## Phase 5 settings, recovery and polish

Settings support independent entity overrides and mandatory-rule conflict previews. Shared, bounded workspace undo/redo protects against stale saves and resets editors on restored data. The remaining 25 dedicated screen implementations are strict TypeScript, including the workflow studio, personal experience and 3D office. Mobile focus handling, selected-state announcements and keyboard import access have been improved.

Strict checks, 94 tests and the production build pass. Browser acceptance remains pending because local browser use is disabled. See [Phase 5 delivery](PHASE_5_SETTINGS.md) and the [acceptance checklist](PHASE_5_ACCEPTANCE.md). Phase 6 release work requires explicit approval; backend/database work remains separately gated.
