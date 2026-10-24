# Phase 3 — multi-agent environment interfaces

Implemented 24 October 2026 following explicit approval. Phase 4 requires approval; backend/database implementation remains untouched.

## Workflow studio

The existing node/port/subflow editor now includes a dependency canvas with directed edges, named port labels, zoom, automatic dependency-based layout, keyboard node movement, and persisted node positions. A selectable list remains available below the canvas. Version review compares the current field/graph configuration against a selected snapshot and shows additions, removals and changed values. Arrays are compared as whole values.

Workflow-scoped manual, schedule and event trigger drafts persist separately. Draft validation checks JSON object payloads, unsafe keys, required event types and IANA timezones. Editing resets review readiness. Schedule expressions are descriptions pending runtime validation, not active schedules. Manually entered observed/failed/rejected/duplicate evidence is labeled unverified; runtime activation and deduplication are not implemented.

Removed an erroneous nested-workflow fragment from the legacy evaluation-trials component that referenced undefined variables. Correct subflow editing remains in the workflow editor.

## Run review

Run dependencies use the same canvas in read-only mode. Existing worker, event, artifact and checkpoint inspectors remain. Artifacts optionally carry source-reported Partial/Complete metadata and a node reference; partial outputs are explicitly identified as incomplete. Source claims are not authenticated.

Replay & plans steps through timestamp-ordered recorded events without changing authoritative node state or executing agents. Checkpoint continuation drafts capture the source run/checkpoint, source mode, reason, allowed scope, budget ceiling and creation time. Saving a plan starts no execution. Related incidents match exact run IDs in locally entered incident scope and link to Security for review.

Controls exposes Pause/Resume/Cancel with a required reason and cancellation confirmation. Its typed runtime interface defaults to disconnected, and an authenticated-live-record flag is additionally required. Matching request/run/action acknowledgements and compatible statuses are checked before displaying a result. Requests cancel on unmount and time out after 30 seconds with an unknown-outcome message; there is no automatic retry or optimistic run-state mutation. Server authorization, idempotency and telemetry refresh are still mandatory when integration is implemented.

## Import and persistence boundaries

Trace import and workspace restoration share a typed validator. It rejects unsafe keys, excessive structure, duplicate/empty identifiers, missing/self/duplicate node dependencies, dependency cycles, invalid timestamps, invalid checkpoint/event/artifact references and unknown artifact completeness states. Trigger and continuation collections have typed contracts and runtime shape validators. Canvas coordinates are finite and bounded on import.

Imported evidence remains untrusted; none of these records grant execution rights. Budget values are planning constraints, not enforced spend limits. Browser storage does not provide enterprise access control or secret storage.

## Verification and remaining acceptance

Strict TypeScript checks, 71 automated tests and the Vite production build pass. Seven new execution tests cover graph layout, configuration changes, malformed trace rejection through both import and persistence, replay ordering, trigger validation, runtime acknowledgement matching and planning-only states. Five new server-render cases cover canvas/diff/trigger/replay/control surfaces.

Local browser inventory still reports browser use disabled in Work settings, so interactive, keyboard, responsive and visual acceptance is unverified. The main bundle is about 510 kB minified and the optional Three.js office about 580 kB; both trigger the build warning threshold. Performance optimization and release acceptance remain open.

New execution modules are strict TypeScript; the existing Workbench and RunWorkspace parent shells remain JSX. No hosted Vercel deployment was performed during this phase. The production build succeeds with the existing deployment configuration. This delivery does not claim completion of the whole frontend architecture or production-security certification.
