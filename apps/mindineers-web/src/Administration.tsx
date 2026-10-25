type Member = ProductCollections["members"][number];
type Role = ProductCollections["roles"][number];
type Editing = (Member & { type: "member" }) | (Role & { type: "role" });
import type {
  Workspace,
  WorkspaceUpdate,
  ProductCollections,
} from "./shared/contracts/workspace";
import Sessions from "./domains/administration/Sessions";
import Organization from "./domains/administration/Organization";
import PermissionInspector from "./domains/administration/PermissionInspector";
import BillingManagement from "./domains/administration/BillingManagement";
import AccessReview from "./AccessReview";
import SecurityIncidents from "./SecurityIncidents";
import { useState } from "react";
import { Button, Field, Dialog, Tabs, Empty, useCollection } from "./ProductUI";
import { uid, download } from "./product-model";
const capabilities = [
  "Read workspace",
  "Manage projects",
  "Configure agents",
  "Review actions",
  "Manage integrations",
  "Manage members",
  "Manage billing",
  "Manage policies",
];
export default function Administration({
  data,
  update,
}: {
  data: Workspace;
  update: WorkspaceUpdate;
}) {
  const [tab, setTab] = useState("Members"),
    [members, setMembers] = useCollection(data, update, "members"),
    [roles, setRoles] = useCollection(data, update, "roles"),
    [policies, setPolicies] = useCollection(data, update, "policies"),
    [editing, setEditing] = useState<Editing | null>(null),
    [search, setSearch] = useState("");
  const roleList = [
    { id: "owner", name: "Owner", permissions: capabilities },
    {
      id: "member",
      name: "Member",
      permissions: ["Read workspace", "Manage projects"],
    },
    { id: "viewer", name: "Viewer", permissions: ["Read workspace"] },
    ...roles,
  ];
  const policy = policies[0] || {
    id: "organization-policy",
    retention: "30",
    sso: "Optional",
    domain: "",
    approval: "Required for external writes",
    accessReview: "Quarterly",
    breakGlass: "",
    exportPolicy: "Workspace owner approval",
  };
  const patch = (fields: Partial<ProductCollections["policies"][number]>) =>
    setPolicies([{ ...policy, ...fields }]);
  return (
    <section className="product-page">
      <div className="product-banner">
        <div>
          <span className="eyebrow">ORGANIZATION</span>
          <h2>Clarity about who can do what.</h2>
          <p>
            Design your organization’s membership, roles, and policies.
            Enforcement and invitations require the identity backend.
          </p>
        </div>
        <span className="badge">Configuration workspace</span>
      </div>
      <Tabs
        values={[
          "Organization",
          "Effective access",
          "Members",
          "Roles",
          "Policies",
          "Sessions",
          "Audit",
          "Incidents",
          "Access review",
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === "Organization" ? (
        <Organization data={data} update={update} />
      ) : tab === "Effective access" ? (
        <PermissionInspector />
      ) : tab === "Access review" ? (
        <AccessReview data={data} update={update} roles={roleList} />
      ) : tab === "Incidents" ? (
        <SecurityIncidents data={data} update={update} />
      ) : tab === "Members" ? (
        <>
          <div className="toolbar">
            <input
              className="product-search"
              aria-label="Find members"
              placeholder="Search names or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button
              onClick={() =>
                setEditing({
                  type: "member",
                  id: uid(),
                  name: "",
                  email: "",
                  role: "member",
                  state: "Invitation draft",
                })
              }
            >
              + Prepare invitation
            </Button>
          </div>
          <div className="product-table-wrap">
            <table className="product-table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>{data.settings.name}</strong>
                    <small>Current device profile</small>
                  </td>
                  <td>Local owner</td>
                  <td>Device only</td>
                  <td>—</td>
                </tr>
                {members
                  .filter((m) =>
                    (m.name + " " + m.email)
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  )
                  .map((m) => (
                    <tr key={m.id}>
                      <td>
                        <strong>{m.name}</strong>
                        <small>{m.email}</small>
                      </td>
                      <td>
                        {roleList.find((r) => r.id === m.role)?.name ||
                          "Unassigned"}
                      </td>
                      <td>{m.state}</td>
                      <td>
                        <Button
                          onClick={() => setEditing({ ...m, type: "member" })}
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() =>
                            setMembers((rows) =>
                              rows.map((x) =>
                                x.id === m.id
                                  ? {
                                      ...x,
                                      state:
                                        x.state === "Archived"
                                          ? "Invitation draft"
                                          : "Archived",
                                    }
                                  : x,
                              ),
                            )
                          }
                        >
                          {m.state === "Archived" ? "Restore" : "Archive"}
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <p className="muted">
            No invitations are sent from this frontend. Drafts can be exported
            for review.
          </p>
          <Button onClick={() => download("membership-plan.json", members)}>
            Export membership plan
          </Button>
        </>
      ) : tab === "Roles" ? (
        <>
          <div className="toolbar">
            <p>Permissions are explicit and reviewable.</p>
            <Button
              onClick={() =>
                setEditing({
                  type: "role",
                  id: uid(),
                  name: "",
                  permissions: [],
                })
              }
            >
              + Custom role
            </Button>
          </div>
          <div className="product-cards">
            {roleList.map((r) => (
              <article className="panel" key={r.id}>
                <h3>{r.name}</h3>
                <ul>
                  {r.permissions.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                {roles.some((x) => x.id === r.id) && (
                  <Button onClick={() => setEditing({ ...r, type: "role" })}>
                    Edit role
                  </Button>
                )}
              </article>
            ))}
          </div>
        </>
      ) : tab === "Policies" ? (
        <div className="product-form-grid">
          <Field
            label="Retention days"
            type="number"
            min="1"
            value={policy.retention}
            onChange={(retention) => patch({ retention })}
          />
          <Field
            label="SSO requirement"
            options={["Optional", "Required"]}
            value={policy.sso}
            onChange={(sso) => patch({ sso })}
          />
          <Field
            label="Allowed email domain"
            value={policy.domain}
            onChange={(domain) => patch({ domain })}
          />
          <Field
            label="External action approval"
            options={["Required for external writes", "Required for all tools"]}
            value={policy.approval}
            onChange={(approval) => patch({ approval })}
          />
          <Field
            label="Access review cadence"
            options={["Monthly", "Quarterly", "Annually"]}
            value={policy.accessReview}
            onChange={(accessReview) => patch({ accessReview })}
          />
          <Field
            label="Export policy"
            options={[
              "Workspace owner approval",
              "Organization administrator approval",
            ]}
            value={policy.exportPolicy}
            onChange={(exportPolicy) => patch({ exportPolicy })}
          />
          <Field
            label="Emergency access procedure"
            type="textarea"
            value={policy.breakGlass}
            onChange={(breakGlass) => patch({ breakGlass })}
          />
        </div>
      ) : tab === "Sessions" ? (
        <Sessions />
      ) : (
        <>
          <Empty title="Audit history needs a trusted source.">
            Local configuration edits are not an authoritative audit trail.
            Connect the backend to inspect verified actor, action, resource, and
            timestamp records.
          </Empty>
          <Button
            onClick={() =>
              download("organization-configuration.json", {
                members,
                roles,
                policies,
              })
            }
          >
            Export current configuration
          </Button>
        </>
      )}
      {editing && (
        <AdminEditor
          record={editing}
          roles={roleList}
          close={() => setEditing(null)}
          save={(record) => {
            if (record.type === "member")
              setMembers((rows) =>
                rows.some((r) => r.id === record.id)
                  ? rows.map((r) => (r.id === record.id ? record : r))
                  : [...rows, record],
              );
            else
              setRoles((rows) =>
                rows.some((r) => r.id === record.id)
                  ? rows.map((r) => (r.id === record.id ? record : r))
                  : [...rows, record],
              );
            setEditing(null);
          }}
        />
      )}
    </section>
  );
}
function AdminEditor({
  record,
  roles,
  close,
  save,
}: {
  record: Editing;
  roles: Role[];
  close: () => void;
  save: (record: Editing) => void;
}) {
  const [draft, setDraft] = useState(record);
  return (
    <Dialog
      title={record.type === "member" ? "Prepare membership" : "Configure role"}
      close={close}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(draft);
        }}
      >
        <Field
          label="Name"
          required
          value={draft.name}
          onChange={(name) => setDraft({ ...draft, name })}
        />
        {draft.type === "member" ? (
          <>
            <Field
              label="Email"
              required
              type="email"
              value={draft.email}
              onChange={(email) => setDraft({ ...draft, email })}
            />
            <label>
              Role
              <select
                value={draft.role}
                onChange={(e) => setDraft({ ...draft, role: e.target.value })}
              >
                {roles.map((r) => (
                  <option value={r.id} key={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="notice">
              Saving prepares a local invitation draft. It does not create an
              account or grant access.
            </div>
          </>
        ) : (
          <fieldset className="product-checks">
            <legend>Permissions</legend>
            {capabilities.map((p) => (
              <label key={p}>
                <input
                  type="checkbox"
                  checked={draft.permissions.includes(p)}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      permissions: e.target.checked
                        ? [...draft.permissions, p]
                        : draft.permissions.filter((x) => x !== p),
                    })
                  }
                />
                {p}
              </label>
            ))}
          </fieldset>
        )}
        <div className="dialog-actions">
          <Button onClick={close}>Cancel</Button>
          <button className="button dark">Save configuration</button>
        </div>
      </form>
    </Dialog>
  );
}
export function Subscription({
  data,
  update,
}: {
  data: Workspace;
  update: WorkspaceUpdate;
}) {
  const [tab, setTab] = useState("Usage"),
    [preferences, setPreferences] = useCollection(data, update, "subscription");
  const config = preferences[0] || {
    id: "subscription",
    plan: "Personal",
    cycle: "Monthly",
    currency: "USD",
    budget: String(data.settings.budget),
    alert: "80",
    contact: "",
  };
  const patch = (fields: Partial<ProductCollections["subscription"][number]>) =>
    setPreferences([{ ...config, ...fields }]);
  const count = Object.values(data.records).reduce((n, a) => n + a.length, 0);
  return (
    <section className="product-page">
      <div className="product-banner">
        <div>
          <span className="eyebrow">USAGE & SUBSCRIPTION</span>
          <h2>Know what your workspace needs.</h2>
          <p>
            Track local activity and prepare your subscription preferences.
            Prices and entitlements will come from the billing service.
          </p>
        </div>
        <span className="badge">No active subscription</span>
      </div>
      <Tabs
        values={[
          "Usage",
          "Plans",
          "Budgets",
          "Invoices",
          "Manage subscription",
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === "Manage subscription" ? (
        <BillingManagement data={data} update={update} />
      ) : tab === "Usage" ? (
        <>
          <div className="mission-summary">
            {[
              [data.projects.length, "Projects"],
              [data.agents.length, "Agent profiles"],
              [count, "Workspace records"],
              ["—", "Provider spend"],
            ].map(([value, label]) => (
              <div key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="panel">
            <h3>Provider usage is not connected</h3>
            <p>
              Token usage, tool charges, reservations, and billed amounts will
              appear when verified billing events are available.
            </p>
          </div>
        </>
      ) : tab === "Plans" ? (
        <>
          <div className="product-cards">
            {(
              [
                [
                  "Personal",
                  "An individual workspace for focused work.",
                  [
                    "Projects and documents",
                    "Personal agent configurations",
                    "Individual usage controls",
                  ],
                ],
                [
                  "Team",
                  "Shared work with clear responsibilities.",
                  [
                    "Team workspaces",
                    "Role and approval management",
                    "Shared usage visibility",
                  ],
                ],
                [
                  "Organization",
                  "Administration across teams and workspaces.",
                  [
                    "Organization policy",
                    "Identity integration",
                    "Audit and access review",
                  ],
                ],
              ] as const
            ).map(([plan, desc, features]) => (
              <article
                className={
                  "panel plan-card " + (config.plan === plan ? "selected" : "")
                }
                key={plan}
              >
                <span className="eyebrow">{plan}</span>
                <h2>{plan}</h2>
                <p>{desc}</p>
                <strong>Pricing to be configured</strong>
                <ul>
                  {features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <Button onClick={() => patch({ plan })}>
                  {config.plan === plan ? "Preferred plan" : "Save preference"}
                </Button>
              </article>
            ))}
          </div>
          <p className="muted">
            Plan descriptions are product configuration drafts. Selecting one
            does not purchase or activate a subscription.
          </p>
        </>
      ) : tab === "Budgets" ? (
        <div className="product-form-grid">
          <Field
            label="Planned budget"
            type="number"
            min="0"
            value={config.budget}
            onChange={(budget) => patch({ budget })}
          />
          <Field
            label="Currency"
            options={["USD", "EUR", "GBP", "INR"]}
            value={config.currency}
            onChange={(currency) => patch({ currency })}
          />
          <Field
            label="Alert threshold (%)"
            type="number"
            min="1"
            max="100"
            value={config.alert}
            onChange={(alert) => patch({ alert })}
          />
          <Field
            label="Billing cycle preference"
            options={["Monthly", "Annually"]}
            value={config.cycle}
            onChange={(cycle) => patch({ cycle })}
          />
          <Field
            label="Billing contact"
            type="email"
            value={config.contact}
            onChange={(contact) => patch({ contact })}
          />
          <p className="notice">
            Budget enforcement and notifications require the billing backend.
          </p>
        </div>
      ) : (
        <Empty title="No invoices yet.">
          Issued invoices, payment status, and subscription receipts will appear
          after billing is connected.
        </Empty>
      )}
    </section>
  );
}
