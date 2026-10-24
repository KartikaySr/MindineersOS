import React, { useState } from "react";
import { Button, Field, useCollection } from "./ProductUI";
import { uid, download } from "./product-model";
export default function AccessReview({ data, update, roles }) {
  const [reviews, setReviews] = useCollection(data, update, "accessReviews"),
    [memberId, setMemberId] = useState(""),
    [decision, setDecision] = useState("Retain"),
    [reason, setReason] = useState(""),
    [due, setDue] = useState(""),
    [message, setMessage] = useState("");
  const members = data.product?.members || [],
    member = members.find((m) => m.id === memberId),
    role = roles.find((r) => r.id === member?.role);
  return (
    <section>
      <h2>Access review</h2>
      <p>
        Inspect proposed role permissions and record a review decision. These
        configuration drafts do not prove effective server access; revocation
        requires the identity backend.
      </p>
      <label className="product-field">
        Member
        <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
          <option value="">Select member</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} · {m.state}
            </option>
          ))}
        </select>
      </label>
      {member && (
        <article className="panel">
          <h3>
            {member.name} · {role?.name || "Unassigned role"}
          </h3>
          {role?.permissions.length ? (
            <ul>
              {role.permissions.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          ) : (
            <p>No proposed permissions.</p>
          )}
          <p>
            Source: role configuration in this workspace. Mandatory policies and
            resource-level grants are not yet available from an authorization
            service.
          </p>
        </article>
      )}
      <div className="business-grid">
        <Field
          label="Review decision"
          value={decision}
          options={["Retain", "Change requested", "Revoke requested"]}
          onChange={setDecision}
        />
        <Field
          label="Next review due"
          type="date"
          value={due}
          onChange={setDue}
        />
      </div>
      <Field
        label="Review rationale"
        type="textarea"
        value={reason}
        onChange={setReason}
      />
      <Button
        disabled={!member || !reason.trim() || !due}
        onClick={() => {
          setReviews((rows) => [
            ...rows,
            {
              id: uid(),
              memberId,
              memberName: member.name,
              roleName: role?.name || "Unassigned",
              permissions: [...(role?.permissions || [])],
              decision,
              reason,
              due,
              actor: data.settings.name || "Owner",
              at: new Date().toISOString(),
            },
          ]);
          setReason("");
          setMessage(
            "Review recorded locally. No access was granted or revoked.",
          );
        }}
      >
        Record review
      </Button>
      <Button onClick={() => download("access-review-records.json", reviews)}>
        Export review records
      </Button>
      {message && <p role="status">{message}</p>}
      <h3>Review history</h3>
      {reviews.map((r) => (
        <article className="panel" key={r.id}>
          <h3>
            {r.memberName} · {r.decision}
          </h3>
          <p>{r.reason}</p>
          <p>
            Reviewed role: {r.roleName} ·{" "}
            {r.permissions.join(", ") || "No permissions"}
          </p>
          <small>
            {r.actor} · {r.at} · Next review {r.due}
          </small>
        </article>
      ))}
    </section>
  );
}
