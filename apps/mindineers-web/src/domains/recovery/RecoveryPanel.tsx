import { useState } from "react";
import { Button, Dialog } from "../../shared/ui/controls";
import type { Workspace } from "../../shared/contracts/workspace";
import type { History } from "./model";
export default function RecoveryPanel({
  history,
  restore,
  blocked,
}: {
  history: History;
  restore: (direction: "undo" | "redo", expected: Workspace) => void;
  blocked: boolean;
}) {
  const [choice, setChoice] = useState<{
    direction: "undo" | "redo";
    expected: Workspace;
  } | null>(null);
  const revision =
    choice?.direction === "redo" ? history.future.at(-1) : history.past.at(-1);
  const stale = choice && choice.expected !== history.present;
  return (
    <div
      className="recovery-controls"
      role="group"
      aria-label="Workspace edit recovery"
    >
      <Button
        disabled={blocked || !history.past.length}
        onClick={() =>
          setChoice({ direction: "undo", expected: history.present })
        }
      >
        Undo workspace edit
      </Button>
      <Button
        disabled={blocked || !history.future.length}
        onClick={() =>
          setChoice({ direction: "redo", expected: history.present })
        }
      >
        Redo workspace edit
      </Button>
      <span className="sr-only" role="status">
        {history.restores
          ? `Workspace recovery ${history.restores} applied.`
          : ""}
      </span>
      {choice && (
        <Dialog title="Review workspace recovery" close={() => setChoice(null)}>
          <p>
            This restores local workspace records and settings. Uploaded file
            bytes and external actions are not restored. Open workspace editors
            are reset to the restored values.
          </p>
          <p>
            Changed areas: {revision?.areas.join(", ") || "None"}. Up to 20
            edits, within an 8 MB serialized-snapshot budget, are retained in
            memory; reloads, workspace switches and backup imports clear this
            history.
          </p>
          {stale && (
            <p role="alert">
              The workspace changed while this review was open. Close and review
              again.
            </p>
          )}
          <Button
            disabled={blocked || !!stale || !revision}
            onClick={() => {
              restore(choice.direction, choice.expected);
              setChoice(null);
            }}
          >
            Confirm {choice.direction}
          </Button>
          <Button onClick={() => setChoice(null)}>Cancel</Button>
        </Dialog>
      )}
    </div>
  );
}
