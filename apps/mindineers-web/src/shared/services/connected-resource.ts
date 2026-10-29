import {ServiceError} from "./errors";
import {validateDataTree} from "./input-safety";
export interface ResourceScope {workspaceId: string; kind: "knowledge" | "device" | "model" | "publication" | "catalog" | "improvement"; entityId: string}
export interface ConnectedSnapshot extends ResourceScope {revision: string; state: string; confirmedAt: string; warnings: string[]; facts: {label: string; value: string}[]; actions: {id: string; label: string; effect: string}[]}
export interface ResourceCommand extends ResourceScope {revision: string; action: string; requestId: string}
export interface CommandReceipt {requestId: string; state: "Accepted" | "Completed" | "Rejected" | "Outcome unknown"; receiptId: string; message: string}
export interface ConnectedResourceService {available: boolean; read(scope: ResourceScope, signal: AbortSignal): Promise<unknown>; command(command: ResourceCommand, signal: AbortSignal): Promise<unknown>}
const unavailable = async (): Promise<never> => {throw new ServiceError("unavailable");};
export const disconnectedResource: ConnectedResourceService = {available: false, read: unavailable, command: unavailable};
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === "string" && v.length <= 10000;
export function checkedResource(value: unknown, scope: ResourceScope): ConnectedSnapshot {
  validateDataTree(value);
  if (!object(value) || value.workspaceId !== scope.workspaceId || value.kind !== scope.kind || value.entityId !== scope.entityId || !text(value.revision) || !value.revision || !text(value.state) || !text(value.confirmedAt) || !Number.isFinite(Date.parse(value.confirmedAt)) || !Array.isArray(value.warnings) || !value.warnings.every(text) || !Array.isArray(value.facts) || value.facts.length > 100 || !Array.isArray(value.actions) || value.actions.length > 20) throw new ServiceError("validation");
  const facts=value.facts.map((f: unknown) => {if (!object(f) || !text(f.label) || !text(f.value)) throw new ServiceError("validation"); return {label:f.label,value:f.value};});
  const actions=value.actions.map((a: unknown) => {if (!object(a) || !text(a.id) || !a.id || !text(a.label) || !text(a.effect)) throw new ServiceError("validation"); return {id:a.id,label:a.label,effect:a.effect};});
  if (new Set(actions.map(a=>a.id)).size !== actions.length) throw new ServiceError("validation");
  return {...scope,revision:value.revision,state:value.state,confirmedAt:value.confirmedAt,warnings:value.warnings,facts,actions};
}
export function checkedCommand(value: unknown, input: ResourceCommand): CommandReceipt {
  validateDataTree(value);
  if (!object(value) || value.workspaceId !== input.workspaceId || value.entityId !== input.entityId || value.kind !== input.kind || value.revision !== input.revision || value.action !== input.action || value.requestId !== input.requestId || !text(value.receiptId) || !value.receiptId || !text(value.message) || (value.state !== "Accepted" && value.state !== "Completed" && value.state !== "Rejected" && value.state !== "Outcome unknown")) throw new ServiceError("validation");
  return {requestId:input.requestId,state:value.state,receiptId:value.receiptId,message:value.message};
}
