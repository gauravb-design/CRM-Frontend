import { useNavigate } from "react-router";
import type { Campaign } from "../../data/types";
import { cx, fullName, initials, rel } from "../../lib/format";
import { pct, usd } from "../../lib/paidMetrics";
import { STATUS_PILL } from "../../lib/tokens";
import { ROUTES } from "../../routes";
import { leadsFor } from "../../state/selectors";
import { useCrm } from "../../state/store";
import { Card, Empty } from "../../ui/Feedback";
import { Avatar, Label, Pill } from "../../ui/Pill";

/**
 * The people this campaign actually produced, as contact records rather than a
 * counter. The header compares them against what the platform claims, because
 * that difference is the thing worth acting on.
 */
export function CampaignLeads({ campaign: c }: { campaign: Campaign }) {
  const { state } = useCrm();
  const nav = useNavigate();
  const leads = leadsFor(state, c.id);
  const reported = c.metrics.conversions;
  const landed = reported > 0 ? leads.length / reported : 0;
  const short = reported >= 10 && landed < 0.6;

  return (
    <>
      <div className="flex items-baseline gap-2 mb-[10px] flex-wrap">
        <Label>Leads</Label>
        <span className="n text-[11.5px] text-muted">
          {leads.length} in the CRM
          {reported > 0 && ` · ${reported} reported by ${c.platform}`}
        </span>
        {short && (
          <Pill tone="bg-dangersoft text-danger">{pct(landed, 0)} arrived</Pill>
        )}
        {leads.length > 0 && c.metrics.spend > 0 && (
          <span className="n text-[11.5px] text-muted">
            · {usd(c.metrics.spend / leads.length)} each in practice
          </span>
        )}
      </div>

      <Card className="overflow-hidden">
        {leads.map((l) => (
          <div
            key={l.id}
            onClick={() => nav(ROUTES.contact(l.id))}
            className="flex items-center gap-[10px] px-[14px] py-[11px] border-b border-line2 last:border-0 cursor-pointer hover:bg-hover"
          >
            <Avatar size={28}>{initials(l)}</Avatar>
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-medium">{fullName(l)}</div>
              <div className="text-[11.5px] text-muted truncate">
                {l.title} at {l.company}
              </div>
            </div>
            <span className="text-[11.5px] text-muted truncate max-w-[200px] hidden lg:block">
              {l.email}
            </span>
            <Pill tone={STATUS_PILL[l.status]}>{l.status}</Pill>
            <span className={cx("n text-[11px] text-faint w-[64px] text-right")}>
              {rel(l.createdAt)} ago
            </span>
          </div>
        ))}

        {leads.length === 0 && (
          <Empty>
            {reported > 0
              ? `${c.platform} reports ${reported} conversions but none reached the CRM. Check the form and the tracking tag.`
              : "No leads yet."}
          </Empty>
        )}
      </Card>
    </>
  );
}
