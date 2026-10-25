import type { ProductWorkflowCollections } from "../../domains/product/model";
import type { ExecutionCollections } from "../../domains/execution/model";
import type { PhaseTwoCollections } from "../../domains/administration/model";
export interface Entity {
  id: string;
}
export type TextFields<K extends string> = Record<K, string>;
export interface ChecklistItem extends Entity {
  text: string;
  done: boolean;
}
export interface Slide extends Entity {
  title: string;
  body: string;
  notes: string;
}
export interface DocumentVersion extends Entity {
  at: string;
  body: string;
  rows: string[][];
  slides: Slide[];
}
export interface DocumentProposal extends Entity {
  baseBody: string;
  start: number;
  end: number;
  replacement: string;
  reason: string;
  state: "Pending" | "Applied" | "Declined";
  at: string;
}
export interface DocumentRecord extends Entity {
  name: string;
  kind: "Document" | "Sheet" | "Presentation";
  body: string;
  rows: string[][];
  slides: Slide[];
  comments: (Entity & {
    quote: string;
    text: string;
    at: string;
    resolved: boolean;
  })[];
  versions: DocumentVersion[];
  updatedAt: string;
  proposals?: DocumentProposal[];
}
export type LedgerRecord = Entity &
  TextFields<
    | "name"
    | "kind"
    | "counterparty"
    | "currency"
    | "tax"
    | "due"
    | "state"
    | "matchReference"
    | "matchedAmount"
    | "notes"
  > & {
    lines: (Entity & TextFields<"description" | "quantity" | "price">)[];
    history: (Entity &
      TextFields<"from" | "to" | "evidence" | "actor" | "at">)[];
  };
export type DeliveryRecord = Entity &
  TextFields<
    | "name"
    | "customerId"
    | "projectId"
    | "owner"
    | "priority"
    | "due"
    | "state"
    | "requirements"
    | "source"
    | "escalation"
    | "response"
    | "acceptanceEvidence"
  > & {
    checklist: ChecklistItem[];
    updates: (Entity & { text: string; at: string; visible: boolean })[];
    artifacts: (Entity & {
      documentId: string;
      customerId: string;
      visible: boolean;
    })[];
  };
export type ProcedureRecord = Entity &
  TextFields<
    | "name"
    | "kind"
    | "owner"
    | "due"
    | "cadence"
    | "supplier"
    | "source"
    | "notes"
    | "state"
  > & {
    checklist: ChecklistItem[];
    completions: (Entity & TextFields<"at" | "actor" | "evidence">)[];
  };
export type Trial = Entity &
  TextFields<
    | "caseId"
    | "variant"
    | "outcome"
    | "cost"
    | "latency"
    | "violations"
    | "interventions"
    | "evidence"
    | "exclusion"
    | "adjudication"
  > & { excluded: boolean };
export type EvaluationRecord = Entity &
  TextFields<
    | "name"
    | "dataset"
    | "rubric"
    | "baseline"
    | "candidate"
    | "grader"
    | "holdout"
    | "acceptance"
  > & { trials: Trial[] };
export type ScenarioRecord = Entity &
  TextFields<
    | "name"
    | "parentId"
    | "seed"
    | "environment"
    | "inputs"
    | "roster"
    | "constraints"
    | "assumptions"
    | "outcome"
    | "uncertainty"
  > & {
    events: (Entity & TextFields<"at" | "intervention" | "observation">)[];
  };
export type ImprovementRecord = Entity &
  TextFields<
    | "name"
    | "failure"
    | "before"
    | "after"
    | "regression"
    | "holdout"
    | "compatibility"
    | "rollback"
    | "monitoring"
    | "stage"
  > & {
    history: (Entity & TextFields<"at" | "actor" | "stage" | "evidence">)[];
  };
export type SourceRecord = Entity & { kind: "source" } & TextFields<
    | "name"
    | "url"
    | "excerpt"
    | "collection"
    | "scope"
    | "state"
    | "retrievedAt"
    | "notes"
  >;
export type MemoryRecord = Entity & { kind: "memory" } & TextFields<
    "name" | "statement" | "type" | "scope" | "evidence" | "state" | "expires"
  >;
export type IncidentRecord = Entity &
  TextFields<
    | "name"
    | "severity"
    | "state"
    | "owner"
    | "detectedAt"
    | "scope"
    | "evidence"
    | "containment"
    | "recovery"
    | "rootCause"
  > & { timeline: (Entity & TextFields<"at" | "actor" | "state" | "note">)[] };
export type AccessReviewRecord = Entity &
  TextFields<
    | "memberId"
    | "memberName"
    | "roleName"
    | "decision"
    | "reason"
    | "due"
    | "actor"
    | "at"
  > & { permissions: string[] };
export type EvidenceLink = Entity &
  TextFields<"from" | "to" | "relation" | "reason" | "at" | "resolution"> & {
    resolved: boolean;
  };
export type DecisionSnapshot = TextFields<
  "payload" | "destination" | "state"
> & {
  version: number;
  scopes?: string[];
  effects?: string;
  rollback?: string;
  expiresAt?: string;
  decision?: {
    reviewer: string;
    at: string;
    version?: number;
    payload?: string;
    destination?: string;
    scopes?: string[];
  };
};
export type DecisionRecord = Entity &
  TextFields<
    | "name"
    | "destination"
    | "payload"
    | "effects"
    | "rollback"
    | "expiresAt"
    | "state"
    | "mode"
  > & {
    version: number;
    scopes: string[];
    previous: DecisionSnapshot[];
    decision?: {
      reviewer: string;
      at: string;
      version?: number;
      payload?: string;
      destination?: string;
      scopes?: string[];
    };
    assignedReviewer?: string;
    snoozedUntil?: string;
    escalated?: boolean;
    routing?: (Entity &
      TextFields<
        "action" | "actor" | "at" | "reviewer" | "reason" | "until"
      >)[];
  };
