import { useEffect, useRef, useState } from "react";
import { Button } from "./controls";
import { LoadingState, ErrorState } from "./AsyncState";
import { useResource } from "../services/useResource";
import { normalizeError } from "../services/errors";
import type { ServiceError } from "../services/errors";
import {
  checkedResource,
  checkedCommand,
  disconnectedResource,
} from "../services/connected-resource";
import type {
  ConnectedResourceService,
  ResourceScope,
  ResourceCommand,
  CommandReceipt,
} from "../services/connected-resource";
const serviceIds = new WeakMap<ConnectedResourceService, number>();
let nextServiceId = 0;
function serviceIdentity(service: ConnectedResourceService) {
  let id = serviceIds.get(service);
  if (id === undefined) {
    id = ++nextServiceId;
    serviceIds.set(service, id);
  }
  return id;
}
export default function ConnectedResourcePanel({
  scope,
  title,
  service = disconnectedResource,
}: {
  scope: ResourceScope;
  title: string;
  service?: ConnectedResourceService;
}) {
  return (
    <section className="panel">
      <h3>{title}</h3>
      {service.available ? (
        <Connected
          key={`${serviceIdentity(service)}:${JSON.stringify(scope)}`}
          scope={scope}
          service={service}
        />
      ) : (
        <>
          <p>
            This service is not connected. Local configuration does not grant
            access or execute an operation.
          </p>
          <p>
            When connected, this panel shows service-confirmed status,
            capabilities, permission-scoped actions, and receipts.
          </p>
        </>
      )}
    </section>
  );
}
function Connected({
  scope,
  service,
}: {
  scope: ResourceScope;
  service: ConnectedResourceService;
}) {
  const { state, retry } = useResource(JSON.stringify(scope), async (signal) =>
    checkedResource(await service.read(scope, signal), scope),
  );
  const [command, setCommand] = useState<ResourceCommand | null>(null),
    [pending, setPending] = useState(false),
    [receipt, setReceipt] = useState<CommandReceipt | null>(null),
    [error, setError] = useState<ServiceError | null>(null),
    [attempted, setAttempted] = useState(false);
  const [reviewEffect, setReviewEffect] = useState("");
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  const [, tick] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);
  if (state.status === "loading")
    return <LoadingState label="Loading verified resource status…" />;
  if (state.status === "error")
    return <ErrorState error={state.error} retry={retry} />;
  const snapshot = state.data,
    stale = Date.now() - Date.parse(snapshot.confirmedAt) > 300000;
  return (
    <>
      <p>
        {snapshot.state} · Confirmed{" "}
        {new Date(snapshot.confirmedAt).toLocaleString()}
      </p>
      {stale && (
        <p role="status">
          This snapshot is older than five minutes. Refresh before taking
          action.
        </p>
      )}
      {snapshot.warnings.map((w, i) => (
        <p className="notice" key={i}>
          {w}
        </p>
      ))}
      <dl>
        {snapshot.facts.map((f, i) => (
          <div key={i}>
            <dt>{f.label}</dt>
            <dd>{f.value}</dd>
          </div>
        ))}
      </dl>
      <Button
        disabled={pending}
        onClick={() => {
          if (
            !attempted ||
            receipt?.state === "Completed" ||
            receipt?.state === "Rejected" ||
            !attempted
          ) {
            setCommand(null);
            setReceipt(null);
            setError(null);
            setAttempted(false);
          }
          retry();
        }}
      >
        Refresh status
      </Button>
      {!snapshot.actions.length && (
        <p>No permitted actions are available for this resource.</p>
      )}
      {!command &&
        snapshot.actions.map((a) => (
          <Button
            disabled={stale}
            key={a.id}
            onClick={() => {
              setReviewEffect(a.effect);
              setCommand({
                ...scope,
                revision: snapshot.revision,
                action: a.id,
                requestId: crypto.randomUUID(),
              });
            }}
          >
            {a.label}
          </Button>
        ))}
      {command && (
        <section className="notice">
          <h4>Review action</h4>
          <p>{reviewEffect}</p>
          <p>
            Resource {scope.entityId} · revision {command.revision}
          </p>
          <Button
            disabled={
              pending ||
              receipt?.state === "Completed" ||
              receipt?.state === "Rejected" ||
              (!attempted && stale) ||
              !navigator.onLine
            }
            onClick={async () => {
              if (active.current) return;
              if (
                !navigator.onLine ||
                (!attempted &&
                  Date.now() - Date.parse(snapshot.confirmedAt) > 300000)
              )
                return;
              setPending(true);
              setAttempted(true);
              setError(null);
              const c = new AbortController();
              active.current = c;
              try {
                const value = await service.command(command, c.signal);
                if (!c.signal.aborted)
                  setReceipt(checkedCommand(value, command));
              } catch (e) {
                if (!c.signal.aborted) setError(normalizeError(e));
              } finally {
                if (!c.signal.aborted) {
                  setPending(false);
                  active.current = null;
                }
              }
            }}
          >
            {pending
              ? "Waiting for acknowledgement…"
              : attempted
                ? "Retry same request"
                : "Confirm action"}
          </Button>
          <Button
            disabled={pending || attempted}
            onClick={() => setCommand(null)}
          >
            Cancel review
          </Button>
          {attempted && (
            <p>
              A timeout does not prove failure. Retrying preserves the request
              ID; the backend must deduplicate it. Refreshing status keeps this
              request locked until a matching completed or rejected receipt is
              returned. Retry the same request to check its outcome.
            </p>
          )}
        </section>
      )}
      {receipt && (
        <p role="status">
          {receipt.state} · {receipt.message} · receipt {receipt.receiptId}
          {receipt.state === "Accepted"
            ? " · Execution is not yet confirmed."
            : ""}
        </p>
      )}
      {error && <ErrorState error={error} />}
    </>
  );
}
