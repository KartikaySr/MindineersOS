// Compile-time contract regression checks. This module is never imported by the app.
import type {
  Workspace,
  WorkspaceUpdate,
  ProductCollections,
} from "./workspace";
import type { RequestOptions } from "../services/transport";
import type { RouteId } from "../../app/routes";
export function contractChecks(update: WorkspaceUpdate, workspace: Workspace) {
  update((current) => ({
    ...current,
    settings: { ...current.settings, theme: "Dark" },
  }));
  // @ts-expect-error invalid theme must fail at the typed boundary
  update({ settings: { ...workspace.settings, theme: "Neon" } });
  // @ts-expect-error collections cannot be arbitrary strings
  const unknownCollection: keyof ProductCollections = "secretTokens";
  // @ts-expect-error routes must be registered
  const route: RouteId = "unregistered";
  const request: RequestOptions<number> = {
    path: "/api/value",
    // @ts-expect-error transport decoders must produce their declared output
    decode: () => "wrong",
  };
  return { unknownCollection, route, request };
}
