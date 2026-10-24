import { useState } from "react";
import { Field } from "../../shared/ui/controls";
import { permissionDecision } from "./model";
import type { PermissionState } from "./model";
export default function PermissionInspector({
  state = { status: "disconnected" },
}: {
  state?: PermissionState;
}) {
  const [action, setAction] = useState("organizations.create");
  const decision = permissionDecision(state, action);
  return (
    <section>
      <h2>Effective access</h2>
      <p>
        Local role drafts describe intended access. They never grant effective
        permissions.
      </p>
      <Field
        label="Action to inspect"
        value={action}
        options={[
          "organizations.create",
          "members.invite",
          "members.revoke",
          "integrations.connect",
          "integrations.revoke",
          "billing.manage",
          "policies.manage",
        ]}
        onChange={setAction}
      />
      <div className="notice" role="status">
        <strong>{decision.allowed ? "Allowed" : "Unavailable / denied"}</strong>
        <p>{decision.reason}</p>
      </div>
      <p>
        Resource-level policy decisions and mandatory organization restrictions
        must come from the authorization service. Hidden or disabled buttons are
        not a substitute for server enforcement.
      </p>
    </section>
  );
}
