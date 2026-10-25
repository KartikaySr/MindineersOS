# Frontend verification — 24 October 2026

51 automated tests pass, including dashboard priorities, Core navigation invariants, profile/backup validation, CRM CSV/mapping/merge, review routing/expiry, named workflow ports and nested graph/depth validation, plus existing workflow, storage, approval and spreadsheet checks. Server rendering covers empty/populated product workspaces and 25 additional entry/discovery/business/security surfaces.

The production build succeeds with the available Node 22.23.2; the app targets Node 24 (previous revision also built on Node 24). Main product modules now load on demand. The optional Three.js office still produces a large-chunk warning. No hosted Vercel deployment has been verified.

## Browser checks completed this revision

- Light and dark public landing pages; mobile landing layout.
- Isolated test workspace setup, role selection, persisted setup step/preferences after reload.
- Guided tour launch, pause and resume at the saved step.
- Profile save and reload persistence; dashboard focus reflected saved profile.
- Dashboard section hiding and ordering; mission quick capture through full mission editor and resulting priority row.
- Core briefing, subsequent request and navigation into workflows.
- Mobile dashboard and drawer; mobile header overflow identified and corrected.

A Core effect returned a non-cleanup value and crashed on a second response; fixed and retested successfully.

## Still unverified

Browser access became disabled later in the session. Final regression after lazy loading, CRM import/merge UI, review routing UI, nested workflow editor, avatar upload, account form submission, keyboard-only and screen-reader coverage still need browser acceptance testing. Pure logic and server rendering tests do not substitute for these checks.

Authentication, OAuth, live execution, cloud collaboration, database persistence and billing remain outside this frontend implementation.

## Business/security expansion acceptance

Automated cases now also cover exact currency arithmetic, reconciliation transitions/evidence, customer export scoping, evaluation exclusions and intervals, promotion gates, stale document suggestions, imported-data key/depth limits, duplicate product IDs, credential-bearing URL rejection, and draft-07 schema structure/reference/complexity validation.

Browser access was restored for this expansion. Against the production build with deployment CSP headers on port 5174, in the isolated “Frontend acceptance · 24 Oct” workspace:

- Created an invoice with three units at $0.10 and 7.25% tax; verified $0.30 subtotal, $0.02 tax and $0.32 total.
- Recorded submission evidence and verified amount/document fields became disabled.
- Created a document, selected its content, saved and applied a replacement suggestion; verified the replacement and automatic checkpoint.
- Created an incident record and verified missing owner/evidence/timeline fields block status updates.
- Inspected mobile incident layout at 390 × 844 with no horizontal overflow.
- Captured browser error logs after these flows: no errors recorded.

This is focused acceptance, not comprehensive end-to-end coverage. Full financial reconciliation, all delivery-sharing permutations, evaluation forms, evidence-map interactions, screen readers and all device breakpoints still need browser regression. The latest npm dependency installation reported zero known vulnerabilities; this is not a security certification.

## Phase 1 foundation — 24 October

`npm run verify` passes: strict TypeScript checking, 58 automated tests, and production build. Type checking covers the new app/shared TypeScript modules; legacy JSX is not yet checked. Transport tests use injected fetch responses and never contact a backend. Existing recovery tests were strengthened to require invalid indexes to fail before writing. Server-render coverage includes eight shared-control/recovery cases.

Browser regression was attempted again but local browser use was disabled in Work settings. Earlier browser results above belong to the preceding revision. Phase 1 shared-control, routing and file-preview changes still need interactive regression when browser access is restored.

## Phase 2 administration — 24 October

`npm run verify` passes with 64 tests, strict TypeScript checks and the production build. Nine additional server-render cases cover organization/lifecycle/billing/permissions/sessions and four identity intents. Unit tests verify draft validation, identity expiry and response validation, disconnected-service behavior, permission expiry/denial and guarded lifecycle/billing requests. Browser inventory explicitly reports local browser use disabled, so no new interactive acceptance is claimed. The main bundle is approximately 499 kB minified; the optional Three.js office remains above the warning threshold.

## Phase 3 execution interfaces — 24 October

Strict TypeScript checks, 71 tests and the production build pass. Seven execution tests and five additional server-render cases cover canvas/diff/trigger/run interfaces and malformed trace/acknowledgement rejection. The browser inventory again reports local browser use disabled; no interactive or mobile acceptance is claimed. Main and optional office chunks exceed 500 kB minified. See PHASE_3_EXECUTION.md for boundaries and remaining release gates.

## Phase 4 product workflows — 25 October

The recovered persistent checkout passes `npm run verify`: strict TypeScript checking, all 81 tests and the Vite production build. Ten new product-workflow tests cover bounded/deduplicated ingestion, exact source quotes, stale document handoff, sequential review guards, repository response validation, path traversal rejection and separate adjudication. Six additional server-render cases exercise the new interfaces and verify that Markdown HTML/script links remain inert.

Focused interactive acceptance used an isolated local workspace named `Phase 4 acceptance · 25 Oct` with explicitly synthetic evidence:

- Imported supplied text, reviewed an exact-quote research brief, created a separate document snapshot and restored the reviewed state after reload.
- Prepared an engineering review, changed its branch to verify stale-state blocking, restored the exact revision and recorded local acceptance. No external operation was performed.
- Fixed a Vite dev startup import-order error and a duplicate sibling React key that retained the old file editor after switching tabs; verified the file editor is absent on Checks after the fix.
- Inspected Research at 390 × 844 in the light theme, verified no horizontal page overflow and keyboard focus movement, then reset the viewport and inspected the dark theme. Saved desktop/mobile evidence outside the repository in the task workspace.

This is focused acceptance, not a whole-app end-to-end or screen-reader certification. Connected repository/CI, authentic reviewer identities, payments, external publication and secure blind evaluation remain unverified and disconnected. Local verification used Node 22.23.2; deployment configuration targets Node 24 and still needs hosted acceptance. Main (~517 kB) and optional Three.js office (~580 kB) chunks exceed the build warning threshold. Backend/database work and hosted deployment were not started.

## Phase 5 — 25 October 2026

`npm run verify`: strict typecheck, 94 tests, production build pass. Expanded server rendering covers 38 domain cases and 70 entry/component cases. Added tests check workspace undo/redo, same-field typing grouping, separate action history, stale callbacks after restore/workspace replacement, history bounds and invalid restored domain fields. Matching Three.js type definitions were installed with lifecycle scripts disabled; npm reported zero vulnerabilities at install time.

Interactive browser access was attempted repeatedly after the user offered to enable it. The tool still returned “Local browser use is disabled in Work settings.” The desktop/mobile, focus, screen-reader and WebGL matrix in PHASE_5_ACCEPTANCE.md is therefore pending. Earlier Phase 4 browser evidence does not validate these Phase 5 changes. Main/office bundle warnings remain. Node 22.23.2 was used locally; Node 24 and hosted deployment remain unverified.
