import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { OWNERS } from "../../data/contacts";
import type { ContactStatus } from "../../data/types";
import { PageHeader } from "../../layout/PageHeader";
import { looksLikeLinkedIn, profileUrl } from "../../lib/linkedin";
import { ROUTES } from "../../routes";
import { contactById } from "../../state/selectors";
import { useCrm } from "../../state/store";
import { Button } from "../../ui/Button";
import { Field, FormPanel, inputCls } from "../../ui/Field";

const STATUSES: ContactStatus[] = [
  "New", "Contacted", "Replied", "Interested", "Unqualified", "Unsubscribed", "Bounced",
];

export function EditContactPage() {
  const { state, dispatch } = useCrm();
  const nav = useNavigate();
  const { id } = useParams();
  const c = contactById(state, Number(id));

  const [f, setF] = useState({
    firstName: c?.firstName ?? "",
    lastName: c?.lastName ?? "",
    title: c?.title ?? "",
    company: c?.company ?? "",
    email: c?.email ?? "",
    linkedin: c?.linkedin === "—" ? "" : (c?.linkedin ?? ""),
    location: c?.location ?? "",
    owner: c?.owner ?? OWNERS[0],
    status: c?.status ?? "New",
    hook: c?.hook ?? "",
  });

  if (!c) {
    return (
      <>
        <PageHeader title="Contact not found" sub="It may have been removed" />
        <div className="p-6">
          <Button onClick={() => nav(ROUTES.contacts)}>Back to contacts</Button>
        </div>
      </>
    );
  }

  const set =
    (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setF((prev) => ({ ...prev, [k]: e.target.value }));

  const linkedinWarning =
    f.linkedin.trim() && !looksLikeLinkedIn(f.linkedin)
      ? "That does not look like a LinkedIn profile. It will still be saved and opened as typed."
      : "Pasted straight from the browser is fine — the scheme is added for you.";

  const save = () => {
    if (!f.firstName.trim() || !f.email.trim()) {
      dispatch({ type: "toast", text: "A first name and a work email are the minimum." });
      return;
    }
    dispatch({
      type: "saveContact",
      id: c.id,
      patch: {
        firstName: f.firstName.trim(),
        lastName: f.lastName.trim() || "—",
        title: f.title.trim() || "Unknown",
        company: f.company.trim() || "Unknown",
        email: f.email.trim().toLowerCase(),
        // Store what they typed; profileUrl() adds the scheme when opening, so
        // the field stays readable in the table.
        linkedin: f.linkedin.trim() || "—",
        location: f.location.trim() || "—",
        owner: f.owner,
        status: f.status as ContactStatus,
        hook: f.hook.trim(),
      },
    });
    nav(ROUTES.contact(c.id));
  };

  return (
    <>
      <PageHeader
        title={`Edit ${c.firstName} ${c.lastName}`}
        sub="Everything the sequence and the LinkedIn queue read from"
        actions={
          <>
            <Button onClick={() => nav(ROUTES.contact(c.id))}>Cancel</Button>
            <Button variant="primary" onClick={save}>
              Save changes
            </Button>
          </>
        }
      />

      <FormPanel>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name">
            <input className={inputCls} value={f.firstName} onChange={set("firstName")} />
          </Field>
          <Field label="Last name">
            <input className={inputCls} value={f.lastName} onChange={set("lastName")} />
          </Field>
          <Field label="Title">
            <input className={inputCls} value={f.title} onChange={set("title")} />
          </Field>
          <Field label="Company">
            <input className={inputCls} value={f.company} onChange={set("company")} />
          </Field>
          <Field label="Work email">
            <input className={inputCls} value={f.email} onChange={set("email")} />
          </Field>
          <Field label="Location">
            <input className={inputCls} value={f.location} onChange={set("location")} />
          </Field>

          <Field label="LinkedIn profile" span hint={linkedinWarning}>
            <input
              className={inputCls}
              value={f.linkedin}
              onChange={set("linkedin")}
              placeholder="linkedin.com/in/jamie-fowler"
            />
          </Field>

          <Field label="Owner">
            <select className={`${inputCls} chev cursor-pointer`} value={f.owner} onChange={set("owner")}>
              {OWNERS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </Field>
          <Field label="Status" hint="Normally set by the flow. Change it only to correct a mistake.">
            <select className={`${inputCls} chev cursor-pointer`} value={f.status} onChange={set("status")}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>

          <Field
            label="What we noticed"
            span
            hint="The opener is written from this. One concrete thing about their site, not a compliment."
          >
            <textarea
              className={`${inputCls} min-h-[74px] leading-relaxed resize-y`}
              value={f.hook}
              onChange={set("hook")}
              placeholder="checkout makes people create an account before they can pay"
            />
          </Field>
        </div>

        {profileUrl(f.linkedin) && (
          <p className="text-[11.5px] text-muted mt-3">
            Opens as <span className="text-ink2">{profileUrl(f.linkedin)}</span>
          </p>
        )}
      </FormPanel>
    </>
  );
}
