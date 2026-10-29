# Mindineers — full frontend product architecture

Version 0.1 · 20 October 2026 · Proposed target architecture

## 1. Purpose and scope

Mindineers is a personal and organizational multi-agent work environment. People define objectives, collaborate with agents, simulate alternatives, authorize actions, inspect evidence, and maintain continuing work across connected applications.

This document describes the full intended product surface, not an MVP or a claim that these capabilities exist. It is a bounded product specification: external ecosystems contain more features than any single specification can exhaustively enumerate.

The frontend is an application above existing operating systems. It does not replace a kernel, social network, payment network, or cloud provider. Connected products retain their own permissions, availability, billing, and authoritative records.

### Delivery classifications

- **Native:** Mindineers owns the user experience and its application records.
- **Connected:** the interface operates through an authorized external service; availability depends on that connection.
- **Extension:** an optional capability package contributes constrained views, tools, or templates.
- **Experimental:** research-oriented behavior with explicit uncertainty and isolated execution.

No mock integration, sample task, or simulated event may be presented as live. Imported repository components remain candidates until build, license, security, compatibility, and maintenance reviews are complete.

### Product principles

1. An objective has acceptance criteria, not merely a conversation.
2. Simulation, replay, preview, and live execution are distinct visible modes.
3. Every consequential action has an accountable actor and applicable authorization.
4. “Finished executing” and “accepted as correct” are distinct states.
5. Human control is available during long-running work.
6. External records retain source attribution and last-confirmed timestamps.
7. Personal memory is separated from organization and customer context.
8. A 3D presentation is optional; all essential operations work in accessible 2D.
9. A frontend permission check never substitutes for backend enforcement.
10. More agents are a resource decision, not a success metric.

## 2. People, tenancy, and primary jobs

### Actors

- **Personal owner:** manages private projects, integrations, routines, and preferences.
- **Organization owner:** manages business policy, membership, billing, and ownership.
- **Workspace administrator:** configures a workspace within organization policy.
- **Manager/operator:** delegates, reprioritizes, reviews, and resolves exceptions.
- **Contributor:** creates and works on authorized objectives and artifacts.
- **Approver/reviewer:** accepts outcomes or authorizes specified actions.
- **Customer/guest:** accesses an explicitly shared project or portal.
- **Auditor:** reads scoped evidence and activity without execution rights.
- **Developer:** builds integrations, worker adapters, and extensions.
- **Agent/service identity:** performs bounded work with explicit capabilities; never inherits an owner's session implicitly.

Roles are permission bundles, not a fixed universal hierarchy. A reviewer can have approval authority without permission to change system policy.

### Tenant structure

Account → personal space or organization → workspace → project → mission → task → run.

An organization may have several workspaces. A project belongs to a workspace; shared views do not move the underlying record into another tenant. Switching organizations must change visible data, available tools, memory scope, and execution credentials.

### Jobs the product supports

- Prepare my day and track my commitments.
- Run a project with humans and agents.
- Build and verify software.
- Research a question with source-backed findings.
- Produce documents, presentations, analyses, and media.
- Coordinate authorized business workflows across tools.
- Compare alternative plans in test environments.
- Investigate a failed run and recover it.
- Build and evaluate reusable agents and workflows.
- Govern a team's access, spending, data, and automation.

## 3. Navigation and application shell

### Top-level navigation

The persistent sidebar has seven expandable groups. Users may pin frequent destinations; permissions and installed capabilities control visibility.

1. **Home:** overview, inbox, personal agenda, recent work, global search.
2. **Work:** projects, missions, tasks, conversations, documents, files, knowledge.
3. **Agents:** directory, teams, workflows, runs, skills, tools, models.
4. **Lab:** simulations, experiments, evaluations, improvement proposals.
5. **Business:** customers, delivery, support, sales, campaigns, finance, operations.
6. **Environment:** office, devices, integrations, extensions, developer tools.
7. **Manage:** organization, usage, observability, security, settings, help.

Do not expose dozens of peer-level sidebar entries at once. An entity's local tabs expose its detailed functions.

### Shared shell

- Organization/workspace switcher.
- Breadcrumb and current entity title.
- Global search and command palette.
- Create menu: project, mission, task, agent, team, workflow, artifact, simulation.
- Inbox with separate actionable and informational categories.
- Run status indicator, connection status, and account menu.
- Collapsible navigation, central workspace, and optional right inspector.
- Tabbed or split-pane artifacts with restorable layout.
- Persistent mode banner for simulation, replay, or live work.
- Keyboard navigation, shortcut discovery, help, and accessibility preferences.

### Context inspector

Shows the selected entity's owner, collaborators, scope, status, version, permissions, linked sources, dependencies, relevant activity, and available actions. The inspector does not silently expand a worker's context or grant access.

### Search and command palette

