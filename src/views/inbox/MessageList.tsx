import { MAILBOXES } from "../../data/pipeline";
import type { Contact, Thread } from "../../data/types";
import { cx, firstLine, fullName, initials, rel } from "../../lib/format";
import { useCrm } from "../../state/store";
import { Avatar } from "../../ui/Pill";

/**
 * The conversation, the way a mail client shows it: what we sent, oldest
 * first, and their reply underneath. The meta line on each message is where
 * the plumbing shows — outbound carries the mailbox it left from, inbound
 * carries the mailbox it arrived at and the fact that it was matched to this
 * thread by its In-Reply-To header. That match is what "logs itself" means.
 */
export function MessageList({ thread, contact }: { thread: Thread; contact: Contact }) {
  const { state, dispatch } = useCrm();
  const box = thread.mailbox === null ? null : MAILBOXES[thread.mailbox].address;
  const isLi = thread.channel === "LinkedIn";

  return (
    <div className="mt-4">
      {thread.msgs.map((m, i) => {
        const key = `${thread.id}:${i}`;
        const last = i === thread.msgs.length - 1;
        const open = state.openMsgs[key] ?? last;
        const inbound = m.dir === "in";

        const meta = isLi
          ? inbound
            ? `received on LinkedIn · logged by ${contact.owner}`
            : "sent on LinkedIn · logged by hand"
          : inbound
            ? `to ${box} · matched to this thread`
            : `from ${box} · logged automatically`;

        return (
          <div
            key={key}
            className={cx(
              "bg-surface border border-line rounded-[10px] mb-2",
              inbound && "border-l-[3px] border-l-green",
            )}
          >
            <button
              type="button"
              onClick={() => dispatch({ type: "toggleMsg", key, fallback: last })}
              className="w-full flex items-center gap-[10px] cursor-pointer px-[15px] py-3 text-left"
            >
              <Avatar size={30} muted={!inbound}>
                {inbound ? initials(contact) : "ME"}
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-medium">
                  {inbound ? fullName(contact) : "You"}
                </div>
                <div className="text-[11px] text-muted truncate">{meta}</div>
              </div>
              <span className="n text-[11px] text-faint shrink-0">{rel(m.at)}</span>
            </button>

            {open ? (
              <div className="text-[13px] leading-[1.75] whitespace-pre-line px-[15px] pb-[15px] pl-14">
                {m.body}
              </div>
            ) : (
              <div className="text-xs text-muted px-[15px] pb-3 pl-14 truncate">
                {firstLine(m.body)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
