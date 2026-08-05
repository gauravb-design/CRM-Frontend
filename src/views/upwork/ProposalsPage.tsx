import { useNavigate } from "react-router";
import { PageHeader } from "../../layout/PageHeader";
import { cx, fullName, rel } from "../../lib/format";
import { ROUTES } from "../../routes";
import { contactById, profileById } from "../../state/selectors";
import { useCrm } from "../../state/store";
import { Button } from "../../ui/Button";
import { Card, Empty } from "../../ui/Feedback";
import { Pill } from "../../ui/Pill";
import { UpworkTabs } from "./UpworkTabs";

const TONE: Record<string, string> = {
  Draft: "bg-stone text-muted",
  Sent: "bg-bluesoft text-blue",
  Replied: "bg-greensoft text-green",
  Interview: "bg-green text-white",
  Hired: "bg-green text-white",
  Declined: "bg-dangersoft text-danger",
};

export function ProposalsPage() {
  const { state } = useCrm();
  const nav = useNavigate();

  const connects = state.proposals
    .filter((p) => p.state !== "Draft")
    .reduce((n, p) => n + p.connects, 0);

  return (
    <>
      <PageHeader
        title="Upwork"
        sub={`${state.proposals.length} proposals · ${connects} connects spent`}
        actions={
          <Button variant="primary" onClick={() => nav(ROUTES.upworkProposalNew)}>
            New proposal
          </Button>
        }
      />
      <UpworkTabs active="proposals" />

      <div className="flex-1 min-h-0 overflow-y-auto px-[22px] py-[18px]">
        <div className="">
          {state.proposals.length === 0 && (
            <Empty dashed>No proposals yet. Writing one creates the client it is addressed to.</Empty>
          )}

          {state.proposals.map((p) => {
            const client = contactById(state, p.cid);
            const profile = profileById(state, p.profileId);
            return (
              <Card
                key={p.id}
                className="px-[18px] py-4 mb-3 cursor-pointer hover:border-[#c9c5bc]"
                onClick={() => nav(ROUTES.upworkProposal(p.id))}
              >
                <div className="flex items-center gap-[10px] flex-wrap">
                  <span className="text-[13.5px] font-semibold">{p.jobTitle}</span>
                  <Pill tone={TONE[p.state]}>{p.state}</Pill>
                  <div className="flex-1" />
                  <span className="n text-[11.5px] text-muted">{rel(p.at)} ago</span>
                </div>

                <div className="text-[11.5px] text-muted mt-[5px]">
                  {client ? `${fullName(client)} · ${client.company}` : "No client"}
                  {profile ? ` · sent from ${profile.name}` : ""} · {p.budget}
                </div>

                <p
                  className={cx(
                    "text-xs leading-relaxed mt-[9px] line-clamp-2",
                    p.body ? "text-ink2" : "text-faint italic",
                  )}
                >
                  {p.body || "Not written yet."}
                </p>
              </Card>
            );
          })}

          <div className="text-[11.5px] text-muted mt-4 leading-relaxed">
            Every state here is set by hand. Upwork gives us no API, so a proposal only moves when
            someone moves it — the same rule as LinkedIn.
          </div>
        </div>
      </div>
    </>
  );
}