Search authorized records across projects, tasks, agents, conversations, artifacts, and indexed sources. Show entity type, source, project, relevance context, and last update. Search must not leak inaccessible titles, counts, snippets, or suggestions.

Commands support create, navigate, assign, filter, pause, inspect, and export. Action commands open a reviewable context when required; they do not bypass policy.

## 4. Domain objects and ownership

### Canonical objects

- **Objective/mission:** outcome, acceptance criteria, owner, budget, deadline, policy, dependencies.
- **Task:** bounded unit of work with inputs, assignee, dependencies, deliverables, and completion conditions.
- **Run:** one execution attempt of a task or workflow with events, resource use, outputs, and disposition.
- **Agent definition:** versioned role, instructions, tool allowlist, model policy, memory policy, and tests.
- **Agent instance:** a specific executing worker tied to a run and definition version.
- **Team:** roles, delegation constraints, communication topology, concurrency, and review rules.
- **Workflow:** versioned executable structure with typed inputs and outputs.
- **Artifact:** versioned output with provenance, permissions, and acceptance history.
- **Approval:** actor, requested action, exact scope, expiry, policy, and decision.
- **Evidence:** observation, source record, test result, receipt, or verification artifact.
- **Memory item:** fact or preference, source, confidence where applicable, scope, timestamp, and retention.
- **Connection:** service account or user authorization with scopes and health.
- **Tool/skill:** capability definition, schema, permissions, implementation provenance, and versions.
- **Simulation:** scenario, assumptions, environment snapshot, participants, interventions, and observations.
- **Evaluation:** versioned dataset, rubric, execution configuration, results, and comparison.
- **Business record:** source-linked customer, deal, ticket, deliverable, or financial record.
- **Policy:** rule that governs authorization, data access, resource use, or retention.

### Sources of truth

Backend records own task state, policy decisions, run state, membership, and approvals. External applications own their remote records unless an explicit synchronization contract says otherwise. Artifact services own file versions. The browser owns temporary presentation preferences and recoverable drafts.

The frontend must not infer success from an animation, a generated sentence, an HTTP timeout, or disappearance of a worker.

## 5. Full module inventory

Each module below identifies its surface, principal actions, and users. All share the universal states and controls defined later.

Except for entry/account routes and organization-level administration, module routes are shown relative to `/w/:workspaceId`. Organization administration uses `/org/:organizationId`; personal account preferences use `/account`. A router must resolve these scopes explicitly rather than deriving authorization from a path.

### 01 — Entry, onboarding, and recovery

**Routes:** `/welcome`, `/sign-in`, `/onboarding`, `/join/:invite`, `/recovery`

Choose personal or organization use; create or join a workspace; establish identity and recovery; choose local/cloud execution preferences; connect an optional provider; configure budget and authority; discover available capabilities; import selected data; run a clearly labeled guided example.

Show prerequisites, connection checks, account restrictions, and skipped steps. Support resuming onboarding and restoring a workspace without overwriting existing settings.

**Used by:** new users, invited members, administrators recovering access.

### 02 — Home and personal command center

**Route:** `/w/:workspaceId/home`

Today's commitments, pending decisions, active missions, blockers, recent artifacts, upcoming meetings, and spend summary. Customize visible sections. Ask for a briefing grounded in linked records. Create a mission from a note or selected item.

Separate confirmed facts from agent suggestions. Explain why an item needs attention.

**Used by:** everyone; personal owners can include private routines without sharing them to the organization.

### 03 — Inbox and decision center

**Routes:** `/inbox`, `/approvals`, `/decisions`

Filter approvals, questions, failures, mentions, policy alerts, and completed work. Assign or delegate review, snooze informational items, inspect changes, approve or reject an exact action, request revision, and record a decision.

An approval displays destination, payload or diff, credentials scope, estimated effect, expiry, and rollback limitations. If the action changes materially, obtain a new approval. Bulk approval is limited to demonstrably equivalent scopes.

**Used by:** owners, managers, approvers.

### 04 — Projects and portfolios

**Routes:** `/projects`, `/projects/:projectId`

Project charter, goals, milestones, backlog, mission list, resources, shared knowledge, budgets, risks, stakeholders, decisions, and activity. Templates for software delivery, research, content production, and operational workflows. Portfolio views show cross-project dependencies and capacity.

Archive, export, transfer ownership, and manage project access. Display inherited organization policies.

**Used by:** owners, project managers, collaborators.

### 05 — Mission planning and task management

**Routes:** `/missions`, `/missions/:missionId`, `/tasks/:taskId`

Natural-language brief plus structured goals, constraints, deliverables, acceptance criteria, budget, and deadlines. Edit an agent-proposed plan. Views: list, board, dependency graph, timeline, and workload.

Assign humans or agents; split/merge tasks with history; resolve dependency cycles; change priority; freeze a baseline; compare plan revisions; assess scope changes; request completion review.

