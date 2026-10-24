import React, { useState } from "react";
import { ArrowRight, ShieldCheck, User, Check, Upload } from "lucide-react";
import { ThemeToggle } from "./Welcome";
import { Field } from "./ProductUI";
import { validateExperience } from "./experience-model";
export function AccountEntry({ route, theme, toggle }) {
  const [message, setMessage] = useState("");
  const recovery = route === "recovery",
    signup = route === "sign-up",
    join = route === "join";
  return (
    <div className="account-entry">
      <header>
        <a className="exp-brand" href="#welcome">
          m✳ mindineersOS
        </a>
        <ThemeToggle theme={theme} toggle={toggle} />
      </header>
      <main>
        <section className="account-story">
          <span className="exp-kicker">YOUR NEXT CHAPTER</span>
          <h1>
            Great work starts
            <br />
            with a little
            <br />
            <em>headspace.</em>
          </h1>
          <p>
            One home for your ideas, commitments, and the work that matters.
          </p>
          <div className="account-orb" aria-hidden="true">
            ✳
          </div>
          <span className="exp-pill">Personal by design. Directed by you.</span>
        </section>
        <section className="account-form">
          <span className="exp-kicker">MINDINEERS ACCOUNT</span>
          <h2>
            {recovery
              ? "Find your way back."
              : signup
                ? "Make space for your ambition."
                : join
                  ? "Join your team."
                  : "Welcome back."}
          </h2>
          <p>
            {recovery
              ? "Recover access to a connected cloud account."
              : signup
                ? "Your cloud identity will connect your work across devices."
                : join
                  ? "Review your invitation when the account service is available."
                  : "Open your local workspace or connect your cloud identity."}
          </p>
          <a href="#home" className="exp-button primary">
            Continue to local workspace <ArrowRight size={18} />
          </a>
          <div className="account-divider">CLOUD ACCOUNT</div>
          <div className="notice">
            <ShieldCheck size={20} />
            <p>
              Cloud authentication is not connected. No password is collected
              and no account, invitation or recovery email will be created.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setMessage(
                "The account service is unavailable. Your details were not sent or saved. You can continue to your local workspace.",
              );
            }}
          >
            {signup && (
              <label>
                Your name
                <input
                  name="name"
                  autoComplete="name"
                  maxLength={120}
                  required
                />
              </label>
            )}
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                placeholder="you@example.com"
              />
            </label>
            {join && (
              <label>
                Invitation reference
                <input
                  name="invitation"
                  maxLength={500}
                  required
                  placeholder="Invitation reference from your team"
                />
              </label>
            )}
            <button className="exp-button" type="submit">
              Check{" "}
              {recovery
                ? "recovery"
                : signup
                  ? "signup"
                  : join
                    ? "invitation"
                    : "sign-in"}{" "}
              availability
            </button>
            {message && (
              <p role="status" className="notice">
                {message}
              </p>
            )}
          </form>
          <nav aria-label="Account options">
            <a href="#sign-in">Sign in</a>
            <a href="#sign-up">Create account</a>
            <a href="#recovery">Recover access</a>
            <a href="#join">Join a team</a>
          </nav>
          <small>
            Local workspace access is not authentication. Anyone using this
            browser profile may access its stored data.
          </small>
        </section>
      </main>
    </div>
  );
}
export function ProfileExperience({ data, update, startTour, resumeSetup }) {
  const [form, setForm] = useState(() => ({
      name: data.settings.name,
      ...{
        email: "",
        title: "",
        bio: "",
        pronouns: "",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: "en-IN",
        focus: "",
        avatar: "",
        useCase: "Personal",
      },
      ...data.settings.profile,
    })),
    [status, setStatus] = useState(""),
    [dirty, setDirty] = useState(false);
  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
    setStatus("");
  };
  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 250000
    ) {
      setStatus("Choose a PNG, JPEG or WebP image under 250 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set("avatar", String(reader.result));
    reader.onerror = () =>
      setStatus("The image could not be read. Try another file.");
    reader.readAsDataURL(file);
  };
  const save = (e) => {
    e.preventDefault();
    try {
      const { name, ...profile } = form;
      validateExperience({ profile });
      if (!name.trim()) throw new Error("Enter your name.");
      update((d) => ({
        ...d,
        settings: { ...d.settings, name: name.trim(), profile },
      }));
      setDirty(false);
      setStatus("Profile saved on this device.");
    } catch (error) {
      setStatus(error.message);
    }
  };
  return (
    <div className="profile-experience">
      <section className="profile-cover">
        <div className="profile-portrait">
          {form.avatar ? (
            <img src={form.avatar} alt="Your profile" />
          ) : (
            <User size={38} />
          )}
        </div>
        <div>
          <span className="exp-kicker">YOUR SPACE. YOUR WAY.</span>
          <h1>{form.name || "Your profile"}</h1>
          <p>{form.title || "Make your workspace feel like you."}</p>
        </div>
        <span className="exp-pill">Local profile · not verified</span>
      </section>
      <div className="profile-grid">
        <form className="exp-panel" onSubmit={save}>
          <header>
            <h2>Personal details</h2>
            <span>{dirty ? "Unsaved changes" : "Saved preferences"}</span>
          </header>
          <div className="exp-actions">
            <label className="exp-button">
              <Upload size={16} />
              Upload avatar
              <input
                className="visually-hidden"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={upload}
              />
            </label>
            {form.avatar && (
              <button
                type="button"
                className="exp-button"
                onClick={() => set("avatar", "")}
              >
                Remove image
              </button>
            )}
            <small>PNG, JPEG or WebP · up to 250 KB</small>
          </div>
          <div className="profile-fields">
            <Field
              label="Display name"
              value={form.name}
              onChange={(v) => set("name", v)}
              required
              maxLength={120}
            />
            <Field
              label="Email (unverified contact detail)"
              type="email"
              value={form.email}
              onChange={(v) => set("email", v)}
              maxLength={254}
            />
            <Field
              label="Role or headline"
              value={form.title}
              onChange={(v) => set("title", v)}
              maxLength={120}
            />
            <Field
              label="Pronouns (optional)"
              value={form.pronouns}
              onChange={(v) => set("pronouns", v)}
              maxLength={60}
            />
            <Field
              label="Time zone"
              value={form.timezone}
              onChange={(v) => set("timezone", v)}
              maxLength={100}
            />
            <Field
              label="Locale preference"
              value={form.locale}
              onChange={(v) => set("locale", v)}
              options={["en-IN", "en-US", "en-GB", "fr-FR", "de-DE", "ja-JP"]}
            />
          </div>
          <Field
            label="About you"
            type="textarea"
            value={form.bio}
            onChange={(v) => set("bio", v)}
            maxLength={2000}
          />
          <Field
            label="Your current focus"
            value={form.focus}
            onChange={(v) => set("focus", v)}
            placeholder="What would make this week meaningful?"
            maxLength={300}
          />
          <Field
            label="How you use MindineersOS"
            value={form.useCase}
            onChange={(v) => set("useCase", v)}
            options={["Personal", "Founder", "Team"]}
          />
          <p className="exp-muted">
            Locale and time zone are saved preferences for future connected
            services. Existing calendar entries retain their own time zones.
          </p>
          <div className="exp-actions">
            <button className="exp-button primary" type="submit">
              <Check size={16} />
              Save profile
            </button>
            <button
              type="button"
              className="exp-button"
              onClick={() => {
                setForm({
                  name: data.settings.name,
                  email: "",
                  title: "",
                  bio: "",
                  pronouns: "",
                  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                  locale: "en-IN",
                  focus: "",
                  avatar: "",
                  useCase: "Personal",
                  ...data.settings.profile,
                });
                setDirty(false);
                setStatus("");
              }}
            >
              Revert edits
            </button>
          </div>
          {status && (
            <p role="status" className="notice">
              {status}
            </p>
          )}
        </form>
        <aside>
          <section className="exp-panel">
            <h2>Appearance & comfort</h2>
            <p>
              Choose your atmosphere. It follows you across the website and
              workspace.
            </p>
            <div className="theme-choices">
              {["Light", "Dark"].map((t) => (
                <button
                  aria-pressed={data.settings.theme === t}
                  key={t}
                  className={"theme-swatch " + t.toLowerCase()}
                  onClick={() =>
                    update((d) => ({
                      ...d,
                      settings: { ...d.settings, theme: t },
                    }))
                  }
                >
                  <span />
                  <strong>
                    {t === "Light" ? "Light green" : "Luxury dark"}
                  </strong>
                  {data.settings.theme === t && <Check size={16} />}
                </button>
              ))}
            </div>
            <label className="toggle-row">
              Reduce motion
              <input
                type="checkbox"
                checked={data.settings.motion}
                onChange={(e) =>
                  update((d) => ({
                    ...d,
                    settings: { ...d.settings, motion: e.target.checked },
                  }))
                }
              />
            </label>
            <label className="toggle-row">
              Show in-app notices
              <input
                type="checkbox"
                checked={data.settings.notifications}
                onChange={(e) =>
                  update((d) => ({
                    ...d,
                    settings: {
                      ...d.settings,
                      notifications: e.target.checked,
                    },
                  }))
                }
              />
            </label>
          </section>
          <section className="exp-panel">
            <h2>Make yourself at home</h2>
            <p>
              Discover your dashboard, workspaces, decisions and personal guide.
            </p>
            <button className="exp-button" onClick={startTour}>
              Replay guided tour <ArrowRight size={16} />
            </button>
            <button className="exp-button" onClick={resumeSetup}>
              Resume workspace setup
            </button>
          </section>
          <section className="exp-panel">
            <h2>Account & privacy</h2>
            <p>
              This profile is saved in this workspace. It does not establish an
              identity or permissions.
            </p>
            <a className="exp-button" href="#sign-in">
              Cloud account options
            </a>
            <a className="exp-button" href="#settings">
              Backups & data controls
            </a>
            <a className="exp-button" href="#security">
              Security preferences
            </a>
          </section>
        </aside>
      </div>
    </div>
  );
}
