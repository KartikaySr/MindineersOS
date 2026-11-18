# Private workspace directory

The app-core API server registers this directory under `/api/mindineers/workspaces`. Start the existing API host with its SQL plugin and run the normal plugin migrations. The plugin owns the `mindineers_workspaces` table on PGlite or PostgreSQL. Use an existing authenticated browser session from the host. The owner is always the session identity.

| Method | Path suffix | Request | Response |
| --- | --- | --- | --- |
| GET | collection | — | 200 with an items array |
| GET | /{id} | — | 200 with id, name and revision, or 404 |
| PUT | /{id} | name | 201 on creation, 200 on matching retry, 409 on a conflicting name |
| PATCH | /{id} | name and last observed revision | 200 with the new revision, 409 on concurrent changes, or 404 |

Writes require the session's CSRF token in the existing `X-Eliza-CSRF` header. Names are trimmed and limited to 300 characters. Workspace IDs are 1–120 ASCII letters, digits, underscores or hyphens. The composite primary key lets different owners independently reuse a local ID such as `original`. A rename checks the revision in the database update.

The directory listing returns workspace metadata. The static web deployment saves workspace contents locally. Connecting it requires a same-origin API deployment and an authenticated session. Keep browser session cookies, CSRF tokens and runtime credentials out of workspace JSON and backups.

Run the app-core integration case in `auth-session-routes.real.test.ts` for session isolation, retries, CSRF and concurrent rename coverage.

## Workspace contents

PUT on the workspace ID with a name and contents creates one private copy atomically. GET on the ID followed by `/contents` returns the snapshot, or null contents for an older directory entry. PUT on that suffix accepts contents and the last observed revision and rejects stale writes with 409. The API accepts JSON bodies up to 1 MiB. The web client validates a downloaded workspace before opening it under a fresh local ID. Binary attachments remain device-local.

Build the web client with `VITE_MINDINEERS_SERVER=true` only on a host routing the existing auth and workspace API under the same HTTPS origin. Provision accounts in the existing API host. Sign in, open the workspace switcher, load the directory and select Save new server copy. On another browser, sign in with the same account and choose Open as local copy. The static-only deployment uses the default local experience.

## Retry and recovery

Clients may include an Idempotency-Key of 16–120 letters, digits, underscores or hyphens. Keep the same path, parsed body and key when retrying. The server commits the workspace and its receipt in one transaction. A matching retry returns the committed revision. Reusing a key for a different payload returns 409. Workspace locks are transaction-scoped PostgreSQL advisory locks and also work in PGlite.

Every successful write retains its revision in mindineers_workspace_history. The first update to an older workspace also retains its pre-update contents. GET /{id}/history lists the newest 50 revisions with a nextBefore cursor. Pass ?before={cursor} for the next page. GET /{id}/history/{revision} returns that saved version. History is scoped to the session owner. The UI opens saved versions under a new local workspace ID.

The snapshot body accepts JSON records and settings with a 1 MiB request bound, a depth limit of 32 and at most 100,000 values. Prototype-related object keys and non-finite numbers are rejected. These snapshots contain user-authored workspace data. Runtime authorization must continue to derive from server sessions and policy.

## Verification on 18 November 2026

The isolated PGlite and PostgreSQL checks exercised the real AuthStore, session helpers, workspace route and store. PostgreSQL checks also ran over HTTP with JSON body streaming. They covered account isolation, CSRF, concurrent duplicate saves, mismatched request keys, stale revisions and revision reads. The isolated harness used explicit test DDL and substituted unrelated runtime imports. Automatic plugin migration and full agent-host startup still require integration verification.