Replanning must show affected work, obsolete approvals, and outputs requiring revalidation.

**Used by:** planners, operators, workers, reviewers.

### 06 — Conversations, voice, and collaboration

**Routes:** `/conversations`, `/conversations/:conversationId`

Project conversations, direct agent interaction, human mentions, threads, attachments, source references, voice input/output, transcripts, and accessible text equivalents. Pin decisions and convert messages into tasks.

Provide a context panel showing which files, memories, and tools are available. Allow users to exclude a source. Cross-project sharing requires an explicit scope change.

A transcript is not automatically durable memory, an approval, or an executable instruction.

**Used by:** humans collaborating with agents and other humans.

### 07 — Agent directory and agent builder

**Routes:** `/agents`, `/agents/:agentId`, `/agents/:agentId/versions`

Browse approved agents by capability. Inspect role, owner, description, instructions, model policy, tools, memory scope, input/output contracts, permissions, tests, and observed performance.

Create, clone, configure, test, version, publish internally, retire, and roll back definitions. Compare changes and display compatibility requirements. Preview the effective configuration after policy inheritance.

Separate configured capabilities from capabilities actually exercised and verified.

**Used by:** builders, operators, administrators.

### 08 — Teams and organizational design

**Routes:** `/teams`, `/teams/:teamId`

Define director, specialists, reviewers, escalation owners, and human participants. Configure delegation depth, concurrency, communication channels, handoff schemas, resource quotas, and completion rules.

Team views show hierarchy, task responsibility, dependencies, and communication activity. Identify agents waiting on each other, duplicated work, and unowned tasks. Templates can be compared on evaluation results.

**Used by:** managers and agent-system builders.

### 09 — Workflow studio and automations

**Routes:** `/workflows`, `/workflows/:workflowId`, `/schedules`

Visual graph plus accessible form/list editor. Nodes include agent work, deterministic function, tool call, branch, parallel group, merge, approval, timer, event wait, and verification.

Typed ports, schema validation, reusable subflows, conditions, timeout/retry policies, idempotency keys, and failure branches. Triggers include manual, schedule, authorized webhook, and supported external events.

Validate, dry-run, version, compare, publish, disable, and inspect trigger history. Never save credentials inside workflow definitions.

**Used by:** operators, developers, workspace administrators.

### 10 — Run control and live execution

**Routes:** `/runs`, `/runs/:runId`

Live task graph, worker roster, event stream, artifacts, resource use, checkpoints, tool activity, and pending decisions. Pause, resume, cancel, redirect, retry a failed step, fork from a supported checkpoint, or open an incident.

Display requested control versus acknowledged control. A cancellation can be pending while an external operation completes. Preserve partial artifacts and list irreversible effects.

**Used by:** operators, developers, reviewers.

### 11 — Artifacts and files

**Routes:** `/artifacts`, `/artifacts/:artifactId`, `/files`

Versioned file browser, upload/import, preview, compare, annotate, accept/reject, share, export, and retention controls. Types include documents, spreadsheets, slides, PDFs, code, images, audio, video, datasets, and reports.

Record the generating run, input sources, tool version, relevant checks, and author. Support malware scanning status, large-file handling, unavailable previews, and accessible downloads.

Artifacts remain identifiable when a project is archived or a run is canceled.

**Used by:** all authorized collaborators and scoped guests.

### 12 — Documents and analysis workspace

**Routes:** `/studio/documents`, `/studio/sheets`, `/studio/slides`, `/studio/reports`

Native or connected editing, structured outlines, comments, suggestions, version comparison, formulas, charts, presentation pages, citations, templates, export, and publication previews.

Ask an agent to edit a selected region with a visible diff. Maintain source links for research-derived content. Spreadsheet recalculation and generated-file rendering are backend capabilities with explicit status.

Full parity with established office suites is not assumed. Connected editing and embedded previews should be labeled.

**Used by:** analysts, researchers, operators, content creators.

### 13 — Knowledge, retrieval, and memory

**Routes:** `/knowledge`, `/sources/:sourceId`, `/memory`

Index authorized folders and connected sources; inspect ingestion and sync health; search with citations; view source excerpts; manage collections and access. Show stale, deleted, conflicting, and inaccessible sources distinctly.

Memory editor separates user-stated preference, observed fact, inference, and temporary working context. Users can confirm, correct, forget, export, or restrict scope. Explain why a memory was retrieved.

Forgetting must account for derived indexes, summaries, caches, and applicable retention obligations.

**Used by:** owners, knowledge managers, researchers, privacy administrators.

### 14 — Research and intelligence desk

**Routes:** `/research`, `/research/:researchId`

Question framing, source collection, research plan, evidence map, citation inspection, conflicting claims, draft findings, uncertainty, and final report. Support web and authorized internal sources.

