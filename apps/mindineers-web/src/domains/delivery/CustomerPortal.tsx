import { useEffect, useState, useRef } from "react";
import { Button, Field } from "../../ProductUI";
import { ErrorState, LoadingState } from "../../shared/ui/AsyncState";
import { useResource } from "../../shared/services/useResource";
import { normalizeError, ServiceError } from "../../shared/services/errors";
import MarkdownPreview from "../product/MarkdownPreview";
import {
  loadPortal,
  checkedPortalAcknowledgement,
  disconnectedPortal,
} from "./portal";
import type {
  PortalService,
  PortalDelivery,
  PortalSession,
  PortalResponse,
} from "./portal";
const serviceKeys = new WeakMap<PortalService, number>();
let nextServiceKey = 0;
function serviceKey(service: PortalService) {
  let key = serviceKeys.get(service);
  if (key === undefined) {
    key = ++nextServiceKey;
    serviceKeys.set(service, key);
  }
  return key;
}
export default function CustomerPortal({
  service = disconnectedPortal,
}: {
  service?: PortalService;
}) {
  return (
    <main className="product-page customer-portal">
      <header>
        <a href="#welcome">MindineersOS</a>
        <h1>Your deliveries</h1>
      </header>
      {!service.available ? (
        <section className="panel">
          <h2>Customer access is not connected yet</h2>
          <p>
            Authenticated customer access requires the delivery service. Your
            internal workspace and local customer previews are not exposed here.
          </p>
          <a className="button" href="#sign-in">
            Go to account entry
          </a>
        </section>
      ) : (
        <ConnectedPortal key={serviceKey(service)} service={service} />
      )}
    </main>
  );
}
function ConnectedPortal({ service }: { service: PortalService }) {
  const [signedOut, setSignedOut] = useState(false),
    [message, setMessage] = useState("");
  const { state, retry } = useResource("customer-portal", (signal) =>
    loadPortal(service, signal),
  );
  const [expired, setExpired] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const signOutRequest = useRef<AbortController | null>(null);
  useEffect(() => () => signOutRequest.current?.abort(), []);
  useEffect(() => {
    if (state.status !== "ready") return;
    const check = () =>
      setExpired(Date.parse(state.data.session.expiresAt) <= Date.now());
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [state]);
  if (signedOut || expired)
    return (
      <section className="panel">
        <h2>{signedOut ? "Signed out" : "Session expired"}</h2>
        <p>Sign in again to access your deliveries.</p>
        <a href="#sign-in">Sign in</a>
      </section>
    );
  if (state.status === "loading")
    return <LoadingState label="Checking customer access…" />;
  if (state.status === "error")
    return (
      <ErrorState error={state.error} retry={retry}>
        <a href="#sign-in">Sign in</a>
      </ErrorState>
    );
  return (
    <>
      <p>Welcome, {state.data.session.displayName}</p>
      <Button
        disabled={signingOut}
        onClick={async () => {
          if (signOutRequest.current) return;
          const controller = new AbortController();
          signOutRequest.current = controller;
          setSigningOut(true);
          setMessage("");
          try {
            await service.signOut(controller.signal);
            if (!controller.signal.aborted) setSignedOut(true);
          } catch (e) {
            if (!controller.signal.aborted)
              setMessage(normalizeError(e).message);
          } finally {
            if (!controller.signal.aborted) {
              setSigningOut(false);
              signOutRequest.current = null;
            }
          }
        }}
      >
        {signingOut ? "Signing out…" : "Sign out"}
      </Button>
      {!state.data.deliveries.length && (
        <p>No deliveries have been shared with this account.</p>
      )}
      {state.data.deliveries.map((delivery) => (
        <PortalItem
          key={`${delivery.id}:${delivery.revision}`}
          delivery={delivery}
          session={state.data.session}
          service={service}
          refresh={retry}
        />
      ))}
      {message && <p role="alert">{message}</p>}
    </>
  );
}
function PortalItem({
  delivery,
  session,
  service,
  refresh,
}: {
  delivery: PortalDelivery;
  session: PortalSession;
  service: PortalService;
  refresh: () => void;
}) {
  const [message, setMessage] = useState(""),
    [decision, setDecision] =
      useState<PortalResponse["decision"]>("Request changes"),
    [reviewing, setReviewing] = useState(false),
    [pending, setPending] = useState(false),
    [receipt, setReceipt] = useState(""),
    [error, setError] = useState<ServiceError | null>(null);
  const [requestId] = useState(() => crypto.randomUUID());
  const [submitted, setSubmitted] = useState(false);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  const allowed =
    session.permissions.includes("delivery:respond") &&
    delivery.status === "Awaiting acceptance";
  return (
    <article className="panel">
      <h2>{delivery.name}</h2>
      <p>
        {delivery.status} · {delivery.due || "No due date"}
      </p>
      <h3>Updates</h3>
      {delivery.updates.map((u) => (
        <p key={u.id}>
          {u.text} · {u.at}
        </p>
      ))}
      <h3>Shared documents</h3>
      {delivery.documents.map((d) => (
        <details key={d.id}>
          <summary>{d.name}</summary>
          <MarkdownPreview body={d.body} />
        </details>
      ))}
      {allowed && !receipt ? (
        <section>
          <h3>Review delivery</h3>
          <Field
            label="Response"
            value={message}
            maxLength={10000}
            disabled={reviewing || submitted}
            onChange={setMessage}
            type="textarea"
          />
          <label>
            Decision
            <select
              disabled={reviewing || submitted}
              value={decision}
              onChange={(e) => {
                setDecision(
                  e.target.value === "Accept" ? "Accept" : "Request changes",
                );
                setReviewing(false);
              }}
            >
              <option>Request changes</option>
              <option>Accept</option>
            </select>
          </label>
          {!reviewing ? (
            <Button
              disabled={!message.trim()}
              onClick={() => setReviewing(true)}
            >
              Review response
            </Button>
          ) : (
            <section className="notice">
              <p>
                {decision} · revision {delivery.revision}
              </p>
              <p>{message}</p>
              <Button
                disabled={pending}
                onClick={async () => {
                  if (Date.parse(session.expiresAt) <= Date.now()) {
                    setError(new ServiceError("unauthorized"));
                    return;
                  }
                  setPending(true);
                  setSubmitted(true);
                  setError(null);
                  const controller = new AbortController();
                  active.current = controller;
                  const input: PortalResponse = {
                    deliveryId: delivery.id,
                    revision: delivery.revision,
                    decision,
                    message,
                    requestId,
                  };
                  try {
                    const response = await service.respond(
                      input,
                      controller.signal,
                    );
                    if (!controller.signal.aborted)
                      setReceipt(checkedPortalAcknowledgement(response, input));
                  } catch (e) {
                    if (!controller.signal.aborted) setError(normalizeError(e));
                  } finally {
                    if (!controller.signal.aborted) setPending(false);
                  }
                }}
              >
                {pending
                  ? "Waiting for confirmation…"
                  : "Confirm and send response"}
              </Button>
              <Button
                disabled={pending || submitted}
                onClick={() => setReviewing(false)}
              >
                Edit response
              </Button>
              {submitted && (
                <p>
                  A submitted response is locked while its outcome is uncertain.
                  Retrying uses the same request identity and payload; the
                  service must deduplicate it.
                </p>
              )}
            </section>
          )}
        </section>
      ) : (
        !receipt && (
          <p>
            This delivery is read-only for your account or current delivery
            state.
          </p>
        )
      )}
      {receipt && (
        <p role="status">Response acknowledged. Receipt: {receipt}</p>
      )}
      {error && <ErrorState error={error} />}
      {error?.code === "conflict" && (
        <Button onClick={refresh}>
          Load latest delivery before reviewing again
        </Button>
      )}
    </article>
  );
}
