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