Research workers can propose follow-up questions and request unavailable information. Show source date and retrieval date. Verify citations resolve to the claims they support.

**Used by:** researchers, strategists, analysts, managers.

### 15 — Software engineering workspace

**Routes:** `/engineering`, `/repositories/:repositoryId`, `/changes/:changeId`

Connect repositories; inspect branches, isolated workspaces, files, diffs, test runs, preview environments, review findings, CI, and release candidates.

Assign coding work, compare implementations, request independent review, inspect dependency changes, prepare pull requests, and authorize supported deployment actions. Live terminals and debugging are capability-gated.

Show environment identity and secret scope. Do not merge, publish, or deploy merely because a worker reports success.

**Used by:** developers, technical owners, reviewers.

### 16 — Creative and publishing studio

**Routes:** `/studio/creative`, `/content`, `/campaigns/:campaignId`

Brand assets, briefs, copy, image/video/audio generation where connected, variants, editorial calendars, review, localization, accessibility checks, and export.

Track source rights/permissions metadata and distinguish generated from uploaded media. Connected publication includes destination preview, scheduled time, account identity, and confirmation receipt.

Analytics display observed platform data, not invented engagement estimates.

**Used by:** creators, marketing teams, solo business owners.

### 17 — Calendar, meetings, and personal operations

**Routes:** `/agenda`, `/meetings`, `/routines`

Unified authorized calendar view, meeting preparation, notes/transcripts where permitted, decisions, follow-up tasks, focus blocks, recurring checklists, and personal briefings.

Scheduling proposes changes with time zones and conflicts visible. Private event content stays private when only availability is shared. Notifications can be batched by urgency and quiet hours.

**Used by:** personal owners, assistants, managers.

### 18 — Customers, sales, and relationships

**Routes:** `/business/customers`, `/business/deals`, `/business/contacts`

Source-linked contact and organization records, relationship timeline, requirements, opportunities, proposals, commitments, and follow-up preparation. CRM connectors can be authoritative.

Duplicate resolution, field mapping, ownership, and provenance are visible. Outreach uses approved channels and authorization; inferred relationship facts are labeled.

**Used by:** owners, account managers, sales operators.

### 19 — Service delivery and support

**Routes:** `/business/delivery`, `/business/tickets`, `/business/portal`

Customer intake, triage, assignment, service objectives, project linkage, delivery checklists, acceptance requests, and escalation. Create a scoped customer portal with selected artifacts and updates.

Track contractual requirements as recorded facts with sources. Support drafting and approved sending of responses. Prevent cross-customer data exposure.

**Used by:** delivery managers, support workers, customers.

### 20 — Finance administration and procurement

**Routes:** `/business/finance`, `/business/expenses`, `/business/procurement`

Connected invoice and expense views, document extraction, purchase-order matching, missing-data queues, reconciliation, payment-status tracking, approved reminders, and procurement requests.

Accounting/payment providers remain authoritative. Separate draft, submitted, accepted, paid, disputed, and reconciled states. Financial calculations use deterministic services and source amounts.

Money movement, commercial commitments, and changes to payment details require their applicable explicit controls. Display currency, tax assumptions, and exchange-rate sources where relevant.

**Used by:** owners, finance operators, authorized approvers.

### 21 — Business operations and people

**Routes:** `/business/operations`, `/business/processes`, `/business/people`

Standard procedures, recurring obligations, onboarding checklists, capacity planning, supplier records, internal requests, and policy acknowledgments.

People records and sensitive personnel information have separate access controls. Agent performance must not be conflated with employee performance. Regulatory or compliance claims need external validation.

**Used by:** operations managers and authorized administrators.

### 22 — Simulation laboratory

**Routes:** `/lab/simulations`, `/lab/simulations/:simulationId`

Scenario editor, environment snapshot, synthetic or permitted historical inputs, agent roster, constraints, assumptions, seed where supported, interventions, branching, timeline, outcomes, and uncertainty.

Types include software sandboxes, operational rehearsals, organizational experiments, and hypothetical business scenarios. All external writes are blocked or redirected to test adapters.

Promoting a result creates a new live plan with new authorization; it never toggles an existing simulated action into production. Synthetic customer behavior is not demand evidence.

**Used by:** researchers, planners, operators, system builders.

### 23 — Evaluations and benchmarks

**Routes:** `/lab/evaluations`, `/lab/datasets`, `/lab/comparisons`

Version datasets, rubrics, acceptance tests, baseline systems, configurations, and holdout sets. Run repeated trials and compare quality, cost, latency, intervention count, recovery, and policy violations.

Show sample size, exclusions, failures, grading method, model/tool versions, and uncertainty. Allow blind human review and adjudication. Avoid presenting self-reported benchmark scores as independently verified.

**Used by:** evaluators, researchers, release owners.

