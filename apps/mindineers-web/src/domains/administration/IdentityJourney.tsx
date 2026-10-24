import { useEffect, useRef, useState } from "react";
import { Button, Field } from "../../shared/ui/controls";
import { LoadingState, ErrorState } from "../../shared/ui/AsyncState";
import { ServiceError, normalizeError } from "../../shared/services/errors";
import {
  disconnectedIdentity,
  validateIdentityInput,
  checkedIdentityResult,
  isExpired,
} from "./identity";
import type {
  IdentityIntent,
  IdentityResult,
  IdentityService,
} from "./identity";
export default function IdentityJourney({
  intent,
  service = disconnectedIdentity,
}: {
  intent: IdentityIntent;
  service?: IdentityService;
}) {
  const [email, setEmail] = useState(""),
    [name, setName] = useState(""),
    [invitation, setInvitation] = useState(""),
    [code, setCode] = useState(""),
    [result, setResult] = useState<IdentityResult | null>(null),
    [error, setError] = useState<ServiceError | null>(null),
    [busy, setBusy] = useState(false),
    [now, setNow] = useState(Date.now());
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (!result) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [result]);
  const run = async (
    operation: (signal: AbortSignal) => Promise<IdentityResult | null>,
  ) => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError(null);
    setCode("");
    try {
      const response = await operation(controller.signal);
      if (!controller.signal.aborted)
        setResult(response ? checkedIdentityResult(response) : null);
    } catch (e) {
      if (!controller.signal.aborted) setError(normalizeError(e));
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  };
  const expired =
    result && (result.kind === "challenge" || result.kind === "invitation")
      ? isExpired(result.expiresAt, now)
      : result?.kind === "authenticated"
        ? isExpired(result.session.expiresAt, now)
        : false;
  return (
    <section aria-label="Cloud identity journey">
      <div className="notice">
        {service.available
          ? "Use your verified account service to continue. Verification codes remain in memory only."
          : "Cloud identity is not connected. No email, invitation or recovery request is sent; no password or verification code is collected."}
      </div>
      {!result ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async (signal) => {
              if (!service.available) throw new ServiceError("unavailable");
              const input = {
                intent,
                email: email.trim(),
                name: name.trim(),
                invitation: invitation.trim(),
              };
              validateIdentityInput(input);
              return service.begin(input, signal);
            });
          }}
        >
          {intent === "sign-up" && (
            <Field
              label="Your name"
              value={name}
              onChange={setName}
              required
              maxLength={120}
              autoComplete="name"
            />
          )}
          <Field
            label="Email address"
            type="email"
            value={email}
            onChange={setEmail}
            required
            maxLength={254}
            autoComplete="email"
          />
          {intent === "join" && (
            <Field
              label="Invitation reference"
              value={invitation}
              onChange={setInvitation}
              required
              maxLength={500}
            />
          )}
          <Button type="submit" disabled={busy}>
            {service.available
              ? "Continue securely"
              : "Check account availability"}
          </Button>
        </form>
      ) : result.kind === "challenge" ? (
        <>
          <h3>Verify your email</h3>
          <p>
            A code was requested for {result.destination}. It expires at{" "}
            {new Date(result.expiresAt).toLocaleString()}.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const submitted = code;
              void run((signal) => {
                if (expired || !/^\d{6,8}$/.test(submitted))
                  throw new ServiceError("validation");
                return service.verify(result.id, submitted, signal);
              });
            }}
          >
            <Field
              label="Verification code"
              value={code}
              onChange={setCode}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              required
              disabled={!!expired || busy}
            />
            <Button type="submit" disabled={!!expired || busy}>
              Verify code
            </Button>
          </form>
        </>
      ) : result.kind === "invitation" ? (
        <>
          <h3>Review your invitation</h3>
          <p>Organization: {result.organization}</p>
          <p>Proposed role: {result.role}</p>
          <p>Expires: {new Date(result.expiresAt).toLocaleString()}</p>
          <Button
            disabled={busy || !!expired}
            onClick={() =>
              void run((signal) => {
                if (expired) throw new ServiceError("unauthorized");
                return service.acceptInvitation(result.id, signal);
              })
            }
          >
            Accept reviewed invitation
          </Button>
          <Button disabled={busy} onClick={() => setResult(null)}>
            Decline and return
          </Button>
        </>
      ) : result.kind === "recovery-sent" ? (
        <>
          <h3>Check your email</h3>
          <p>
            If an eligible account exists, the account service will provide
            recovery instructions. Keep this window open or return after
            completing the instructions.
          </p>
        </>
      ) : (
        <>
          <h3>
            {expired
              ? "Your session has expired"
              : `Signed in as ${result.session.displayName}`}
          </h3>
          <p>
            {expired
              ? "Sign in again before attempting cloud actions."
              : "Your account service confirmed this session. Local workspace records have not been uploaded."}
          </p>
          {!expired && (
            <Button
              disabled={busy}
              onClick={() =>
                void run(async (signal) => {
                  await service.signOut(signal);
                  return null;
                })
              }
            >
              Sign out of cloud session
            </Button>
          )}
        </>
      )}
      {expired && (
        <p role="alert">
          This challenge, invitation, or session has expired. Start again to
          request current access.
        </p>
      )}
      {result && (
        <Button
          disabled={busy}
          onClick={() => {
            request.current?.abort();
            setResult(null);
            setCode("");
            setError(null);
          }}
        >
          Start again
        </Button>
      )}
      {busy && <LoadingState label="Waiting for identity service…" />}
      {error && <ErrorState error={error} />}
      <p className="muted">
        Cloud access is checked by the identity service. Local workspace access
        is not proof of authentication.
      </p>
    </section>
  );
}
