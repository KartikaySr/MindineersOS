import type { Graph } from "../execution/model";
import type {
  ChecklistItem,
  LegacyRecord,
} from "../../shared/contracts/workspace";
import type { Settings } from "./model";
export interface Version {
  id: string;
  at: string;
  values: Record<string, string>;
  graph?: Graph | undefined;
}
export interface InvoiceDraft {
  rows: { id: string; name: string; quantity: number; unitMinor: number }[];
  currency?: string;
  taxBps?: number;
}
export interface EvidenceDraft {
  id: string;
  at: string;
  url: string;
  excerpt: string;
  assessment: string;
}
export interface TrialDraft {
  id: string;
  name: string;
  result: string;
}
export interface Detail {
  values: Record<string, string>;
  history: Version[];
  checklist: ChecklistItem[];
  comments: { id: string; text: string; at: string }[];
  links: string[];
  graph?: Graph | undefined;
  publishedGraph?: Graph;
  publishedAt?: string;
  updatedAt?: string;
  invoice?: InvoiceDraft;
  evidence?: EvidenceDraft[];
  trials?: TrialDraft[];
}
export interface Suite {
  details: Record<string, Detail>;
  runs: { id: string; name?: string; title?: string }[];
  settings: Settings;
  localRecords: Record<string, LegacyRecord[]>;
}
