# Frontend security boundaries

## Implemented

- React renders authored text as text. No raw HTML insertion or browser evaluation of user-authored code is used.
- Production CSP allows same-origin scripts without inline scripts or eval; external objects, framing and base-URL changes are blocked. Image previews use data/blob URLs. Styles retain inline support for React layout properties.
- Permissions Policy denies camera, microphone, location, payment and USB. No credentials, OAuth tokens or payment details are collected by the disconnected frontend.
- Workspace imports reject prototype-related keys, excessive nesting/complexity, invalid collection shapes and duplicate product IDs. Corrupt stored data remains available for recovery rather than silently replaced.
- Workflow schema checks use a pre-generated draft-07 meta-schema validator, bounded input, and local-reference checks. This validates schema structure; it is not a runtime execution authorization mechanism or full payload validator.
- Customer delivery exports use an explicit allowlist, omit internal notes/document comments/speaker notes, and exclude artifacts scoped to other customers. Selected document bodies still require human review for customer suitability.
- Document proposals bind to the exact original body and save a checkpoint before application. Submitted financial values lock; status changes require evidence and reconciliation requires an exact amount match.
- External source URLs reject non-HTTP schemes, embedded credentials and control characters.
- Incident and access-review records are explicitly labeled local planning/evidence records. They do not revoke access, contain systems, or substitute for trusted audit logs.

- Workspace recovery keeps bounded snapshots in memory, rejects stale callbacks after workspace replacement or recovery, and pauses during unresolved storage conflicts. It is neither an authorization boundary nor an immutable audit trail. Restored local review records remain self-reported.
- Optional record and workflow fields are validated before backup restoration to match the migrated typed editors. Local mandatory settings are visibly labeled policy drafts.

## Required before production use with private organizational data

Authentication, session management, tenant isolation, server-side authorization, secret storage, authoritative audit events, retention enforcement, rate limits, encrypted synchronization and capability-scoped tool execution must be implemented and independently tested with the backend. Browser storage is accessible to the device/browser profile; it is not secure multi-tenant storage.

A zero-vulnerability dependency audit and passing local checks do not establish complete application security. Hosted header verification, broader abuse testing, keyboard/screen-reader coverage and connected authorization testing remain release gates. Backend work is not authorized by these requirements.