### 24 — Improvement and evolution lab

**Routes:** `/lab/improvements`, `/lab/releases`

Collect failure patterns; propose changes to skills, prompts, routing, or workflows; inspect diffs; run regression and holdout evaluations; stage changes; approve promotion; monitor and roll back.

Protected policies and evaluation authority cannot be silently changed by the optimizing worker. Improvements remain hypotheses until tested. Maintain attributable versions and rollback compatibility.

**Used by:** builders, reviewers, administrators.

### 25 — Virtual office and spatial workspace

**Routes:** `/office`, `/office/layouts`

Optional 2D/3D rooms, desks, team grouping, selected activity, run status, and direct access to the same entity inspector. Layout customization, presence preferences, reduced motion, and low-resource mode.

Animation derives from actual events or explicitly labeled demo data. No essential control exists only in 3D. The view must pause rendering when hidden and respect privacy scopes.

**Used by:** operators and teams who prefer spatial organization.

### 26 — Integration and device hub

**Routes:** `/connections`, `/connections/:connectionId`, `/devices`

Catalog, OAuth/service-account setup, scope review, account ownership, health, expiry, sync history, rate limits, schema mapping, test actions, reconnect, revoke, and delete.

Device registry includes online status, execution capabilities, permitted directories, browser workers, local-model endpoints, and resource limits. Remote-control sessions display a visible activity indicator and stop control.

Possible adapters include Google Workspace, OpenAI, Anthropic, Meta business interfaces, repositories, CRM, accounting, and storage. Listed candidates are not claims of current support.

**Used by:** owners, IT administrators, integration developers.

### 27 — Tools, skills, templates, and extensions

**Routes:** `/catalog`, `/skills`, `/tools`, `/extensions`

Discover approved packages; inspect publisher, license, requested permissions, versions, dependencies, and verification evidence. Install, configure, test, pin, update, disable, and remove.

Catalog entries declare supported runtime and UI contributions. Separate internal catalog from any future public marketplace. Revocation must stop new execution and explain treatment of existing runs.

**Used by:** builders, operators, administrators.

### 28 — Models and compute

**Routes:** `/models`, `/compute`

Provider connections, endpoint health, available model capabilities, local model inventory, routing rules, fallback behavior, context limits, resource estimates, and observed performance.

Configure per-task eligibility and data-location restrictions. Show cloud transfer implications before routing sensitive context. GPU/CPU availability and local model downloads are backend-reported.

Cached pricing estimates must have timestamps; final usage comes from reconciled records where available.

**Used by:** builders, personal owners, infrastructure administrators.

### 29 — Observability and incident response

**Routes:** `/operations`, `/operations/incidents`, `/operations/traces`

Service health, queues, run traces, tool failures, integration outages, latency, resource exhaustion, alerts, and incident timelines. Correlate a user-visible failure with its run and tool activity.

Provide diagnostics export with redaction, retry/recovery actions, emergency execution stop, and incident annotations. Restrict raw logs and secrets. Distinguish platform outage from individual task failure.

**Used by:** operators, support engineers, administrators.

### 30 — Usage, budgets, and billing

**Routes:** `/usage`, `/budgets`, `/billing`

Usage by workspace/project/team/model/tool; budget commitments versus actuals; alerts; quotas; invoices; subscription status; payment-method administration via provider; attribution and exports.

Separate Mindineers charges, connected provider charges, and estimated external costs. Budget caps are enforced server-side; display in-flight reservations and reconciliation delays.

**Used by:** owners, finance administrators, project budget holders.

### 31 — Organization, security, and governance

**Routes:** `/organization`, `/security`, `/audit`, `/policies`

Membership, invitations, groups, roles, service identities, workspace provisioning, session management, SSO/SCIM where implemented, policy editor, data retention, audit exports, and access reviews.

Show effective permissions, inherited restrictions, approval delegations, break-glass events, and data-access history. Organization-wide execution stop must be distinct from stopping one run.

**Used by:** owners, security administrators, auditors.

### 32 — Help, learning, and support

**Routes:** `/help`, `/help/diagnostics`, `/feedback`

Searchable documentation, contextual guidance, interactive tutorials using labeled demo data, shortcut reference, accessibility help, release notes, known issues, support requests, and redacted diagnostic bundles.

Support access to customer data is explicit, scoped, time-limited, and audited. Tutorials do not require live credentials.

**Used by:** everyone.

## 6. Complete settings taxonomy

Settings use explicit scopes: user, device, organization, workspace, project, agent/team, and run. The UI shows inheritance and effective value. Mandatory policies constrain lower scopes; conflicting constraints produce a visible validation error rather than arbitrary precedence.

### User settings

