import { useState } from "react";
import { useNavigate } from "react-router";
import { PageHeader } from "../../layout/PageHeader";
import { cx, rel } from "../../lib/format";
import { scoreProfile } from "../../lib/profileScore";
import { ROUTES } from "../../routes";
import { useCrm } from "../../state/store";
import { Card } from "../../ui/Feedback";
import { Confirm } from "../../ui/Modal";
import { Pill, Thumb } from "../../ui/Pill";
import { UpworkTabs } from "./UpworkTabs";
import { Button } from "../../ui/Button";

const TH = "text-left text-[10.5px] text-muted uppercase tracking-[0.06em] font-medium px-[14px] py-[9px] border-b border-line whitespace-nowrap";
const TD = "px-[14px] py-[11px] border-b border-line2 text-[12.5px] align-middle";

const STATUS = {
  Live: "bg-greensoft text-green",
  Draft: "bg-stone text-muted",
  Paused: "bg-ambersoft text-amber",
};

export function ProfilesPage() {
  const { state, dispatch } = useCrm();
  const nav = useNavigate();
  const [deleting, setDeleting] = useState<number | null>(null);

  const target = state.upworkProfiles.find((p) => p.id === deleting);
  const usedBy = target ? state.proposals.filter((p) => p.profileId === target.id).length : 0;

  return (
    <>
      <PageHeader
        title="Upwork"
        sub={`${state.upworkProfiles.length} profiles · a profile is what decides whether a proposal gets read`}
      />
      <UpworkTabs active="profiles" />

      <div className="flex-1 min-h-0 overflow-auto px-[22px] py-[18px]">
        <Card className="overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-hover">
                <th className={TH}>Profile</th>
                <th className={TH}>Rate</th>
                <th className={TH}>Status</th>
                <th className={TH}>Optimisation</th>
                <th className={TH}>Updated</th>
                <th className={TH}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.upworkProfiles.map((p) => {
                const { passed, total } = scoreProfile(p);
                const weak = passed < total - 1;
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-hover cursor-pointer"
                    onClick={() => nav(ROUTES.upworkProfile(p.id))}
                  >
                    <td className={TD}>
                      <div className="flex items-center gap-[10px]">
                        <Thumb seed={p.name} alt="" size={44} />
                        <div className="min-w-0">
                          <div className="font-medium">{p.name}</div>
                          <div className="text-[11.5px] text-muted truncate max-w-[380px]">
                            {p.headline}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={cx(TD, "n")}>${p.rate}/hr</td>
                    <td className={TD}>
                      <Pill tone={STATUS[p.status]}>{p.status}</Pill>
                    </td>
                    <td className={TD}>
                      <div className="flex items-center gap-[9px]">
                        <div className="h-[5px] w-[90px] bg-line2 rounded-[3px] overflow-hidden">
                          <div
                            className={cx("h-full", weak ? "bg-amber" : "bg-green")}
                            style={{ width: `${(passed / total) * 100}%` }}
                          />
                        </div>
                        <span className="n text-[11.5px] text-muted">
                          {passed}/{total}
                        </span>
                      </div>
                    </td>
                    <td className={cx(TD, "n text-xs text-muted")}>{rel(p.updatedAt)} ago</td>
                    {/* Edit goes to the same place as clicking the row — the
                        detail view is the editor. stopPropagation matters here:
                        without it Delete would navigate away before the confirm
                        could open. */}
                    <td className={cx(TD, "text-right")} onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-[6px]">
                        <Button small onClick={() => nav(ROUTES.upworkProfile(p.id))}>
                          Edit
                        </Button>
                        <Button small onClick={() => setDeleting(p.id)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>

      {target && (
        <Confirm
          title={`Delete ${target.name}?`}
          body={
            usedBy > 0
              ? `${usedBy} ${usedBy === 1 ? "proposal was" : "proposals were"} sent from this profile, and they record which one won the work. Move them to another profile before deleting it.`
              : "This removes the profile and its optimisation chat. It cannot be undone."
          }
          /* Offering "Delete" when the reducer will refuse is a dead-end
             click, so a blocked profile gets the useful next step instead. */
          confirmLabel={usedBy > 0 ? "See proposals" : "Delete"}
          danger={usedBy === 0}
          onConfirm={() =>
            usedBy > 0
              ? nav(ROUTES.upworkProposals)
              : dispatch({ type: "deleteProfile", id: target.id })
          }
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
