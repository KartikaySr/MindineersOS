import { useState } from "react";
import { Button, Field, useCollection } from "../../shared/ui/controls";
import type {
  Workspace,
  WorkspaceUpdate,
} from "../../shared/contracts/workspace";
import { readyRequest } from "./model";
import type { BillingRequest } from "./model";
export default function BillingManagement({
  data,
  update,
}: {
  data: Workspace;
  update: WorkspaceUpdate;
}) {
  const [requests, setRequests] = useCollection(
      data,
      update,
      "billingRequests",
    ),
    [profiles, setProfiles] = useCollection(data, update, "billingProfiles"),
    [action, setAction] = useState<BillingRequest["action"]>("Change plan"),
    [plan, setPlan] = useState("Team"),
    [cycle, setCycle] = useState("Monthly"),
    [effective, setEffective] =
      useState<BillingRequest["effective"]>("Next renewal"),
    [reason, setReason] = useState(""),
    [message, setMessage] = useState("");
  const profile = profiles[0] ?? {
    id: "billing-profile",
    company: "",
    email: "",
    address: "",
    country: "",
    purchaseOrder: "",
  };
  return (
    <section>
      <h2>Subscription management</h2>
      <div className="notice">
        No verified subscription, balance, renewal date, or payment method is
        available. This screen prepares requests only; it never purchases,
        cancels, or changes a subscription.
      </div>
      <h3>Billing profile draft</h3>
      <div className="business-grid">
        {(
          ["company", "email", "address", "country", "purchaseOrder"] as const
        ).map((key) => (
          <Field
            key={key}
            label={
              {
                company: "Company",
                email: "Billing email",
                address: "Billing address",
                country: "Country",
                purchaseOrder: "Purchase order reference",
              }[key]
            }
            value={profile[key]}
            onChange={(value) => setProfiles([{ ...profile, [key]: value }])}
          />
        ))}
      </div>
      <p className="muted">
        Stored on this device. Do not enter card numbers, bank details or tax
        identifiers. Payment methods will use the billing provider’s hosted
        interface.
      </p>
      <h3>Prepare a subscription change</h3>
      <Field
        label="Subscription action"
        options={[
          "Change plan",
          "Cancel renewal",
          "Resume renewal",
          "Billing support",
        ]}
        value={action}
        onChange={(v) => setAction(v as BillingRequest["action"])}
      />
      {action === "Change plan" && (
        <div className="business-grid">
          <Field
            label="Requested plan"
            options={["Personal", "Team", "Organization"]}
            value={plan}
            onChange={setPlan}
          />
          <Field
            label="Requested cycle"
            options={["Monthly", "Annually"]}
            value={cycle}
            onChange={setCycle}
          />
        </div>
      )}
      <Field
        label="Requested effective date"
        options={["Next renewal", "Request immediate change"]}
        value={effective}
        onChange={(v) => setEffective(v as BillingRequest["effective"])}
      />
      <Field
        label="Reason for change"
        type="textarea"
        value={reason}
        onChange={setReason}
      />
      <p>
        Prices, taxes, proration, credits, limits, and the effective date must
        be confirmed by a server quote before any subscription change. No
        estimate is fabricated here.
      </p>
      <Button
        onClick={() => {
          try {
            const request = readyRequest<BillingRequest>({
              id: crypto.randomUUID(),
              action,
              plan: action === "Change plan" ? plan : "",
              cycle,
              effective,
              reason,
              state: "Draft",
              at: new Date().toISOString(),
            });
            setRequests((all) => [request, ...all]);
            setReason("");
            setMessage("Request prepared. Subscription remains unchanged.");
          } catch (e) {
            setMessage(e instanceof Error ? e.message : "Invalid request.");
          }
        }}
      >
        Prepare change for review
      </Button>
      <Button disabled>
        Get authoritative quote · billing connection required
      </Button>
      {message && <p role="status">{message}</p>}
      <h3>Change requests</h3>
      {requests.map((r) => (
        <article className="panel" key={r.id}>
          <strong>
            {r.action} · {r.state}
          </strong>
          <p>
            {r.plan} {r.cycle} · {r.effective}
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
