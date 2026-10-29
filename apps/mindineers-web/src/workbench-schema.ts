// These are local planning interfaces. No field grants authority or configures a server.
export const schema: Record<string, { tabs: Record<string, string[]> }> = {
  workflows: {
    tabs: {
      Studio: ["Purpose", "Input contract", "Output contract"],
      Triggers: [
        "Trigger type",
        "Schedule",
        "Event filter",
        "Idempotency policy",
      ],
      Recovery: ["Failure handling", "Compensation plan", "Notification owner"],
    },
  },
  projects: {
    tabs: {
      Charter: ["Outcome", "Success criteria", "Constraints", "Stakeholders"],
      Milestones: ["Milestones", "Dependencies", "Risks", "Capacity plan"],
      Governance: [
        "Decision log",
        "Budget assumptions",
        "Access plan",
        "Archive and transfer plan",
      ],
    },
  },
  missions: {
    tabs: {
      Brief: [
        "Objective",
        "Deliverables",
        "Acceptance criteria",
        "Constraints",
      ],
      Plan: ["Task breakdown", "Dependencies", "Deadline", "Priority"],
      Review: ["Baseline", "Scope changes", "Completion evidence", "Reviewer"],
    },
  },
  agents: {
    tabs: {
      Configuration: [
        "Instructions",
        "Model preference",
        "Tool allowlist",
        "Input contract",
        "Output contract",
      ],
      Memory: ["Memory scope", "Allowed sources", "Retention policy"],
      Governance: [
        "Autonomy boundary",
        "Budget limit",
        "Escalation owner",
        "Test cases",
        "Rollback notes",
      ],
    },
  },
  teams: {
    tabs: {
      Roster: ["Director", "Specialists", "Reviewer", "Human owner"],
      Coordination: [
        "Delegation depth",
        "Concurrency limit",
        "Communication channels",
        "Handoff schema",
      ],
      Responsibility: [
        "Task ownership",
        "Completion rule",
        "Quotas",
        "Escalation path",
      ],
    },
  },
  files: {
    tabs: {
      Metadata: [
        "Artifact type",
        "Author",
        "Source run",
        "Source tool",
        "Source references",
      ],
      Review: ["Acceptance checks", "Annotations", "Reviewer", "Decision"],
      Lifecycle: [
        "Sharing audience",
        "Retention",
        "Version notes",
        "Unavailable source notes",
      ],
    },
  },
  documents: {
    tabs: {
      Editor: ["Outline", "Document body", "Citations"],
      Review: ["Comments", "Suggested changes", "Review status"],
      Publishing: ["Template", "Export format", "Preview notes"],
    },
  },
  knowledge: {
    tabs: {
      Sources: [
        "Source URL",
        "Collection",
        "Access scope",
        "Retrieved date",
        "Sync notes",
      ],
      Memory: ["Memory type", "Statement", "Evidence", "Confidence", "Expiry"],
      Retrieval: [
        "Search terms",
        "Relevant excerpts",
        "Retrieval reason",
        "Conflicting evidence",
      ],
    },
  },
  research: {
    tabs: {
      Question: ["Research question", "Research plan", "Missing information"],
      Evidence: [
        "Source URL",
        "Retrieved date",
        "Source excerpts",
        "Contradictions",
      ],
      Report: ["Findings", "Citations", "Uncertainty", "Follow-up questions"],
    },
  },
  engineering: {
    tabs: {
      Workspace: ["Repository URL", "Branch", "File path", "Environment"],
      Change: ["Problem", "Proposed diff", "Dependencies", "Reviewer"],
      Verification: ["Test plan", "Test output", "CI reference", "Preview URL"],
      Release: [
        "Release notes",
        "Deployment plan",
        "Rollback plan",
        "Approval requirements",
      ],
    },
  },
  creative: {
    tabs: {
      Brief: ["Audience", "Brand guidelines", "Deliverable", "Channel"],
      Variants: [
        "Variant A",
        "Variant B",
        "Localization",
        "Accessibility description",
      ],
      Rights: ["Origin", "Rights holder", "License", "Usage restrictions"],
      Publishing: [
        "Destination account",
        "Schedule",
        "Review checklist",
        "Approval requirements",
      ],
    },
  },
  calendar: {
    tabs: {
      Agenda: ["Timezone", "Start", "End", "Location", "Agenda"],
      Meeting: [
        "Preparation",
        "Notes",
        "Transcript reference",
        "Decisions",
        "Follow-up actions",
      ],
      Availability: [
        "Recurrence",
        "Conflict notes",
        "Private availability",
        "Quiet hours",
      ],
    },
  },
  customers: {
    tabs: {
      Relationship: ["Organization", "Contact email", "Source", "Owner"],
      Pipeline: [
        "Deal stage",
        "Value and currency",
        "Requirements",
        "Next follow-up",
      ],
      Activity: [
        "Contact history",
        "Proposal",
        "Commitments",
        "Duplicate candidates",
      ],
    },
  },
  delivery: {
    tabs: {
      Intake: ["Customer", "Request", "Priority", "Contract source"],
      Delivery: ["Service objective", "Checklist", "Deadline", "Escalation"],
      Acceptance: [
        "Acceptance criteria",
        "Customer feedback",
        "Approved artifacts",
        "Portal update draft",
      ],
    },
  },
  finance: {
    tabs: {
      Invoice: ["Customer", "Currency", "Due date", "Tax assumptions"],
      Reconciliation: [
        "Invoice reference",
        "Purchase order",
        "Payment status",
        "Dispute notes",
        "Reconciliation evidence",
      ],
      Procurement: [
        "Supplier",
        "Expense description",
        "Approval owner",
        "Missing information",
      ],
    },
  },
  operations: {
    tabs: {
      Procedure: [
        "Purpose",
        "Steps",
        "Accountable owner",
        "Recurring schedule",
      ],
      People: [
        "Onboarding checklist",
        "Capacity plan",
        "Acknowledgments",
        "Sensitive data handling",
      ],
      Suppliers: [
        "Supplier",
        "Contract reference",
        "Renewal date",
        "Internal requests",
      ],
    },
  },
  simulation: {
    tabs: {
      Scenario: [
        "Hypothesis",
        "Environment snapshot",
        "Inputs",
        "Seed",
        "Assumptions",
      ],
      Interventions: [
        "Intervention",
        "Alternative branch",
        "Constraints",
        "Success criteria",
      ],
      Outcomes: [
        "Observed outcomes",
        "Uncertainty",
        "Comparison",
        "Proposed promotion plan",
      ],
    },
  },
  evaluations: {
    tabs: {
      Definition: [
        "Dataset version",
        "Rubric",
        "Baseline version",
        "Candidate version",
        "Holdout version",
      ],
      Trials: [
        "Trial protocol",
        "Sample count",
        "Exclusions",
        "Failure categories",
        "Grading method",
      ],
      Decision: [
        "Acceptance threshold",
        "Uncertainty",
        "Blind review",
        "Evidence links",
      ],
    },
  },
  improvement: {
    tabs: {
      Proposal: [
        "Failure evidence",
        "Proposed change",
        "Configuration diff",
        "Expected benefit",
      ],
      Validation: [
        "Regression suite",
        "Holdout results",
        "Staging plan",
        "Protected policy boundaries",
      ],
      Promotion: [
        "Reviewer",
        "Promotion criteria",
        "Monitoring plan",
        "Rollback plan",
      ],
    },
  },
  integrations: {
    tabs: {
      Connection: [
        "Provider",
        "Account label",
        "Requested scopes",
        "Data region",
      ],
      Lifecycle: [
        "Mapping",
        "Sync schedule",
        "Expiry",
        "Rate limit plan",
        "Reconnect notes",
      ],
      Devices: [
        "Device label",
        "Allowed directories",
        "Local endpoint",
        "Resource limits",
        "Stop procedure",
      ],
    },
  },
  tools: {
    tabs: {
      Manifest: [
        "Publisher",
        "License",
        "Version",
        "Dependencies",
        "Instructions",
      ],
      Permissions: [
        "Required capabilities",
        "Data access",
        "External effects",
        "Compatibility",
      ],
      Lifecycle: [
        "Test cases",
        "Pinned version",
        "Update plan",
        "Revocation plan",
      ],
    },
  },
  models: {
    tabs: {
      Provider: ["Provider", "Endpoint URL", "Model identifier", "Data region"],
      Routing: [
        "Task types",
        "Context limit",
        "Fallback chain",
        "Cloud transfer policy",
      ],
      Resources: [
        "Local inventory",
        "Resource limits",
        "Measured performance reference",
        "Price source and date",
      ],
    },
  },
  observability: {
    tabs: {
      Incident: ["Symptoms", "Severity", "Affected runs", "Timeline"],
      Investigation: [
        "Trace reference",
        "Queue notes",
        "Provider status",
        "Hypothesis",
      ],
      Resolution: [
        "Mitigation",
        "Owner",
        "Recovery evidence",
        "Postmortem",
        "Alert rule",
      ],
    },
  },
  usage: {
    tabs: {
      Budget: ["Scope", "Currency", "Budget limit", "Alert thresholds"],
      Accounting: [
        "Commitments",
        "Actuals source",
        "Reservations",
        "Charge categories",
      ],
      Administration: [
        "Subscription notes",
        "Invoice reference",
        "Quota request",
        "Payment administrator",
      ],
    },
  },
  security: {
    tabs: {
      Organization: [
        "Members",
        "Invites",
        "Groups",
        "Roles",
        "Service identities",
      ],
      Policies: [
        "SSO plan",
        "SCIM plan",
        "Retention policy",
        "Access policy",
        "Emergency access",
      ],
      Review: [
        "Access review",
        "Session inventory",
        "Audit reference",
        "Delegation boundary",
        "Organization stop plan",
      ],
    },
  },
  inbox: {
    tabs: {
      Request: [
        "Action",
        "Destination",
        "Exact payload",
        "Requested scopes",
        "Expected effects",
      ],
      Decision: [
        "Reviewer",
        "Decision",
        "Revision request",
        "Delegation",
        "Snooze until",
      ],
      Safety: ["Expiry", "Rollback plan", "Payload version", "Evidence"],
    },
  },
  chat: {
    tabs: {
      Thread: [
        "Topic",
        "Participants",
        "Pinned decisions",
        "Attachment references",
      ],
      Context: [
        "Included context",
        "Excluded context",
        "Scope",
        "Source references",
      ],
      Capture: [
        "Voice transcript",
        "Accessibility preferences",
        "Task extraction",
      ],
    },
  },
  help: {
    tabs: {
      Guide: ["Topic", "Steps", "Related module"],
      Support: [
        "Issue description",
        "Reproduction steps",
        "Expected result",
        "Redacted diagnostics",
        "Support access expiry",
      ],
    },
  },
};
export const settingGroups: Record<string, [string, string, string][]> = {
  Profile: [
    ["language", "Language", "English"],
    ["timezone", "Timezone", "Asia/Kolkata"],
    ["dateFormat", "Date format", "YYYY-MM-DD"],
    ["density", "Density", "Comfortable"],
    ["textSize", "Text size", "Default"],
  ],
  Notifications: [
    ["mentions", "Mentions", "In app"],
    ["approvals", "Approval requests", "In app"],
    ["quietHours", "Quiet hours", "22:00–08:00"],
    ["digest", "Digest preference", "Daily"],
  ],
  Authority: [
    ["autonomy", "Autonomy", "Draft only"],
    ["externalWrites", "External writes", "Require approval"],
    ["maxDelegation", "Delegation depth", "3"],
    ["concurrency", "Concurrency", "2"],
  ],
  Data: [
    ["retention", "Retention days", "30"],
    ["region", "Preferred region", "Not configured"],
    ["memory", "Memory policy", "Ask before storing"],
    ["cloudTransfer", "Cloud transfer", "Require approval"],
  ],
  Resources: [
    ["budget", "Budget (USD)", "50"],
    ["tokens", "Token ceiling", "10000"],
    ["timeout", "Timeout seconds", "300"],
    ["retries", "Retry limit", "1"],
  ],
  Accessibility: [
    ["contrast", "Contrast", "Standard"],
    ["animations", "Animations", "System preference"],
    ["keyboard", "Keyboard shortcuts", "Enabled"],
    ["officeMode", "Office rendering", "3D on demand"],
  ],
};