- Profile: name, avatar, pronouns if desired, contact details.
- Language, locale, time zone, date/number format, currency display.
- Appearance: system/light/dark, density, text size, navigation preferences.
- Accessibility: contrast, reduced motion, keyboard mappings, captions, screen-reader behavior.
- Notifications: channel, urgency, digest, quiet hours, mentions, completion alerts.
- Personalization: writing preferences, work hours, explicit preferences, inference opt-in.
- Personal memory: inspect, correct, forget, export, retention.
- Voice: input/output device, language, push-to-talk, transcript retention, playback.
- Connected personal accounts and granted scopes.
- Privacy: telemetry choice where available, data export, account deletion.
- Security: sessions, authentication factors, recovery, trusted devices.

### Workspace settings

- Name, description, branding, default landing view, enabled modules.
- Default project templates, statuses, labels, custom fields.
- Sharing defaults and guest access.
- Default model policy, eligible providers, routing constraints.
- Context selection and memory boundaries.
- File upload limits, supported formats, indexing policy.
- Artifact retention, version retention, export policy.
- Workflow defaults, schedules, time zones, concurrency.
- Approval defaults and escalation owners.
- Budget limits, notifications, attribution fields.
- Integration ownership and shared service accounts.
- Search configuration and saved-view sharing.

### Agent and team settings

- Versioned role and instructions.
- Model eligibility and fallback.
- Tool allowlists and parameter restrictions.
- Context and memory scopes.
- Maximum delegation depth, parallelism, duration, and spend.
- Checkpoint and retry behavior.
- Review requirements and acceptance tests.
- Communication and handoff formats.
- Stop conditions and escalation rules.
- Simulation eligibility and live-execution restrictions.

### Organization settings

- Ownership, legal/billing details, workspaces.
- Groups, roles, permissions, provisioning.
- SSO, SCIM, authentication/session policies where implemented.
- Data residency options and approved providers.
- Secret-management policies.
- Retention, deletion, legal holds where implemented.
- External sharing, approved domains, guest expiry.
- Tool and extension approval policy.
- Financial authorization and approval delegation.
- Auditing, diagnostics access, security alerts.
- Usage plans, billing contacts, payment administration.
- Emergency controls and administrator recovery.

### Device and runtime settings

- Device name, capabilities, trust registration, revocation.
- Local folders and file-access boundaries.
- Browser and desktop-control permissions.
- Local model endpoints and storage.
- CPU/GPU/memory/disk limits and battery behavior.
- Sandbox network access and approved destinations.
- Worker updates, version compatibility, restart policy.
- Remote access, session indicators, emergency stop.
- Offline behavior and sync controls.

### Project and run settings

- Context boundaries, collaborators, source collections.
- Acceptance criteria, delivery destinations, review rules.
- Budget, deadline, priority, and resource allocation.
- Environment selection and test data.
- Approved temporary exceptions with expiry and reason.
- Run-specific immutable configuration snapshot.

### Settings behavior

Support search, contextual explanations, inherited/overridden badges, diff before save, validation, revert, history, and export where appropriate. Mark settings that affect only new runs versus active runs. Secrets are write-only or masked; never include secret values in ordinary exports or client logs.

## 7. Canonical user journeys

### A. Personal work

Home → capture objective → choose private context → review plan → execute → inspect artifact → accept → optionally save a reusable workflow.

### B. Team mission

Project → brief and criteria → team selection → plan review → resource/permission check → run → answer escalations → independent verification → acceptance → archive evidence.

### C. Simulation to real work

Scenario → data/assumption review → isolated trials → compare results → select a candidate → create a new live mission → review effects and permissions → authorize.

### D. Software delivery

Repository → issue → isolated workspace → plan → implementation → tests → review/diff → preview → authorized pull request/deployment → receipt and rollback information.

### E. Business workflow

External event → authenticated ingestion → record matching → draft action → approval if required → remote submission → confirmation/reconciliation → follow-up or exception queue.

### F. Recovery

Failure notification → inspect run and side effects → choose retry/compensate/abandon → policy recheck → resume from a valid checkpoint → verify recovered outcome.

### G. Agent improvement

Failure pattern → proposed change → version diff → evaluations and holdout → review → staged promotion → monitoring → rollback if regression.

### H. Integration revocation

Connection → inspect dependent jobs → revoke → stop new access → handle in-flight work → clear or retain cached data under policy → audit record.

## 8. Universal states and interaction contracts

### Task/run state

Draft → ready → queued → running → execution complete → awaiting verification → accepted.

Additional states: waiting for input, waiting for approval, blocked, pausing, paused, cancel requested, canceled, failed, verification failed, and outcome unknown.

Exact allowed transitions are backend-defined. “Outcome unknown” is necessary when a remote write might have succeeded but cannot yet be confirmed. A retry must not blindly repeat that action.

### Artifact state

Draft, generating, partial, available, checking, review required, accepted, superseded, quarantined, expired, deleted.

### Connection state

