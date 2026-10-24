import { useState } from "react";
import { Button, Dialog, Field } from "../../shared/ui/controls";
import { useResource } from "../../shared/services/useResource";
import { LoadingState, ErrorState } from "../../shared/ui/AsyncState";
import { ServiceError, normalizeError } from "../../shared/services/errors";
export interface SessionRecord {
  id: string;
  device: string;
  lastActive: string;
  expiresAt: string;
  current: boolean;
}
export interface SessionService {
  list(signal: AbortSignal): Promise<SessionRecord[]>;
  revoke(id: string): Promise<void>;
}
const disconnected: SessionService = {
  async list() {
    throw new ServiceError("unavailable");
  },
  async revoke() {
    throw new ServiceError("unavailable");
  },
};
export default function Sessions({
  service = disconnected,
}: {
  service?: SessionService;
}) {
  const { state, retry } = useResource("identity-sessions", (signal) =>
    service.list(signal),
  );
  const [selected, select] = useState<SessionRecord | null>(null),
    [confirmation, setConfirmation] = useState(""),
    [pending, setPending] = useState(false),
    [error, setError] = useState<ServiceError | null>(null);
  return (
    <section>
      <h2>Authenticated sessions</h2>
      <p>
        Sessions are supplied by the identity service. Revocation is only shown
        as complete after that service acknowledges it.
      </p>
      {state.status === "loading" ? (
        <LoadingState />
      ) : state.status === "error" ? (
        <ErrorState error={state.error} retry={retry} />
      ) : state.data.length ? (
        state.data.map((s) => (
          <article key={s.id} className="panel">
            <strong>
              {s.device}
              {s.current ? " · Current session" : ""}
            </strong>
            <p>
              Last active: {s.lastActive} · Expires: {s.expiresAt}
            </p>
            <Button
              onClick={() => {
                select(s);
                setConfirmation("");
                setError(null);
              }}
            >
              Review revocation
            </Button>
          </article>
        ))
      ) : (
        <p>No active sessions were returned by the account service.</p>
      )}
      {selected && (
        <Dialog
          title="Revoke a session"
          close={() => {
            if (!pending) select(null);
          }}
        >
          <p>
            Revoke access for {selected.device}?{" "}
            {selected.current
              ? "This is your current cloud session. You will need to sign in again."
              : "The device will need to sign in again."}{" "}
            Local browser files are not erased.
          </p>
          <Field
            label="Type REVOKE to confirm"
            value={confirmation}
            onChange={setConfirmation}
          />
          <Button
            disabled={confirmation !== "REVOKE" || pending}
            onClick={async () => {
              setPending(true);
              setError(null);
              try {
                await service.revoke(selected.id);
                select(null);
                retry();
              } catch (e) {
                setError(normalizeError(e));
              } finally {
                setPending(false);
              }
            }}
          >
            {pending
              ? "Waiting for acknowledgement…"
              : "Revoke selected session"}
          </Button>
          {error && <ErrorState error={error} />}
        </Dialog>
      )}
    </section>
  );
}
