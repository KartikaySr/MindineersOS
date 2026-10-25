import { useState } from "react";
import type {
  Workspace,
  WorkspaceUpdate,
} from "../../shared/contracts/workspace";
import {
  initialHistory,
  editHistory,
  moveHistory,
  replaceHistory,
} from "./model";
export function useWorkspaceHistory(initial: Workspace | (() => Workspace)) {
  const [history, setHistory] = useState(() =>
    initialHistory(typeof initial === "function" ? initial() : initial),
  );
  const update: WorkspaceUpdate = (change) => {
    const at = Date.now();
    setHistory((current) =>
      editHistory(current, history.generation, change, at),
    );
  };
  // Workspace switches, external conflict resolution, and imports invalidate history.
  const replace = (data: Workspace | ((current: Workspace) => Workspace)) =>
    setHistory((current) =>
      replaceHistory(
        current,
        typeof data === "function" ? data(current.present) : data,
      ),
    );
  const restore = (direction: "undo" | "redo", expected: Workspace) =>
    setHistory((current) =>
      current.present === expected ? moveHistory(current, direction) : current,
    );
  return { data: history.present, history, update, replace, restore };
}
