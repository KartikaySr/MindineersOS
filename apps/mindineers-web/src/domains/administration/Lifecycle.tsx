import { useState } from "react";
import { Button, Field, useCollection } from "../../shared/ui/controls";
import type {
  Workspace,
  WorkspaceUpdate,
} from "../../shared/contracts/workspace";
import { readyRequest } from "./model";
import type { LifecycleRequest } from "./model";
export default function Lifecycle({
  data,
  update,
  provider,
  account,
  scopes,
}: {
  data: Workspace;
  update: WorkspaceUpdate;
  provider: string;
  account: string;
  scopes: string[];
}) {
  const [requests, setRequests] = useCollection(
      data,
      update,
      "connectionRequests",
    ),
    [action, setAction] = useState<LifecycleRequest["action"]>("Connect"),
    [reason, setReason] = useState(""),
    [message, setMessage] = useState("");
  return (
    <section>
      <h3>Connection lifecycle</h3>
      <dl className="product-facts">
        <dt>Authorization</dt>
        <dd>Not connected</dd>
        <dt>Granted scopes</dt>
        <dd>Unavailable from provider</dd>
        <dt>Last sync / health</dt>
        <dd>No verified activity</dd>
        <dt>Credential expiry</dt>
        <dd>Unavailable</dd>
      </dl>
      <Field
        label="Requested lifecycle action"
        options={["Connect", "Change scopes", "Reconnect", "Revoke"]}
        value={action}
        onChange={(v) => setAction(v as LifecycleRequest["action"])}
      />
      <Field
        label="Reason / affected resources"
        value={reason}
        type="textarea"
        onChange={setReason}
      />
      <Button
        onClick={() => {
          try {
            const r = readyRequest<LifecycleRequest>({
              id: crypto.randomUUID(),
              provider,
              account,
              scopes: [...scopes],
              action,
              reason,
              state: "Draft",
              at: new Date().toISOString(),
            });
            setRequests((all) => [r, ...all]);
            setReason("");
            setMessage(
              "Request prepared locally. Provider access has not changed.",
            );
          } catch (e) {
            setMessage(
              e instanceof Error ? e.message : "Request could not be prepared.",
            );
          }
        }}
      >
        Prepare reviewed request
      </Button>
      <p>
        Reconnection and scope changes need provider consent. Revocation
        requires a server acknowledgement; deleting a local configuration does
        not revoke provider access.
      </p>
      {message && <p role="status">{message}</p>}
      {requests
        .filter((r) => r.provider === provider)
        .map((r) => (
          <article className="panel" key={r.id}>
            <strong>
              {r.action} · {r.state}
            </strong>
            <p>
              {r.account} ·{" "}
              {r.scopes.join(", ") || "Revoke all existing grants"}
            </p>
            <p>{r.reason}</p>
            <small>{r.at}</small>
            {r.state !== "Withdrawn" && (
              <Button
                onClick={() =>
                  setRequests((all) =>
                    all.map((x) =>
                      x.id === r.id ? { ...x, state: "Withdrawn" } : x,
                    ),
                  )
                }
              >
                Withdraw local request
              </Button>
            )}
          </article>
        ))}
    </section>
  );
}
