import { useState } from "react";
import { MAILBOXES } from "../../data/pipeline";
import type { Channel, ThreadState } from "../../data/types";
import { PageHeader } from "../../layout/PageHeader";
import { CHANNEL_PILL } from "../../lib/tokens";
import { INBOX_TABS, contactById, countThreads, threadsFor } from "../../state/selectors";
import { useCrm } from "../../state/store";
import { inputCls } from "../../ui/Field";
import { Pill } from "../../ui/Pill";
import { Tabs } from "../../ui/Tabs";
import { Composer } from "./Composer";
import { ContactPanel } from "./ContactPanel";
import { MessageList } from "./MessageList";
import { ThreadList } from "./ThreadList";

export function InboxPage() {
  const { state } = useCrm();
  const [tab, setTab] = useState<ThreadState>("needs_reply");
  const [channel, setChannel] = useState<"all" | Channel>("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<number | null>(1);

  const threads = threadsFor(state, tab, channel, search);
  const open = threads.find((t) => t.id === openId) ?? null;
  const contact = open ? contactById(state, open.cid) : null;
  const needsReply = countThreads(state, "needs_reply", "all");

  return (
    <>
      <PageHeader
        title="Inbox"
        sub={`${needsReply} waiting on you · replies land here on their own`}
      />

      <Tabs
        tabs={INBOX_TABS.map((t) => ({
          id: t.id,
          label: t.label,
          count: countThreads(state, t.id, channel),
        }))}
        active={tab}
        onChange={(id) => {
          setTab(id as ThreadState);
          setOpenId(null);
        }}
      />

      <div className="flex-1 min-h-0 flex">
        {/* thread list */}
        <div className="w-[336px] shrink-0 bg-surface border-r border-line flex flex-col min-h-0">
          <div className="px-3 py-[9px] border-b border-line2 flex gap-2 items-center">
            <input
              className={`${inputCls} flex-1 px-[9px] py-[6px] text-xs`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search threads"
            />
            <select
              className="chev border border-line rounded-[7px] px-[9px] py-[6px] text-xs cursor-pointer w-[104px]"
              value={channel}
              onChange={(e) => {
                setChannel(e.target.value as "all" | Channel);
                setOpenId(null);
              }}
            >
              <option value="all">All</option>
              <option value="Email">Email</option>
              <option value="LinkedIn">LinkedIn</option>
            </select>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <ThreadList
              threads={threads}
              openId={openId}
              onOpen={setOpenId}
              searching={search.trim().length > 0}
            />
          </div>
        </div>

        {/* conversation */}
        <div className="flex-1 min-w-0 flex flex-col bg-canvas">
          {open && contact ? (
            <>
              <div className="flex-1 min-h-0 overflow-y-auto px-[26px] pt-5 pb-2">
                <div className="text-[16.5px] font-semibold tracking-[-0.01em]">{open.subject}</div>
                <div className="flex items-center gap-2 mt-[6px] flex-wrap">
                  <Pill tone={CHANNEL_PILL[open.channel]}>{open.channel}</Pill>
                  <span className="text-[11.5px] text-muted">
                    {open.channel === "LinkedIn"
                      ? "You send and log this one by hand"
                      : `${contact.email} · ${MAILBOXES[open.mailbox ?? 0].address}`}
                  </span>
                </div>
                <MessageList thread={open} contact={contact} />
              </div>
              <Composer thread={open} contact={contact} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-10">
              <div className="text-center max-w-[330px]">
                <div className="text-[13.5px] font-medium">Nothing open</div>
                <p className="text-[12.5px] text-muted leading-relaxed mt-[6px]">
                  Pick a thread on the left. Email replies land here on their own; LinkedIn
                  messages are the ones you log yourself.
                </p>
              </div>
            </div>
          )}
        </div>

        {contact && <ContactPanel contact={contact} />}
      </div>
    </>
  );
}