Not configured, authorizing, connected, degraded, rate-limited, expired, revoked, unavailable.

### Every screen must handle

- Initial loading and incremental loading.
- First-use empty state with a relevant next action.
- No results after filtering.
- Permission denied and redacted data.
- Missing or deleted entity.
- Stale data and reconnecting stream.
- Validation errors and partial saves.
- Rate limits and dependency failures.
- Partial output and recovery.
- Conflict with another user's update.
- Offline read-only or explicitly queued local drafts.

Do not enqueue irreversible external actions while offline. Do not optimistically show approvals, payments, publication, or deployment as complete.

## 9. Frontend application architecture

### Layering

1. **Shell:** identity context, navigation, layouts, command palette, accessibility.
2. **Domain modules:** missions, agents, artifacts, simulations, business, administration.
3. **Shared entity UI:** inspectors, activity, permission summaries, versions, relationships.
4. **Application services:** typed API clients, event subscriptions, upload handling, authorization hints.
5. **Design system:** controls, forms, tables, graphs, editors, feedback states.
6. **Platform adapters:** web, desktop bridge, voice, optional spatial renderer.

Domain modules do not call each other's private internals. They compose shared entities through explicit interfaces. The 3D renderer observes the same application state as the ordinary workspace.

### Suggested logical source organization

```text
app/
  shell/
  routing/
  bootstrap/
domains/
  identity/ workspaces/ projects/ missions/ tasks/
  conversations/ agents/ teams/ workflows/ runs/
  artifacts/ knowledge/ memory/ research/
  engineering/ creative/ business/
  simulations/ evaluations/ improvements/
  integrations/ devices/ catalog/ models/
  operations/ billing/ governance/ settings/
shared/
  design-system/
  entity-components/
  contracts/
  api/
  events/
  authorization/
  accessibility/
  telemetry/
platform/
  web/
  desktop/
  voice/
  spatial/
tests/
  contracts/
  journeys/
  accessibility/
  failure-recovery/
```

This is conceptual structure, not a prescribed package/library choice. Existing code suitability should be evaluated before selecting implementation dependencies.

### State ownership

- Server state: backend records cached by entity identity and tenant.
- URL state: entity selection, filters, view, tab, and shareable search.
- UI state: pane sizes, disclosure, temporary selections.
- Draft state: unsaved forms and local edits with recovery boundaries.
- Stream state: event cursor, connection health, pending events.
- Collaboration state: presence, revision conflicts, document synchronization.
- Secret state: never persisted in general client storage or analytics.

Avoid a single unrestricted global store containing all tenant data. Clear sensitive caches on logout, tenant change, and permission revocation.

### API interaction

Use explicit read models and action endpoints. Commands include request identity and expected entity version where needed. Backend responses distinguish accepted command, completed effect, rejected command, and unknown outcome.

List APIs need pagination, filters, sorting, search, and permission-aware totals. Bulk operations return item-level results. Long operations return a run/job reference.

### Realtime contract

Events include event ID, type, schema version, tenant/workspace, entity ID, run ID where applicable, sequence/cursor, timestamp, and permission-safe payload.

Support resume cursors, deduplication, out-of-order arrival, snapshot reconciliation, heartbeat, reconnect backoff, and backpressure. Permission changes trigger reauthorization and cache invalidation.

Visible event types include task state, worker lifecycle, tool request/result, artifact version, approval request/decision, budget update, connection health, and policy violation.

Do not expose hidden model reasoning as an explanation feature. Show user-facing rationale, source evidence, and observable actions.

## 10. Shared component system

- Navigation shell, workspace switcher, command palette, breadcrumbs.
- Entity header, status badge with text, owner selector, scope indicator.
- Data grid, filter builder, saved view, pagination, bulk action bar.
- Dependency graph, workflow editor, timeline, board, workload view.
- Conversation composer, attachment picker, voice control, citation viewer.
- Agent card, capability summary, team topology, worker inspector.
- Run timeline, tool-call inspector, checkpoint selector, event viewer.
- Artifact preview, version selector, diff viewer, annotation panel.
- Approval card, action preview, policy explanation, decision history.
- Source viewer, memory editor, provenance trail.
- Evaluation comparison, rubric editor, trial drill-down.
- Connection wizard, scope review, health indicator, secret input.
- Settings form, inheritance badge, effective-policy viewer.
- Budget meter, cost breakdown, estimate-versus-actual display.
- Error boundary, retry notice, offline banner, recovery drawer.
- Empty states, progress indicators, confirmation dialogs, undo where possible.

Graph and spatial experiences require keyboard-accessible list equivalents. Use text and icons in addition to color. Density should be configurable without making targets too small.

## 11. Extension and integration boundaries

An extension manifest declares identity, version, publisher, compatibility, routes/panels, tools, schemas, scopes, network destinations, and dependencies.

