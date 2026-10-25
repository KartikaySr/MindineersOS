# Phase 5 acceptance checklist

Implementation reconciled against the tracked FRONTEND_PHASES.md and FRONTEND_STATUS.md on 25 October 2026. This checklist is not a certification of the original full product vision.

## Implemented and automatically checked

- [x] Independent per-entity settings with scope-default compatibility.
- [x] Mandatory ancestor precedence and explicit conflicting overrides.
- [x] Guarded settings undo/reset and shared workspace undo/redo.
- [x] History limits, replacement isolation and stale asynchronous-save rejection.
- [x] Strict migration of the remaining dedicated domain screens, including workflow, public website and office renderer.
- [x] Empty/restored component rendering, domain contracts, runtime import validation and production build.
- [x] Responsive/focus/selected-state implementation and keyboard-reachable import inputs.

## Browser matrix — pending, not passed

Local browser use remained disabled in Work settings. Run these checks in a new synthetic acceptance workspace when access is available. Preserve the user's existing workspaces.

- [ ] Desktop 1440×900, mobile 390×844 and narrow 320 px: settings, dashboard, CRM, calendar, workflow, documents and conversations have no page-level horizontal overflow. Tables/code may scroll within their containers.
- [ ] Light and dark themes: readable text, error states, policy conflicts, selected controls and visible focus. Check zoom/reflow and reduced-motion behavior.
- [ ] Settings: create two agents, select their targets independently, save different concurrency values, verify reload persistence, then make organization concurrency mandatory. Both descendants show the effective value and their conflicts. Reset removes only the selected override.
- [ ] Settings: invalid timezone/numeric input cannot save; validation is associated with the input. Scope/target changes cannot apply an old target's undo.
- [ ] Recovery: create/edit/archive a synthetic record, inspect the confirmation, undo and redo. Rapid typing groups into one step, while distinct operations remain separate. A new edit after undo clears redo.
- [ ] Isolation: open another workspace, import a backup, accept an incoming tab copy, and reset. Old history and pending asynchronous callbacks cannot write into the replacement workspace.
- [ ] Failure handling: storage-full save error remains visible and supports export/retry; unresolved cross-tab/corrupt-data recovery disables undo/redo. Do not destroy real user data to test this.
- [ ] Keyboard: open mobile navigation, cycle Tab/Shift+Tab, press Escape, and verify focus restoration. Navigate to another route and verify focus moves to main. Open nested native dialogs and confirm the drawer does not trap their focus.
- [ ] Keyboard: activate trace/backup imports, settings categories, workflow sections and view switches. Escape closes dialogs. Recovery cancellation leaves data unchanged.
- [ ] Screen reader: verify control names, current-page/pressed states, settings validation, effective policy values, recovery announcements and dialog titles with VoiceOver or NVDA.
- [ ] Office: normal and reduced-motion rendering, WebGL unavailable fallback, resize, route teardown during asset loading and the parallel keyboard-accessible agent controls.

## Explicit later boundaries

- Phase 6: main.jsx and remaining JavaScript runtime audit, broader end-to-end coverage, performance/bundle budgets, Node 24 and hosted Vercel verification, full security/accessibility release review.
- Backend approval: identity, authorization, policy enforcement, live agents/tools, secret storage, synchronization, billing and database persistence.
- Full architectural parity still includes the connected interfaces and expanded workflows listed in FRONTEND_STATUS.md. Completing this implementation does not turn disconnected services into working integrations.
