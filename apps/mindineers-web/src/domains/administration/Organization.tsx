import { useState } from "react";
import { Button, Field, useCollection } from "../../shared/ui/controls";
import type {
  Workspace,
  WorkspaceUpdate,
} from "../../shared/contracts/workspace";
import { organizationErrors, permissionDecision } from "./model";
import type { OrganizationDraft } from "./model";
export default function Organization({
  data,
  update,
}: {
  data: Workspace;
  update: WorkspaceUpdate;
}) {
  const [rows, setRows] = useCollection(data, update, "organizations"),
    [selected, select] = useState(""),
    [message, setMessage] = useState("");
  const record = rows.find((r) => r.id === selected) ?? rows[0];
  const patch = (fields: Partial<OrganizationDraft>) =>
    setRows((all) =>
      all.map((r) =>
        r.id === record?.id ? { ...r, ...fields, state: "Draft" } : r,
      ),
    );
  return (
    <section>
      <div className="toolbar">
        <h2>Organization setup</h2>
        <Button
          onClick={() => {
            const r: OrganizationDraft = {
              id: crypto.randomUUID(),
              name: "",
              slug: "",
              contact: "",
              region: "Unspecified",
              domains: "",
              state: "Draft",
            };
            setRows((all) => [...all, r]);
            select(r.id);
          }}
        >
          + Organization draft
        </Button>
      </div>
      <div className="notice">
        Organization drafts live in this workspace. They do not create a cloud
        tenant, claim a domain, or enforce membership.
      </div>
      {rows.length > 0 && (
        <label className="product-field">
          Organization
          <select
            value={record?.id ?? ""}
            onChange={(e) => select(e.target.value)}
          >
            {rows.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name || "Untitled organization"}
              </option>
            ))}
          </select>
        </label>
      )}
      {record && (
        <>
          <div className="business-grid">
            <Field
              label="Organization name"
              value={record.name}
              onChange={(name) => patch({ name })}
            />
            <Field
              label="Organization slug"
              value={record.slug}
              onChange={(slug) => patch({ slug })}
            />
            <Field
              label="Administrative contact"
              type="email"
              value={record.contact}
              onChange={(contact) => patch({ contact })}
            />
            <Field
              label="Preferred data region"
              options={[
                "Unspecified",
                "India",
                "European Union",
                "United States",
              ]}
              value={record.region}
              onChange={(region) => patch({ region })}
            />
          </div>
          <Field
            label="Proposed email domains"
            value={record.domains}
            onChange={(domains) => patch({ domains })}
          />
          <p>
            Domain ownership requires a server-issued challenge and
            verification. No domain is verified by entering it here.
          </p>
          <Button
            onClick={() => {
              const errors = organizationErrors(record);
              if (
                rows.some((r) => r.id !== record.id && r.slug === record.slug)
              )
                errors.push("Another local draft uses this slug.");
              if (errors.length) {
                setMessage(errors.join(" "));
                return;
              }
              setRows((all) =>
                all.map((r) =>
                  r.id === record.id ? { ...r, state: "Ready for review" } : r,
                ),
              );
              setMessage(
                "Organization draft is ready for review. No cloud organization was created.",
              );
            }}
          >
            Validate setup draft
          </Button>
          <p>Status: {record.state}</p>
          <Button
            disabled
            title={
              permissionDecision(
                { status: "disconnected" },
                "organizations.create",
              ).reason
            }
          >
            Create cloud organization · identity required
          </Button>
        </>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
