import { DAY, NOW } from "../data/contacts";
import type { Task } from "../data/types";
import { useNavigate } from "react-router";
import { PageHeader } from "../layout/PageHeader";
import { ROUTES } from "../routes";
import { cx, fullName } from "../lib/format";
import { contactById } from "../state/selectors";
import { useCrm } from "../state/store";
import { Button } from "../ui/Button";
import { Card } from "../ui/Feedback";

const GROUPS: Array<{ label: string; tone: string; match: (t: Task) => boolean }> = [
  { label: "Overdue", tone: "text-danger", match: (t) => t.at < NOW - DAY },
  { label: "Today", tone: "text-ink", match: (t) => t.at >= NOW - DAY && t.at <= NOW + DAY },
  { label: "Upcoming", tone: "text-muted", match: (t) => t.at > NOW + DAY },
];

function Icon({ type }: { type: Task["type"] }) {
  const li = type.startsWith("LinkedIn");
  return (
    <span
      className={cx(
        "w-7 h-7 rounded-[7px] text-[10.5px] font-semibold flex items-center justify-center shrink-0",
        li ? "bg-bluesoft text-blue" : "bg-stone text-muted",
      )}
    >
      {li ? "in" : type === "Call" ? "☎" : "↩"}
    </span>
  );
}

export function Tasks() {
  const { state, dispatch } = useCrm();
  const nav = useNavigate();
  const due = state.tasks.filter((t) => !t.done && t.at <= NOW).length;

  return (
    <>
      <PageHeader
        title="Tasks"
        sub={`${due} due now`}
        actions={
          <Button onClick={() => dispatch({ type: "toast", text: "Task added to today." })}>
            Add task
          </Button>
        }
      />

      <div className="flex-1 min-h-0 overflow-y-auto px-[22px] py-[18px]">
        <div className="max-w-[760px]">
          {GROUPS.map((g) => {
            const rows = state.tasks.filter((t) => !t.done).filter(g.match);
            return (
              <div key={g.label} className="mb-[22px]">
                <div className="flex items-baseline gap-2 mb-[9px]">
                  <span className={cx("text-[12.5px] font-medium", g.tone)}>{g.label}</span>
                  <span className="n text-[11px] text-muted bg-line2 rounded-[9px] px-[7px] py-px">
                    {rows.length}
                  </span>
                </div>

                {rows.map((t) => {
                  const c = contactById(state, t.cid);
                  if (!c) return null;
                  return (
                    <Card key={t.id} className="px-[15px] py-3 mb-2 flex items-center gap-3">
                      <Icon type={t.type} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] font-medium">
                          {t.type} — {fullName(c)}
                        </div>
                        <div className="text-[11.5px] text-muted mt-[2px]">
                          {c.company} · {c.title} · {c.owner}
                        </div>
                      </div>
                      <Button onClick={() => nav(ROUTES.contact(c.id))}>Open</Button>
                      <Button
                        variant="primary"
                        onClick={() => dispatch({ type: "completeTask", id: t.id })}
                      >
                        Done
                      </Button>
                    </Card>
                  );
                })}

                {rows.length === 0 && (
                  <div className="text-xs text-faint px-[2px] py-1">Nothing here.</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
