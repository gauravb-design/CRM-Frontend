import type { Thread } from "../../data/types";
import { cx, firstLine, fullName, initials, rel } from "../../lib/format";
import { CHANNEL_PILL } from "../../lib/tokens";
import { contactById } from "../../state/selectors";
import { useCrm } from "../../state/store";
import { Empty } from "../../ui/Feedback";
import { Avatar, Pill } from "../../ui/Pill";

interface Props {
  threads: Thread[];
  openId: number | null;
  onOpen: (id: number) => void;
  searching: boolean;
}

export function ThreadList({ threads, openId, onOpen, searching }: Props) {
  const { state } = useCrm();

  if (threads.length === 0) {
    return <Empty>{searching ? "Nothing matches that search." : "Nothing in here right now."}</Empty>;
  }

  return (
    <>
      {threads.map((t) => {
        const c = contactById(state, t.cid);
        if (!c) return null;
        const last = t.msgs[t.msgs.length - 1];
        const unread = t.state === "needs_reply";
        const on = openId === t.id;

        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onOpen(t.id)}
            className={cx(
              "w-full text-left px-[14px] py-[11px] border-b border-line2 cursor-pointer block",
              on ? "bg-selected" : "bg-surface hover:bg-hover",
            )}
          >
            <div className="flex items-center gap-[9px]">
              <span
                className={cx("w-[6px] h-[6px] rounded-full shrink-0", unread ? "bg-green" : "bg-transparent")}
              />
              <Avatar size={24}>{initials(c)}</Avatar>
              <span
                className={cx(
                  "text-xs flex-1 min-w-0 truncate",
                  unread ? "font-semibold" : "font-medium",
                )}
              >
                {fullName(c)} · {c.company}
              </span>
              <Pill tone={CHANNEL_PILL[t.channel]}>{t.channel}</Pill>
              <span className="n text-[10.5px] text-faint shrink-0">
                {last ? rel(last.at) : "Draft"}
              </span>
            </div>
            <div
              className={cx(
                "text-xs mt-[5px] truncate text-ink2",
                unread ? "font-medium" : "font-normal",
              )}
            >
              {t.subject}
            </div>
            <div className="text-[11.5px] text-faint mt-[2px] truncate">
              {last ? firstLine(last.body) : "Not sent yet"}
            </div>
          </button>
        );
      })}
    </>
  );
}
