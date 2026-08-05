import { NavLink } from "react-router";
import { LI_DAILY_CAP, MAILBOXES } from "../data/pipeline";
import { cx } from "../lib/format";
import { ROUTES, VISIBLE_NAV } from "../routes";
import { countThreads, liWaiting } from "../state/selectors";
import { useCrm } from "../state/store";
import { Label } from "../ui/Pill";

function Meter({ label, now, cap }: { label: string; now: number; cap: number }) {
  const pct = Math.min(100, (now / cap) * 100);
  return (
    <div className="mb-[11px]">
      <div className="flex items-baseline justify-between">
        <span className="text-[11.5px] text-ink2">{label}</span>
        <span className="n text-[11.5px] text-muted">
          {now} / {cap}
        </span>
      </div>
      <div className="h-[5px] bg-line2 rounded-[3px] overflow-hidden mt-[5px]">
        <div
          className={cx("h-full", pct > 90 ? "bg-amber" : "bg-green")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function Sidebar() {
  const { state } = useCrm();

  const badges = {
    inbox: countThreads(state, "needs_reply", "all"),
    linkedin: liWaiting(state),
    deals: state.deals.length,
    tasks: state.tasks.filter((t) => !t.done && t.at <= Date.now()).length,
  };

  const emailSent = MAILBOXES.reduce((n, m) => n + m.sentToday, 0);
  const emailCap = MAILBOXES.reduce((n, m) => n + m.cap, 0);

  return (
    <div className="w-[218px] shrink-0 bg-surface border-r border-line flex flex-col py-[18px]">
      <div className="px-[18px] pb-4">
        <div className="text-[19px] font-semibold tracking-[-0.02em] leading-none">UIUX Studio</div>
        <Label className="mt-[5px]">Outbound CRM</Label>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto px-[10px]">
        {VISIBLE_NAV.map((it) => {
          const count = it.badge ? badges[it.badge] : 0;
          return (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === ROUTES.dashboard}
            className={({ isActive }) =>
              cx(
                "flex items-center gap-2 px-3 py-2 rounded-[7px] text-[13px] mb-[2px] no-underline",
                isActive ? "bg-greensoft text-green font-medium" : "text-ink2 hover:bg-hover",
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className="flex-1">{it.label}</span>
                {count > 0 && (
                  <span
                    className={cx(
                      "n text-[11px] rounded-[9px] px-[7px] py-px",
                      isActive ? "bg-green text-white" : "bg-stone text-muted",
                    )}
                  >
                    {count}
                  </span>
                )}
              </>
            )}
          </NavLink>
          );
        })}
      </nav>

      <div className="px-[18px] pt-[14px] border-t border-line2 mt-[10px]">
        <Label className="mb-[9px]">Sending today</Label>
        <Meter label="Email" now={emailSent} cap={emailCap} />
        <Meter label="LinkedIn" now={state.liSentToday} cap={LI_DAILY_CAP} />
      </div>
    </div>
  );
}
