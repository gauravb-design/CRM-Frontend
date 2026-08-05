import { useState } from "react";
import { useNavigate } from "react-router";
import { OWNERS, NOW } from "../../data/contacts";
import { CONNECTS_PER_PROPOSAL } from "../../data/upwork";
import { PageHeader } from "../../layout/PageHeader";
import { proposalDraft } from "../../lib/upworkAi";
import { ROUTES } from "../../routes";
import { useCrm } from "../../state/store";
import { Button } from "../../ui/Button";
import { Notice } from "../../ui/Feedback";
import { Field, FormPanel, inputCls } from "../../ui/Field";

/**
 * A proposal is the only way a client enters the CRM through Upwork, so this
 * page creates both at once. Splitting them would leave orphan clients every
 * time someone abandoned a draft.
 */
export function NewProposalPage() {
  const { state, dispatch } = useCrm();
  const nav = useNavigate();

  const [f, setF] = useState({
    jobTitle: "",
    jobUrl: "",
    budget: "",
    profileId: String(state.upworkProfiles[0]?.id ?? 1),
    clientName: "",
    company: "",
    clientTitle: "",
    body: "",
  });

  const set =
    (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setF((prev) => ({ ...prev, [k]: e.target.value }));

  const profile = state.upworkProfiles.find((p) => p.id === Number(f.profileId));

  const draft = () => {
    if (!f.jobTitle.trim() || !profile) {
      dispatch({ type: "toast", text: "Add the job title first — the draft is written from it." });
      return;
    }
    const parts = f.clientName.trim().split(/\s+/);
    const stub = {
      firstName: parts[0] || "there",
      lastName: parts.slice(1).join(" ") || "—",
      company: f.company.trim() || "the team",
    };
    setF((prev) => ({ ...prev, body: proposalDraft(f.jobTitle, profile, stub as never) }));
  };

  const save = (send: boolean) => {
    if (!f.jobTitle.trim()) {
      dispatch({ type: "toast", text: "A job title is the minimum." });
      return;
    }
    if (!f.clientName.trim() && !f.company.trim()) {
      dispatch({ type: "toast", text: "Name the client or the company — the proposal creates them." });
      return;
    }
    if (send && !f.body.trim()) {
      dispatch({ type: "toast", text: "Nothing to send — the proposal is empty." });
      return;
    }

    const parts = f.clientName.trim().split(/\s+/);
    dispatch({
      type: "createProposal",
      proposal: {
        profileId: Number(f.profileId),
        jobTitle: f.jobTitle.trim(),
        jobUrl: f.jobUrl.trim(),
        budget: f.budget.trim() || "Not stated",
        connects: CONNECTS_PER_PROPOSAL,
        body: f.body,
        state: send ? "Sent" : "Draft",
      },
      client: {
        firstName: parts[0] || f.company.trim(),
        lastName: parts.slice(1).join(" ") || "—",
        title: f.clientTitle.trim() || "Unknown",
        company: f.company.trim() || "Unknown",
        location: "—",
        email: "—",
        linkedin: "—",
        hook: "",
        status: "Contacted",
        owner: OWNERS[0],
        source: "Upwork",
        seqId: 0,
        seqStep: 0,
        createdAt: NOW,
        lastAt: NOW,
        li: "none",
        liAt: null,
        recycleAt: null,
      },
    });
    nav(ROUTES.upworkProposals);
  };

  return (
    <>
      <PageHeader
        title="New proposal"
        sub={`Creates the client too · ${CONNECTS_PER_PROPOSAL} connects to submit`}
        actions={
          <>
            <Button onClick={() => nav(ROUTES.upworkProposals)}>Cancel</Button>
            <Button onClick={() => save(false)}>Save as draft</Button>
            <Button variant="primary" onClick={() => save(true)}>
              Mark submitted
            </Button>
          </>
        }
      />

      <FormPanel width={760}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Job title" span>
            <input className={inputCls} value={f.jobTitle} onChange={set("jobTitle")} placeholder="Redesign analytics dashboard for B2B SaaS" />
          </Field>
          <Field label="Job URL">
            <input className={inputCls} value={f.jobUrl} onChange={set("jobUrl")} placeholder="upwork.com/jobs/~01…" />
          </Field>
          <Field label="Budget">
            <input className={inputCls} value={f.budget} onChange={set("budget")} placeholder="$3,000 – $5,000" />
          </Field>

          <Field label="Client name">
            <input className={inputCls} value={f.clientName} onChange={set("clientName")} placeholder="Marcus Feld" />
          </Field>
          <Field label="Company">
            <input className={inputCls} value={f.company} onChange={set("company")} placeholder="Northlane Analytics" />
          </Field>
          <Field label="Their title">
            <input className={inputCls} value={f.clientTitle} onChange={set("clientTitle")} placeholder="Head of Product" />
          </Field>
          <Field label="Send from profile">
            <select className={`${inputCls} chev cursor-pointer`} value={f.profileId} onChange={set("profileId")}>
              {state.upworkProfiles.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name} · ${p.rate}/hr
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex items-center gap-2 mt-4 mb-[7px]">
          <span className="text-[10.5px] text-muted uppercase tracking-[0.06em]">Proposal</span>
          <div className="flex-1" />
          <Button small onClick={draft}>
            Draft it for me
          </Button>
        </div>
        <textarea
          className={`${inputCls} min-h-[220px] leading-relaxed resize-y`}
          value={f.body}
          onChange={set("body")}
          placeholder="Open on their problem, not on you."
        />

        <div className="mt-3">
          <Notice>
            Upwork has no API for this, so submitting happens in Upwork itself. Marking it submitted
            here is what keeps the connect count and the reply rate honest.
          </Notice>
        </div>
      </FormPanel>
    </>
  );
}
