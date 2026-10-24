# Phase 2 — identity and administration interfaces

Implemented 24 October 2026. Phase 3 requires explicit approval. Backend/database work remains untouched.

## Entry and identity

Account entry now uses a typed identity journey supporting sign-in/signup, email-code challenge, expiry, invitation organization/role review, recovery confirmation, authenticated session display and sign-out acknowledgement. Request cancellation prevents abandoned responses from replacing the current journey; verification codes remain in memory and are cleared on submission. Identity responses are shape-checked and expired responses rejected.

The default identity adapter is disconnected. No password is collected, no account is created, no email is sent and no token is stored. The service interface is injectable for future integration; a production OAuth/SSO/session implementation is not included. No success states are fabricated for the user.

## Organization and effective access

Security → Organization provides persistent organization drafts with name/slug/contact/region/domains, duplicate-slug checks and explicit review readiness. Changing a draft resets readiness. Domain text never claims verification or creates a tenant.

Security → Effective access separates proposed local roles from verified permissions. Missing, expired or insufficient snapshots deny permission. Server authorization remains mandatory; this inspector does not enforce access to local storage.

Security → Sessions supports service-backed loading/error/retry, session details, selected-device revocation confirmation and acknowledgement before refreshing. Without an identity service it shows an unavailable state. Existing member/role/policy/access-review and incident interfaces remain available.

## Integrations

The provider inspector now includes lifecycle authorization/health/expiry boundaries and Connect / Change scopes / Reconnect / Revoke request preparation. Each request snapshots account/scopes/reason/time and can be withdrawn. Preparing or withdrawing a request has no provider effect. Local configuration removal does not claim to revoke OAuth access. Integration UI is lazy-loaded.

## Billing

Usage & billing → Manage subscription adds a local billing-profile draft, plan/cycle/effective-date requests, cancellation/resumption/support requests, review preparation and withdrawal history. No prices, proration, taxes, renewal dates or balances are invented. Authoritative quote retrieval is disabled until billing is connected. Card/bank data is not collected.

## Verification and limits

Strict TypeScript checks, all 64 automated tests and the production build pass. Tests cover malformed identity responses, expired identity/permission state, fail-closed access, organization input, request review guards, persistence validation and server rendering of the new interfaces.

Local browser use remains disabled in Work settings. New interactive/mobile acceptance was not performed. Connected-provider consent, real identity challenges, session revocation and billing quote/payment behavior cannot be verified without their separately authorized services.

New domain modules are strict TypeScript. Existing parent shells and member/role/profile editors remain JSX through the Phase 1 compatibility layer. Full-domain migration and comprehensive release acceptance remain open; this phase does not certify production security or full architectural completion.
