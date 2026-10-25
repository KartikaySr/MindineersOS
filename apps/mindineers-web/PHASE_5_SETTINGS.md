# Phase 5 — implementation delivered; browser acceptance pending

25 October 2026. Frontend only. Phase 6 and backend/database implementation have not started.

## Settings and policy drafts

The strict TypeScript settings designer supports separate project, agent and run overrides while preserving existing organization/workspace defaults. Entity selections form an explicit preview hierarchy, not verified organizational relationships. Removed entities no longer remain selectable targets.

Each field shows its effective value and source. Mandatory ancestor drafts retain precedence, identify conflicting descendants, and prevent editing a conflicting value until its override is removed. This is a policy preview; enforcement requires the backend. Inputs have numeric limits, timezone checks, explicit save/reset, linked validation messages, and guarded single-edit undo. Switching targets clears this small undo history.

## Consistent workspace recovery

All edits through the shared workspace update boundary participate in undo/redo, including documents, tasks, customer records, workflow configurations, settings and local review records. Recovery has a confirmation dialog showing affected areas and refuses to apply a preview if the workspace changed after it opened.

- Up to 20 snapshots, bounded by an 8 MB serialized-size estimate, remain in memory. This is not a guarantee of total JavaScript heap usage.
- Consecutive typing in the same text field is grouped for 800 ms. Creates/deletes, multiple-field edits and toggles are separate operations.
- A new edit clears the redo branch. A snapshot over the size budget may leave no undo/redo entry; JSON export remains available.
- Undo/redo, imports, external-copy replacement and workspace switches invalidate older asynchronous update callbacks. Open route editors remount on restored data.
- Workspace switches, imports, resets and page reloads clear history. These boundaries do not offer cross-workspace undo.
- Recovery restores record metadata, not uploaded file bytes or external actions. It does not reverse payments, publication or executed agents. Existing file bytes remain in the device's file store.
- Corrupt-storage preservation, persistent save-failure export/retry, and cross-tab conflict decisions remain intact. Recovery is disabled while a corrupt-data or cross-tab conflict decision is unresolved.

## Domain migration

25 remaining screen/component implementations are now strict TSX: AccessReview, AccountExperience, Administration, Artifacts, CalendarWorkspace, Connections, Conversations, Customers, CustomerTools, Decisions, DocumentSuggestions, EvidenceMap, HelpCenter, MissionPlanner, Office, Onboarding, PersonalDashboard, ReviewRouting, RunWorkspace, RuntimeSettings, SecurityIncidents, Welcome, Workbench, WorkspaceGuide and WorkspaceManager.

Existing JSX paths are compatibility re-exports. Customer CSV logic and dashboard/Core queries are also typed. The workflow suite, model/device records, conversations, profiles and record extensions have explicit contracts. Backup validation now rejects malformed optional record text and workflow configuration fields. Matching Three.js type definitions are pinned at 0.180.0; late-loaded asset disposal now releases textures, and zero-size viewports skip resizing.

The application shell in main.jsx, existing data/schema definitions and some runtime validators remain JavaScript. This is an explicit Phase 6 whole-app audit boundary, not a claim that the entire application is TypeScript. No `any`, `@ts-nocheck`, or fake third-party declarations were added to make these screens pass.

## Responsive and accessible interaction

- Mobile navigation focuses its close button, traps Tab/Shift+Tab, restores focus on closing, locks background scrolling, and leaves native dialogs to manage their own focus.
- Route changes focus main content. Navigation exposes current-page state; workspace modes and domain view selectors expose pressed state.
- Trace and backup imports remain keyboard reachable. Settings errors are linked to their inputs. Recovery changes use a status announcement.
- Settings controls wrap at narrow widths; checkboxes retain usable dimensions; policy selection colors support both themes; forced-colors focus/selection rules are included.
- Workflow section navigation uses a labeled button group rather than claiming incomplete ARIA tab behavior. Native dialogs retain Escape and focus restoration.

## Verification and remaining acceptance

`npm run verify` passes strict TypeScript checks, 94 automated tests and the production build. Server rendering covers 38 domain render cases and 70 additional entry/component cases, including empty/restored settings, all migrated domain screens, recovery controls, workflow modes and the office shell. Recovery tests exercise stale callbacks, redo branches, typing grouping, replacement boundaries and history limits. Existing product, administration, trace, schema, storage and security-input regressions pass.

Interactive browser testing was attempted after the user offered to enable it, but the browser tool continued to report “Local browser use is disabled in Work settings.” No new desktop/mobile screenshot, keyboard, WebGL or screen-reader pass is claimed. The manual matrix in PHASE_5_ACCEPTANCE.md remains pending for that reason.

Local checks ran on Node 22.23.2; Vercel targets Node 24. The main and optional office bundles still trigger Vite's 500 kB warning. Hosted deployment, Node 24 verification, performance budgets and full security/accessibility acceptance remain Phase 6 gates requiring user approval.
