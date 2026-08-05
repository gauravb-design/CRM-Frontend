import type { Contact } from "../../data/types";
import { cx, firstLine, fullName, initials, rel } from "../../lib/format";
import { LI_LABEL, LI_PILL } from "../../lib/tokens";
import { liThreadFor } from "../../state/selectors";
import { useCrm } from "../../state/store";
import { Empty } from "../../ui/Feedback";
import { Avatar, Pill } from "../../ui/Pill";

interface Props {
  rows: Contact[];
  openId: number | null;
  onOpen: (id: number) => void;
  emptyNote: string;
}

export function ConversationList({ rows, openId, onOpen, emptyNote }: Props) {
  const { state } = useCrm();

  if (rows.length === 0) return <Empty>{emptyNote}</Empty>;

  return (
    <>
      {rows.map((c) => {
        const thread = liThreadFor(state, c.id);
        const last = thread?.msgs[thread.msgs.length - 1];
        const theirTurn = last?.dir === "in";
        const on = openId === c.id;

        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onOpen(c.id)}
            className={cx(
              "w-full text-left px-[14px] py-[11px] border-b border-line2 cursor-pointer block",
              on ? "bg-selected" : "bg-surface hover:bg-hover",
            )}
          >
            <div className="flex items-center gap-[9px]">
              <span
                className={cx("w-[6px] h-[6px] rounded-full shrink-0", theirTurn ? "bg-green" : "bg-transparent")}
              />
              <Avatar size={28}>{initials(c)}</Avatar>
              <div className="min-w-0 flex-1">
                <div className={cx("text-[12.5px] truncate", theirTurn ? "font-semibold" : "font-medium")}>
                  {fullName(c)}
                </div>
                <div className="text-[11px] text-muted truncate">{c.company}</div>
              </div>
              {last && <span className="n text-[10.5px] text-faint shrink-0">{rel(last.at)}</span>}
            </div>

            <div className="mt-[6px] flex items-center gap-[6px]">
              <Pill tone={LI_PILL[c.li]}>{LI_LABEL[c.li]}</Pill>
              {last && (
                <span className="text-[11.5px] text-muted truncate min-w-0">
                  {last.dir === "out" ? "You: " : ""}
                  {firstLine(last.body)}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </>
  );
}
