import { useRef, useEffect, useState } from "react";
import { Button, Field } from "../../shared/ui/controls";
import { ServiceError, normalizeError } from "../../shared/services/errors";
import type { TraceRecord } from "../../shared/contracts/workspace";
export type RunAction = "Pause" | "Resume" | "Cancel";
export interface RuntimeControl {
  available: boolean;
  command(
    runId: string,
    action: RunAction,
    reason: string,
    requestId: string,
    signal: AbortSignal,
  ): Promise<{
    requestId: string;
    runId: string;
    action: RunAction;
    status: string;
  }>;
}
export const disconnectedRuntime: RuntimeControl = {
  available: false,
  async command() {
    throw new ServiceError("unavailable");
  },
};
export function validateAcknowledgement(
  value: unknown,
  requestId: string,
  runId: string,
  action: RunAction,
): string {
  if (
    !value ||
    typeof value !== "object" ||
    !("requestId" in value) ||
    !("runId" in value) ||
    !("action" in value) ||
    !("status" in value) ||
    value.requestId !== requestId ||
    value.runId !== runId ||
    value.action !== action ||
    typeof value.status !== "string" ||
    ![
      "Accepted",
      ({ Pause: "Paused", Resume: "Running", Cancel: "Cancelled" } as const)[
        action
      ],
    ].includes(value.status)
  )
    throw new ServiceError("validation");
  return value.status;
}
export default function RunControls({
  run,
  service = disconnectedRuntime,
  verified = false,
}: {
  run: TraceRecord;
  service?: RuntimeControl;
  verified?: boolean;
}) {
  const [action, setAction] = useState<RunAction>("Pause"),
    [reason, setReason] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [pending, setPending] = useState(false),
    [message, setMessage] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const enabled = service.available && verified;
  return (
    <section>
      <h3>Runtime controls</h3>
      <p>
        {enabled
          ? "Commands wait for a matching runtime acknowledgement. Acknowledgement does not replace refreshed run telemetry."
          : "This trace is not an authenticated live runtime record. Controls are unavailable; imported/example traces cannot authorize execution."}
      </p>
      <Field
        label="Runtime action"
        value={action}
        options={["Pause", "Resume", "Cancel"]}
        onChange={(v) => setAction(v as RunAction)}
        disabled={pending}
      />
      <Field
        label="Reason for command"
        value={reason}
        onChange={setReason}
        disabled={pending}
      />
      {action === "Cancel" && (
        <Field
          label="Type CANCEL to confirm"
          value={confirmation}
          onChange={setConfirmation}
          disabled={pending}
        />
      )}
      <Button
        disabled={
          !enabled ||
          pending ||
          !reason.trim() ||
          (action === "Cancel" && confirmation !== "CANCEL")
        }
        onClick={async () => {
          const requestId = crypto.randomUUID(),
            c = new AbortController();
          controller.current = c;
          setPending(true);
          setMessage("");
          const timer = setTimeout(() => {
            if (c.signal.aborted) return;
            c.abort();
            setPending(false);
            setMessage(
              "No acknowledgement received within 30 seconds. The command outcome is unknown; inspect runtime telemetry before trying again.",
            );
          }, 30000);
          try {
            const ack = await service.command(
              run.id,
              action,
              reason,
              requestId,
              c.signal,
            );
            if (!c.signal.aborted)
              setMessage(
                `Runtime acknowledged ${action}: ${validateAcknowledgement(ack, requestId, run.id, action)}. Refresh authoritative telemetry for the resulting state.`,
              );
          } catch (e) {
            if (!c.signal.aborted) setMessage(normalizeError(e).message);
          } finally {
            clearTimeout(timer);
            if (!c.signal.aborted) setPending(false);
          }
        }}
      >
        {pending
          ? "Awaiting runtime acknowledgement…"
          : `Request ${action.toLowerCase()}`}
      </Button>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
