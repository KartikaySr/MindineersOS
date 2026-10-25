# Phase 6 — release engineering and acceptance

Updated 25 October 2026. Implementation delivered; full frontend acceptance remains open. Backend/database work has not started.

## Delivered

- Lazy-load the workbench, conversations, artifacts, calendar and customers. Suspense covers both workbench and overview route branches.
- Run the release checks in a scoped GitHub Actions workflow on main pushes and pull requests.
- Require Node 24 for `verify:release`. Run strict checking, tests, production build, asset gates and the explicit type-boundary audit.
- Enforce 160,000-byte initial JavaScript and 180,000-byte individual JavaScript gzip budgets. Keep the 3D office outside the initial static import graph.
- Generate `dist/release.json` with asset hashes and sizes. Verify repository/app deployment headers agree when both configurations exist; standalone frontend builds remain supported.
- Provide read-only hosted verification for HTML, referenced assets and security headers, with `--match-local` checking every deployed asset against the local build.
- Mount the real application in JSDOM across all non-office routes; exercise settings persistence and confirmed undo/redo. Clean up React MessageChannel ports after tests.
- Reject duplicate IDs across legacy workspace collections and reject credentials/control characters in legacy evidence links.
- Generate a type-boundary report separating strict TypeScript, compatibility facades, generated code and unchecked handwritten JavaScript. `--require-complete` fails while unchecked code remains.

## Evidence

On Node 24.22.1, `npm run verify:release` passes 97 tests, strict checking, production build and asset/header gates. Initial JavaScript is approximately 133 kB gzip, down from approximately 155 kB. There are 27 hashed build assets. The optional office retains Vite's raw chunk-size warning, while passing the compressed-size budget. These budgets measure transfer size, not interactive performance or Core Web Vitals.

The type audit finds 81 TypeScript files, 41 compatibility facades, 12 unchecked handwritten JavaScript files and one generated JavaScript file. File counts do not measure feature completeness. The remaining handwritten files are `data.js`, `experience-model.js`, `fields.js`, `icons.js`, `main.jsx`, `product-model.js`, `resources.js`, `review-routing.js`, `schema-validation.js`, `storage.js`, `workbench-model.js` and `workbench-schema.js`.

Hosted HTML, referenced assets and all configured security headers passed at https://www.mindineers.com before this release. Phase 6 was pushed as commit 0930df8. After Vercel completed deployment, `verify:hosted -- https://www.mindineers.com --match-local` passed: hosted HTML, configured security headers and all 27 asset hashes match the locally verified build. GitHub CLI lacks authentication, so remote CI status could not be read; local release checks passed.

Browser access became available during final acceptance. Against the current local production build on port 5186 with deployment headers, an isolated “Phase 6 acceptance” workspace passed onboarding with labeled examples, language setting save, confirmed undo/redo and reload persistence. At 390 × 844, settings had no horizontal page overflow; drawer opening focused its close control, reverse Tab wrapped to the final profile control, and Escape restored focus to Open navigation. Light/dark settings and desktop WebGL office rendering were inspected. No console warnings/errors were captured in these flows.

This is focused acceptance, not a full cross-browser, screen-reader or device certification. JSDOM adds regression coverage but does not replace real browser checks. The remaining manual matrix in PHASE_5_ACCEPTANCE.md stays open.

## Reproduce

From `apps/mindineers-web`, on Node 24:

```sh
npm ci --workspaces=false
npm run verify:release
npm run verify:hosted -- https://www.mindineers.com --match-local
npm run audit:types -- --require-complete
```

The final command intentionally fails until the remaining unchecked source is migrated. Reports and build output are generated locally. Hosted matching requires this build to have deployed; a different build is a failure, not a reason to skip comparison.

## What remains before full frontend completion

1. Migrate the main shell and remaining handwritten JavaScript, preserving validated backup compatibility and existing behavior.
2. Complete desktop/mobile, keyboard, screen-reader, light/dark, persistence, recovery and WebGL browser acceptance; fix any resulting failures. Measure browser performance beyond bundle size.
3. Close frontend-specific architectural gaps: richer document editing and preview formats, collaborative attribution/conflict surfaces, customer portal journeys, richer procurement review and field-level revision highlighting.
4. Finalize connected-service contracts and finish the corresponding frontend loading/error/permission/acknowledgement paths against those contracts. Authentication, provider lifecycle, live runs, sync, billing and secure sharing cannot be accepted as working cloud features until services exist.

FRONTEND_STATUS.md remains the detailed scope inventory. The six delivery phases have added substantial implementation, but their completion is not proof that every original architectural requirement is implemented. A defensible overall percentage requires a requirement-by-requirement acceptance checklist; none is claimed here. No production-readiness or zero-bug guarantee is made.
