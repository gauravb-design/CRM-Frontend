import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { PageHeader } from "../../layout/PageHeader";
import { fullName, initials } from "../../lib/format";
import { profileUrl } from "../../lib/linkedin";
import { STATUS_PILL } from "../../lib/tokens";
import { ROUTES } from "../../routes";
import {
  contactById, dealFor, openTasksFor, sequenceById, timelineFor,
} from "../../state/selectors";
import { useCrm } from "../../state/store";
import { Button, LinkButton } from "../../ui/Button";
import { Card } from "../../ui/Feedback";
import { Avatar, Pill } from "../../ui/Pill";
import { Tabs } from "../../ui/Tabs";
import { ContactFacts } from "./ContactFacts";
import { ContactTimeline } from "./ContactTimeline";

const TABS = [
  { id: "activity", label: "Activity" },
  { id: "emails", label: "Emails" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "notes", label: "Notes" },
];

export function ContactPage() {
  const { state, dispatch } = useCrm();
  const nav = useNavigate();
  const { id } = useParams();
  const [tab, setTab] = useState("activity");
  const [note, setNote] = useState("");

  const c = contactById(state, Number(id));
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

  const saveNote = () => {
    if (!note.trim()) {
      dispatch({ type: "toast", text: "Nothing to log." });
      return;
    }
    dispatch({ type: "addNote", cid: c.id, body: note.trim() });
    setNote("");
  };

  return (
    <>
      <PageHeader
        title={fullName(c)}
        sub={`${c.title} at ${c.company} · ${c.location}`}
        actions={
          <>
            <Pill tone={STATUS_PILL[c.status]}>{c.status}</Pill>
            {profileUrl(c.linkedin) && (
              <LinkButton href={profileUrl(c.linkedin)!}>LinkedIn ↗</LinkButton>
            )}
            {!dealFor(state, c.id) && (
              <Button onClick={() => dispatch({ type: "createDeal", cid: c.id })}>Create deal</Button>
            )}
            <Button variant="primary" onClick={() => nav(ROUTES.contactEdit(c.id))}>
              Edit
            </Button>
            <Button onClick={() => nav(ROUTES.contacts)}>Back</Button>
          </>
        }
      />

      <div className="flex-1 min-h-0 flex">
        <ContactFacts
          contact={c}
          deal={dealFor(state, c.id)}
          sequence={sequenceById(state, c.seqId)}
          tasks={openTasksFor(state, c.id)}
        />

        <div className="flex-1 min-w-0 flex flex-col">
          <Tabs
            tabs={TABS.map((t) => ({
              id: t.id,
              label: t.label,
              count: timelineFor(state, c.id, t.id).length,
            }))}
            active={tab}
            onChange={setTab}
            className="px-5"
          />

          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
            <div className="flex items-center gap-3 mb-4">
              <Avatar size={34}>{initials(c)}</Avatar>
              <Card className="flex-1 px-[13px] py-[11px]">
                <textarea
                  className="w-full min-h-[58px] text-[12.5px] leading-relaxed bg-transparent border-none resize-y p-[2px] outline-none"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Log a note, a call, or something that happened off-platform"
                />
                <div className="flex justify-end mt-[6px]">
                  <Button variant="primary" onClick={saveNote}>
                    Log it
                  </Button>
                </div>
              </Card>
            </div>

            <ContactTimeline entries={timelineFor(state, c.id, tab)} />
          </div>
        </div>
      </div>
    </>
  );
}
