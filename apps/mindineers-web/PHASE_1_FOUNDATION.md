# Phase 1 — frontend foundation

Completed implementation: 24 October 2026. Phase 2 requires the owner's explicit approval. No backend or database was implemented.

## Delivered

- Strict TypeScript build gate: strict null/unknown checks, unchecked-index checks, exact optional properties, unused-code checks and compile-time contract regressions. `npm run build` runs type checking before bundling; `npm run verify` runs the full verification sequence.
- Typed bootstrap, route registry and route hook. Unknown routes remain explicit; title handling is centralized. Navigation mode is keyed to the route so the previous screen's mode does not bleed into a new route. The accessibility anchor does not become a product route.
- Workspace/product contracts, typed local repository, validated index writes, duplicate-index rejection, safe workspace keys, preserved corrupt reads and a 10 MB record limit. Existing storage keys and backups remain compatible.
- Typed IndexedDB file adapter with transaction-abort handling, connection cleanup, missing-file errors and object-URL cleanup.
- Shared typed Button, Field, Dialog, view controls and empty states. Existing domain imports use a thin facade. Dialog cleanup restores focus to a connected element; buttons default to non-submit behavior.
- Shared loading/error/retry states, per-route recovery, and an always-visible save-failure banner with export/retry actions independent of notification preferences.
- Cancellable resource loading with key/generation checks: stale resource results cannot overwrite a newly selected artifact. The file preview uses this boundary and does not execute active documents.
- Typed optional HTTP transport with response decoding, size/time limits, safe public errors, cancellation, API-path restrictions, same-origin credentials and explicit CSRF tokens for writes. No automatic write retries. The default transport is disconnected; no live API has been enabled.
- Migrated imported-data safety and document-proposal logic to typed modules behind compatibility exports.

## Migration scope and limits

This is an incremental migration, not a declaration that the entire application is TypeScript. `src/app/*.ts(x)`, `src/shared/**/*.ts(x)` and their contracts are checked strictly. Existing domain screen JSX, `main.jsx` and the older runtime validators remain JavaScript (`allowJs: true`, `checkJs: false`). Runtime validation still guards imported data, but legacy JavaScript callers do not receive the same compile-time guarantees as migrated code.

Domain screens should be converted as their remaining requirements are completed in subsequent phases. Do not use `any`, `@ts-nocheck`, or fake ambient declarations to make conversion appear complete. Contract-only `@ts-expect-error` examples intentionally verify that invalid inputs fail compilation.

The local data types describe the current frontend storage model. They are not generated server API contracts and do not authorize backend implementation. The HTTP adapter is infrastructure for later integration, not authentication or authorization enforcement.

## Verification

- `npm run verify`: strict typecheck, 58 automated tests and production build pass.
- Tests cover local isolation/recovery, invalid indexes, response validation, redacted errors, cancellation/timeouts, no implicit write retries, CSRF requirements, path restrictions, route registration and existing domain logic.
- Server rendering covers existing screens plus the shared loading/error/save-failure/form controls.
- Browser acceptance was attempted against the production preview, but Work settings disabled local browser use. No new interactive acceptance claim is made for this phase.
- Node available locally: 22.23.2. Deployment remains configured for Node 24. The optional Three.js office still emits a bundle-size warning.

## Phase 2 boundary

Await approval before account/organization journeys, permission-aware administration, integration lifecycle and billing-interface expansion. Existing UI behavior remains local until backend services are separately authorized and implemented.
