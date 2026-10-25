import ReviewPanel from "./domains/product/ReviewPanel";
import type {
  Workspace,
  WorkspaceUpdate,
  CampaignRecord,
} from "./shared/contracts/workspace";
import { useState } from "react";
import { Button, Field, Tabs, Empty, useCollection } from "./ProductUI";
import { uid, download } from "./product-model";
export default function CreativeStudio({
  data,
  update,
}: {
  data: Workspace;
  update: WorkspaceUpdate;
}) {
  const [campaigns, setCampaigns] = useCollection(data, update, "campaigns"),
    [selected, setSelected] = useState(""),
    [tab, setTab] = useState("Brief");
  const campaign = campaigns.find((c) => c.id === selected) || campaigns[0];
  const patch = (fields: Partial<CampaignRecord>) =>
    setCampaigns((rows) =>
      rows.map((c) => (c.id === campaign?.id ? { ...c, ...fields } : c)),
    );
  const create = () => {
    const c = {
      id: uid(),
      name: "Untitled campaign",
      audience: "",
      message: "",
      brand: "",
      channel: "Website",
      rights: "",
      origin: "User authored",
      variants: [],
      schedule: "",
      account: "",
      status: "Draft",
    };
    setCampaigns((rows) => [c, ...rows]);
    setSelected(c.id);
  };
  return (
    <section className="product-page">
      <div className="product-banner">
        <div>
          <span className="eyebrow">CREATIVE STUDIO</span>
          <h2>Give an idea a voice.</h2>
          <p>
            Shape the brief, compare directions, and review every detail before
            publishing.
          </p>
        </div>
        <Button onClick={create}>+ Campaign</Button>
      </div>
      <div className="product-split">
        <aside className="product-list">
          {campaigns.map((c) => (
            <button
              key={c.id}
              className={c.id === campaign?.id ? "active" : ""}
              onClick={() => setSelected(c.id)}
            >
              <strong>{c.name}</strong>
              <small>
                {c.channel} · {c.status}
              </small>
            </button>
          ))}
        </aside>
        {campaign ? (
          <article className="product-detail">
            <div className="product-editor-title">
              <input
                aria-label="Campaign title"
                value={campaign.name}
                onChange={(e) => patch({ name: e.target.value })}
              />
              <Button onClick={() => download("creative-brief.json", campaign)}>
                Export
              </Button>
            </div>
            <Tabs
              values={["Brief", "Variants", "Rights", "Publishing"]}
              value={tab}
              onChange={setTab}
            />
            {tab === "Brief" ? (
              <>
                <Field
                  label="Audience"
                  value={campaign.audience}
                  onChange={(audience) => patch({ audience })}
                />
                <Field
                  label="Core message"
                  type="textarea"
                  value={campaign.message}
                  onChange={(message) => patch({ message })}
                />
                <Field
                  label="Brand guidelines"
                  type="textarea"
                  value={campaign.brand}
                  onChange={(brand) => patch({ brand })}
                />
                <Field
                  label="Channel"
                  options={[
                    "Website",
                    "LinkedIn",
                    "Instagram",
                    "Email",
                    "Presentation",
                    "Video",
                  ]}
                  value={campaign.channel}
                  onChange={(channel) => patch({ channel })}
                />
              </>
            ) : tab === "Variants" ? (
              <>
                <Button
                  onClick={() =>
                    patch({
                      variants: [
                        ...campaign.variants,
                        {
                          id: uid(),
                          name: "Direction " + (campaign.variants.length + 1),
                          headline: "",
                          body: "",
                          alt: "",
                          locale: "en",
                          status: "Draft",
                        },
                      ],
                    })
                  }
                >
                  + Add direction
                </Button>
                <div className="product-cards creative-variants">
                  {campaign.variants.map((v) => (
                    <article className="panel" key={v.id}>
                      <div className="creative-preview">
                        <span>{campaign.channel}</span>
                        <h2>{v.headline || "Your headline goes here."}</h2>
                        <p>
                          {v.body ||
                            "Make the idea clear. Give it a reason to matter."}
                        </p>
                      </div>
                      {(
                        [
                          ["name", "Direction name"],
                          ["headline", "Headline"],
                          ["body", "Body"],
                          ["alt", "Accessibility description"],
                          ["locale", "Locale"],
                        ] as const
                      ).map(([key, label]) => (
                        <Field
                          key={key}
                          label={label}
                          type={key === "body" ? "textarea" : "text"}
                          value={v[key]}
                          onChange={(value) =>
                            patch({
                              variants: campaign.variants.map((x) =>
                                x.id === v.id ? { ...x, [key]: value } : x,
                              ),
                            })
                          }
                        />
                      ))}
                      <Field
                        label="Review status"
                        options={[
                          "Draft",
                          "In review",
                          "Approved",
                          "Changes requested",
                        ]}
                        value={v.status}
                        onChange={(status) =>
                          patch({
                            variants: campaign.variants.map((x) =>
                              x.id === v.id ? { ...x, status } : x,
                            ),
                          })
                        }
                      />
                    </article>
                  ))}
                </div>
              </>
            ) : tab === "Rights" ? (
              <>
                <Field
                  label="Content origin"
                  options={[
                    "User authored",
                    "Uploaded reference",
                    "AI generated",
                    "Mixed sources",
                  ]}
                  value={campaign.origin}
                  onChange={(origin) => patch({ origin })}
                />
                <Field
                  label="Rights, licenses, and source credits"
                  type="textarea"
                  value={campaign.rights}
                  onChange={(rights) => patch({ rights })}
                />
                <p className="muted">
                  Rights information is supplied by the workspace owner and has
                  not been independently verified.
                </p>
              </>
            ) : (
              <>
                <Field
                  label="Destination account"
                  value={campaign.account}
                  onChange={(account) => patch({ account })}
                />
                <Field
                  label="Planned publication"
                  type="datetime-local"
                  value={campaign.schedule}
                  onChange={(schedule) => patch({ schedule })}
                />
                <Field
                  label="Campaign status"
                  options={["Draft", "In review", "Ready for publishing"]}
                  value={campaign.status}
                  onChange={(status) => patch({ status })}
                />
                <div className="notice">
                  {
                    campaign.variants.filter((v) => v.status === "Approved")
                      .length
                  }{" "}
                  approved variants. Publishing requires a connected account and
                  an approved action.
                </div>
                <Button disabled>Publish to account</Button>
              </>
            )}
            <ReviewPanel
              key={campaign.id}
              data={data}
              update={update}
              domain="Creative"
              entityId={campaign.id}
              content={campaign}
              errors={
                !campaign.rights.trim() ||
                !campaign.variants.length ||
                campaign.variants.some((v) => !v.alt.trim() || !v.body.trim())
                  ? [
                      "Add rights, at least one complete variant, and accessibility descriptions.",
                    ]
                  : []
              }
            />
          </article>
        ) : (
          <Empty title="Start with the story.">
            Create a campaign to organize a brief, variations, rights, and a
            publishing plan.
          </Empty>
        )}
      </div>
    </section>
  );
}
