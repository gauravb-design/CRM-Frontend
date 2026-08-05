import { useState } from "react";
import { useNavigate } from "react-router";
import { LI_DAILY_CAP, LI_WEEKLY_CAP } from "../../data/pipeline";
import { PageHeader } from "../../layout/PageHeader";
import { cx, fullName, initials } from "../../lib/format";
import { profileUrl } from "../../lib/linkedin";
import { LI_LABEL, LI_PILL } from "../../lib/tokens";
import { ROUTES } from "../../routes";
import { LI_TABS, contactById, liConversations, liWaiting } from "../../state/selectors";
import { useCrm } from "../../state/store";
import { Button, LinkButton } from "../../ui/Button";
import { Notice } from "../../ui/Feedback";
import { inputCls } from "../../ui/Field";
import { Avatar, Pill } from "../../ui/Pill";
import { Tabs } from "../../ui/Tabs";
import { ChatComposer } from "./ChatComposer";
import { ChatThread } from "./ChatThread";
import { ConversationList } from "./ConversationList";

const EMPTIES: Record<string, string> = {
  to_send: "Nothing to send. Import a list to fill the queue.",
  awaiting: "Nothing outstanding.",
  to_message: "Nobody waiting on a message.",
  conversation: "No conversations open.",
  recycled: "Nothing parked.",
};

export function LinkedInPage() {
  const { state, dispatch } = useCrm();
  const nav = useNavigate();
  const [tab, setTab] = useState("to_send");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  const rows = liConversations(state, tab, search);
  const open = openId === null ? null : contactById(state, openId);
  const capped = state.liSentToday >= LI_DAILY_CAP;
  const url = open ? profileUrl(open.linkedin) : null;

  /* The funnel action for whichever step this person is on. Everything else
   * about them lives in the chat below. */
  const funnelAction = () => {
    if (!open) return null;
    switch (open.li) {
      case "none":
        return (
          <Button variant="primary" onClick={() => dispatch({ type: "liSend", cid: open.id })}>
            Mark request sent
          </Button>
        );
      case "requested":
        return (
          <Button
            variant="primary"
            onClick={() => dispatch({ type: "liSet", cid: open.id, li: "accepted", note: "Connection accepted" })}
          >
            They accepted
          </Button>
        );
      case "recycled":
        return (
          <Button variant="primary" onClick={() => dispatch({ type: "liRestore", cid: open.id })}>
            Bring back
          </Button>
        );
      default:
        return (
          <Button onClick={() => dispatch({ type: "liRecycle", cid: open.id })}>Recycle</Button>
        );
    }
  };

  return (
    <>
      <PageHeader
        title="LinkedIn"
        sub={`${state.liSentToday}/${LI_DAILY_CAP} requests today · ${state.liWeek}/${LI_WEEKLY_CAP} this week · ${liWaiting(state)} waiting on you`}
        actions={<Button onClick={() => nav(ROUTES.contactNew)}>Add contact</Button>}
      />

      <Tabs
        tabs={LI_TABS.map((t) => ({
          id: t.id,
          label: t.label,
          count: state.contacts.filter(t.match).length,
        }))}
        active={tab}
        onChange={(id) => {
          setTab(id);
          setOpenId(null);
        }}
      />

      {capped && (
        <div className="mx-[22px] mt-[13px]">
          <Notice>
            That is {LI_DAILY_CAP} connection requests today. Going past this is how accounts get
            restricted — the rest of the queue keeps until tomorrow.
          </Notice>
        </div>
      )}

      <div className="flex-1 min-h-0 flex">
        <div className="w-[320px] shrink-0 bg-surface border-r border-line flex flex-col min-h-0">
          <div className="px-3 py-[9px] border-b border-line2">
            <input
              className={`${inputCls} px-[9px] py-[6px] text-xs`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people"
            />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <ConversationList
              rows={rows}
              openId={openId}
              onOpen={setOpenId}
              emptyNote={search.trim() ? "Nobody matches that search." : EMPTIES[tab]}
            />
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col bg-canvas">
          {open ? (
            <>
              <div className="bg-surface border-b border-line px-[26px] py-3 flex items-center gap-3 shrink-0 flex-wrap">
                <Avatar size={34}>{initials(open)}</Avatar>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-semibold">{fullName(open)}</div>
                  <div className="text-[11.5px] text-muted truncate">
                    {open.title} at {open.company}
                  </div>
                </div>
                <Pill tone={LI_PILL[open.li]}>{LI_LABEL[open.li]}</Pill>
                <div className="flex-1" />
                {url ? (
                  <LinkButton small href={url}>Open profile ↗</LinkButton>
                ) : (
                  <Button small onClick={() => nav(ROUTES.contactEdit(open.id))}>Add profile URL</Button>
                )}
                <Button small onClick={() => nav(ROUTES.contact(open.id))}>Record</Button>
                {funnelAction()}
              </div>

              <ChatThread contact={open} />
              <ChatComposer key={open.id} contact={open} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-10">
              <div className={cx("text-center max-w-[360px]")}>
                <div className="text-[13.5px] font-medium">Pick someone on the left</div>
                <p className="text-[12.5px] text-muted leading-relaxed mt-[6px]">
                  LinkedIn gives us no API, so this is a record you keep rather than a live inbox.
                  Paste in what they send, draft the reply here, copy it back.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