Untrusted UI must run in an isolated frame or equivalent constrained surface with a narrow message protocol. It receives only authorized context. It cannot read parent tokens, install arbitrary global hooks, or silently navigate to credential capture screens.

Connector UI should use a standard contract: setup schema, auth mode, scopes, supported operations, health, quotas, events, and revocation behavior. Unsupported capabilities remain unavailable rather than appearing as working buttons.

Repository fit is provisional:

- MindineersOS: selected runtime/connector integration.
- OpenJarvis/llamafile: optional local execution adapters.
- ADK/CAMEL: worker or workflow adapters, with one authoritative run model.
- Ouroboros: candidate persistent-work and reviewed-improvement components.
- Eigent: selected desktop interaction or worker components.
- Muse Code: optional worker adapter; separate host runtime required.
- Claw3D: optional spatial renderer.
- Cookbooks: implementation references, not installed runtime layers.

## 12. Responsive behavior, accessibility, and performance

Desktop is the full workspace. Tablet supports review, planning, and selected editing. Mobile prioritizes inbox, voice capture, approvals, status, and artifact review; complex graph editing may use simplified forms.

Target WCAG 2.2 AA, full keyboard access, meaningful focus order, reduced motion, captions/transcripts, adequate contrast, and accessible labels. Validate these rather than claiming compliance from design intent.

Virtualize large lists and event streams. Lazy-load heavy editors and 3D. Paginate activity and artifacts. Batch high-frequency updates. Move expensive visual calculations off the main thread when appropriate.

Define measured performance budgets during implementation on representative devices and datasets. Do not claim responsiveness based only on an empty demo workspace.

## 13. Frontend security and privacy requirements

- Tenant-aware routing, requests, cache keys, and event subscriptions.
- Server-side authorization on every operation and subscription.
- Escaping and sanitization for untrusted generated content.
- Sandboxed previews for executable HTML and other active documents.
- Protection against prompt-injection-driven actions through backend policy checks.
- Token-safe authentication flows; no secrets in URLs or telemetry.
- Redacted logs, diagnostics, exports, and screen sharing.
- CSRF and origin controls as appropriate to the authentication design.
- Revocation handling for open sessions and active runs.
- Explicit boundary between customer content and executable instructions.
- No silent capture of screen, microphone, or private folders.
- Emergency stop with acknowledged status and residual-effect reporting.

## 14. Testing and release acceptance

Test critical journeys with real backend contracts plus isolated fake adapters for failure injection.

- Tenant switching and cross-tenant denial.
- Role changes and access revocation during an open session.
- Approval invalidation after an action changes.
- Reconnection without duplicate events or actions.
- Cancel requests during a slow external operation.
- Unknown remote outcomes and reconciliation.
- Recovery after browser/server/worker restart.
- Workflow graph validation and serialization round trips.
- Artifact version conflicts and missing previews.
- Secret redaction and unsafe-content rendering.
- Keyboard and screen-reader journeys.
- Large datasets and constrained devices.
- Simulation isolation from live destinations.
- Budget exhaustion and in-flight resource accounting.

Release evidence should include journey results, known limitations, supported connector versions, accessibility findings, and rollback readiness.

## 15. Full-scope implementation structure

This groups dependencies rather than shrinking the target to an MVP.

**Foundation:** domain contracts, tenancy, identity, shell, design system, shared states, event model.

**Work system:** projects, missions, tasks, conversations, runs, approvals, artifacts, memory.

**Agent platform:** agent/team builder, workflows, tools, models, isolated workers, integration contracts.

**Application surfaces:** engineering, research, documents, creative work, personal operations, business modules.

**Advanced environment:** simulations, evaluations, controlled improvement, spatial office, extension SDK.

**Operational maturity:** enterprise governance, billing, observability, recovery, accessibility, scale validation.

Each group produces working vertical journeys. Shipping a module means its permissions, failure states, backend integration, and evidence behavior work—not merely that its screen exists.

## 16. Explicit boundaries and unresolved design decisions

Not promised by this architecture: universal third-party access, autonomous legal/accounting judgment, guaranteed business success, frontier-model superiority, complete office-suite parity, or accurate predictions from synthetic societies.

Decisions to validate before implementation:

- Which existing codebase can be maintained as the application foundation?
- Which runtime owns durable orchestration and why?
- Which deployment profiles are supported: local, managed cloud, private cloud?
- What is the collaboration/document-editing strategy?
- Which integrations have usable official APIs and required approvals?
- What is the first supported set of artifact formats?
- Which modules are native versus connected editors?
- What tenancy, residency, and retention requirements apply?
- How will provider costs, quotas, and entitlements be reconciled?
- Which real tasks and users define acceptance for the first complete release?

The next design artifacts should be screen-by-screen wireframes, interaction specifications, domain schemas, and API/event contracts derived from this scope.
