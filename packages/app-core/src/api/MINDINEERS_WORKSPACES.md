# Private workspace directory

The app-core API server registers this directory under `/api/mindineers/workspaces`. Start the existing API host with its SQL plugin and run the normal plugin migrations. The plugin owns the `mindineers_workspaces` table on PGlite or PostgreSQL. Use an existing authenticated browser session from the host. The owner is always the session identity.

| Method | Path suffix | Request | Response |
| --- | --- | --- | --- |
| GET | collection | — | 200 with an items array |
| GET | /{id} | — | 200 with id, name and revision, or 404 |
| PUT | /{id} | name | 201 on creation, 200 on matching retry, 409 on a conflicting name |
| PATCH | /{id} | name and last observed revision | 200 with the new revision, 409 on concurrent changes, or 404 |

Writes require the session's CSRF token in the existing `X-Eliza-CSRF` header. Names are trimmed and limited to 300 characters. Workspace IDs are 1–120 ASCII letters, digits, underscores or hyphens. The composite primary key lets different owners independently reuse a local ID such as `original`. A rename checks the revision in the database update.

This directory stores workspace metadata. The published web app still saves workspace contents locally. Connecting it requires a same-origin API deployment and an authenticated session. Keep browser session cookies, CSRF tokens and runtime credentials out of workspace JSON and backups.

Run the app-core integration case in `auth-session-routes.real.test.ts` for session isolation, retries, CSRF and concurrent rename coverage.