export type ChangeRecord = Entity &
  TextFields<
    "name" | "repository" | "branch" | "release" | "rollback" | "status"
  > & {
    files: (Entity & TextFields<"path" | "before" | "after">)[];
    checks: (Entity & TextFields<"name" | "status" | "evidence">)[];
    comments: Record<string, unknown>[];
    review?: string;
  };
export type CampaignRecord = Entity &
  TextFields<
    | "name"
    | "audience"
    | "message"
    | "brand"
    | "channel"
    | "rights"
    | "origin"
    | "schedule"
    | "account"
    | "status"
  > & {
    variants: (Entity &
      TextFields<"name" | "headline" | "body" | "alt" | "locale" | "status">)[];
  };
export type TraceRecord = Entity &
  TextFields<"name" | "mode" | "status" | "startedAt"> & {
    nodes: (Entity &
      TextFields<"name" | "agent" | "state"> & { dependencies: string[] })[];
    events: (Entity & TextFields<"at" | "level" | "node" | "message">)[];
    artifacts: (Entity &
      TextFields<"name" | "type" | "content"> & {
        completeness?: "Partial" | "Complete";
        node?: string;
      })[];
    checkpoints: (Entity & TextFields<"name" | "at" | "node">)[];
  };
export interface ProductCollections
  extends PhaseTwoCollections,
    ExecutionCollections,
    ProductWorkflowCollections {
  documents: DocumentRecord[];
  ledger: LedgerRecord[];
  deliveries: DeliveryRecord[];
  procedures: ProcedureRecord[];
  evaluations: EvaluationRecord[];
  scenarios: ScenarioRecord[];
  improvements: ImprovementRecord[];
  sources: SourceRecord[];
  memories: MemoryRecord[];
  incidents: IncidentRecord[];
  accessReviews: AccessReviewRecord[];
  evidenceLinks: EvidenceLink[];
  decisions: DecisionRecord[];
  changes: ChangeRecord[];
  campaigns: CampaignRecord[];
  traces: TraceRecord[];
  members: (Entity & TextFields<"name" | "email" | "role" | "state">)[];
  roles: (Entity & { name: string; permissions: string[] })[];
  policies: (Entity &
    TextFields<
      | "retention"
      | "sso"
      | "domain"
      | "approval"
      | "accessReview"
      | "breakGlass"
      | "exportPolicy"
    >)[];
  subscription: (Entity &
    TextFields<
      "plan" | "cycle" | "currency" | "budget" | "alert" | "contact"
    >)[];
  modelProfiles: (Entity &
    TextFields<
      | "name"
      | "provider"
      | "model"
      | "endpoint"
      | "region"
      | "context"
      | "fallback"
      | "transfer"
    > & { enabled: boolean })[];
  devices: (Entity &
    TextFields<
      | "name"
      | "endpoint"
      | "directories"
      | "memory"
      | "concurrency"
      | "permissions"
    > & { enabled: boolean })[];
}
export interface Profile {
  email: string;
  title: string;
  bio: string;
  pronouns: string;
  timezone: string;
  locale: string;
  focus: string;
  avatar: string;
  useCase: string;
}
export interface WorkspaceSettings {
  profile?: Partial<Profile>;
  dashboard?: string[];
  tour?: { step: number; state: string };
  autonomy?: string;
  name: string;
  workspace: string;
  theme: "Light" | "Dark";
  motion: boolean;
  notifications: boolean;
  budget: number;
  [key: string]: unknown;
}
export interface LegacyRecord extends Entity {
  name: string;
  description: string;
  status: string;
  owner?: string;
  progress?: number;
  color?: string;
  createdAt?: string;
  mime?: string;
  bytes?: number;
  review?: string;
  tags?: string;
  priority?: string;
  due?: string;
  dependsOn?: string[];
  criteria?: ChecklistItem[];
  date?: string;
  time?: string;
  endTime?: string;
  timezone?: string;
  location?: string;
  recurrence?: string;
  notes?: string;
  decisions?: string;
  followUp?: string;
  stage?: string;
  company?: string;
  email?: string;
  value?: string;
  currency?: string;
  nextContact?: string;
  source?: string;
  activities?: (Entity & { at: string; text: string })[];
  [key: string]: unknown;
}
export interface Conversation extends Entity {
  title: string;
  agent: string;
  context: string[];
  createdAt: string;
  messages: (Entity & { text: string; createdAt: string; pinned: boolean })[];
}
export interface AgentRecord extends Entity {
  name: string;
  role: string;
  description: string;
  symbol: string;
  status: string;
  color: string;
}
export interface Workspace {
  suite?: import("../../domains/settings/workbench-contracts").Suite;
  settings: WorkspaceSettings;
  product?: Partial<ProductCollections>;
  projects: LegacyRecord[];
  agents: AgentRecord[];
  conversations?: Conversation[];
  connectionProfiles?: Record<
    string,
    { account: string; notes: string; region: string; scopes: string[] }
  >;
  records: Record<string, LegacyRecord[]>;
  messages: (Entity & { role: "user" | "system"; text: string })[];
  posts: unknown[];
  approvals: unknown[];
  [key: string]: unknown;
}
export type WorkspaceUpdate = (
  change: Partial<Workspace> | ((current: Workspace) => Workspace),
) => void;
export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export interface WorkspaceIndex {
  active: string;
  items: { id: string; name: string }[];
}
export type WorkspaceRead =
  | { data: Workspace; raw: string | null; error: null }
  | { data: null; raw: string | null; error: string };
