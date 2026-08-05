import type { Contact } from "../../data/types";
import { cx, fullName, initials, rel } from "../../lib/format";
import { STATUS_PILL } from "../../lib/tokens";
import { sequenceById } from "../../state/selectors";
import { useCrm } from "../../state/store";
import { Avatar, Pill } from "../../ui/Pill";

interface Props {
  rows: Contact[];
  selected: number[];
  onToggle: (id: number) => void;
  onToggleAll: () => void;
  onOpen: (id: number) => void;
}

const TH = "text-left text-[10.5px] text-muted uppercase tracking-[0.06em] font-medium px-[14px] py-[9px] border-b border-line whitespace-nowrap";
const TD = "px-[14px] py-[11px] border-b border-line2 text-[12.5px] align-middle";

function Box({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <span
      role="checkbox"
      aria-checked={on}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === " " && onClick()}
      className={cx(
        "w-[15px] h-[15px] rounded-[4px] inline-flex items-center justify-center cursor-pointer text-[10px] border",
        on ? "bg-green border-green text-white" : "bg-surface border-[#d6d2ca] text-transparent",
      )}
    >
      ✓
    </span>
  );
}

export function ContactsTable({ rows, selected, onToggle, onToggleAll, onOpen }: Props) {
  const { state } = useCrm();
  const allOn = rows.length > 0 && rows.every((c) => selected.includes(c.id));

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-hover">
          <th className={cx(TH, "w-[38px] pr-0")}>
            <Box on={allOn} onClick={onToggleAll} />
          </th>
          <th className={TH}>Name</th>
          <th className={TH}>Company</th>
          <th className={TH}>Status</th>
          <th className={TH}>Sequence</th>
          <th className={TH}>Last activity</th>
          <th className={TH}>Owner</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((c) => {
          const seq = sequenceById(state, c.seqId);
          const on = selected.includes(c.id);
          return (
            <tr key={c.id} className={cx("hover:bg-hover", on && "bg-[#f6f8f7]")}>
              <td className={cx(TD, "pr-0")}>
                <Box on={on} onClick={() => onToggle(c.id)} />
              </td>
              <td className={cx(TD, "cursor-pointer")} onClick={() => onOpen(c.id)}>
                <div className="flex items-center gap-[9px]">
                  <Avatar size={28}>{initials(c)}</Avatar>
                  <div className="min-w-0">
                    <div className="font-medium">{fullName(c)}</div>
                    <div className="text-[11.5px] text-muted">{c.title}</div>
                  </div>
                </div>
              </td>
              <td className={cx(TD, "cursor-pointer")} onClick={() => onOpen(c.id)}>
                <div>{c.company}</div>
                <div className="text-[11.5px] text-muted">{c.email}</div>
              </td>
              <td className={TD}>
                <Pill tone={STATUS_PILL[c.status]}>{c.status}</Pill>
              </td>
              <td className={cx(TD, "text-xs text-ink2")}>
                {seq ? `${seq.name} · ${c.seqStep}/${seq.steps.length}` : "—"}
              </td>
              <td className={cx(TD, "n text-xs text-muted")}>{rel(c.lastAt)} ago</td>
              <td className={cx(TD, "text-xs text-ink2")}>{c.owner}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
