import type { Contact } from "../../data/types";
import { LI_DAILY_CAP } from "../../data/pipeline";
import { daysSince, shortDate } from "../../lib/format";
import { profileUrl } from "../../lib/linkedin";
import { useCrm } from "../../state/store";
import { Button, LinkButton } from "../../ui/Button";
import { Notice } from "../../ui/Feedback";

/** Withdrawing after this long frees the request against the weekly allowance. */
const STALE_DAYS = 14;

/**
 * What sits where the chat would be, before there is a conversation to have.
 *
 * A composer here would be a lie — LinkedIn refuses messages to people who
 * have not accepted, so anything typed could never be sent. This shows the one
 * action that is actually available at each step instead.
 */
export function PreChat({ contact: c, compact }: { contact: Contact; compact?: boolean }) {
  const { state, dispatch } = useCrm();
  const url = profileUrl(c.linkedin);
  const capped = state.liSentToday >= LI_DAILY_CAP;
  const waiting = daysSince(c.liAt);

  const body = () => {
    if (c.li === "requested") {
      return {
        title: `Waiting on ${c.firstName}`,
        blurb:
          waiting === 0
            ? "The request went out today. Nothing to do until they accept."
            : `Sent ${waiting} ${waiting === 1 ? "day" : "days"} ago. You can message them the moment it is accepted, and not before.`,
        actions: (
          <>
            <Button onClick={() => dispatch({ type: "liSet", cid: c.id, li: "none", note: "Request withdrawn" })}>
              Withdraw
            </Button>
            <Button
              variant="primary"
              onClick={() => dispatch({ type: "liSet", cid: c.id, li: "accepted", note: "Connection accepted" })}
            >
              They accepted
            </Button>
          </>
        ),
        notice:
          waiting >= STALE_DAYS
            ? `Over ${STALE_DAYS} days with no answer. Withdrawing frees it against the weekly allowance.`
            : null,
      };
    }

    if (c.li === "recycled") {
      return {
        title: `${c.firstName} is parked`,
        blurb: c.recycleAt
          ? `Back in the to-send queue on ${shortDate(c.recycleAt)}. Nothing sends before then.`
          : "Parked. Nothing sends until they are brought back.",
        actions: (
          <Button variant="primary" onClick={() => dispatch({ type: "liRestore", cid: c.id })}>
            Bring back now
          </Button>
        ),
        notice: null,
      };
    }

    return {
      title: "Not connected yet",
      blurb:
        "Open their profile, send the connection request in LinkedIn, then mark it here. No note on the request — one gets accepted less often.",
      actions: (
        <>
          {url ? (
            <LinkButton href={url}>Open profile ↗</LinkButton>
          ) : (
            <span className="text-[12px] text-amber">No profile URL on this contact.</span>
          )}
          <Button
            variant="primary"
            disabled={capped || !url}
            onClick={() => dispatch({ type: "liSend", cid: c.id })}
          >
            Mark request sent
          </Button>
        </>
      ),
      notice: capped
        ? `You are at ${LI_DAILY_CAP} requests today. This one keeps until tomorrow.`
        : null,
    };
  };

  const { title, blurb, actions, notice } = body();

  /* Sitting under a read-only history, this is a band rather than a panel —
   * two flex-1 siblings would split the height between them. */
  if (compact) {
    return (
      <div className="border-t border-line bg-surface px-[26px] py-[14px] shrink-0">
        {notice && (
          <div className="mb-[10px]">
            <Notice>{notice}</Notice>
          </div>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="text-[12.5px] font-medium">{title}</div>
            <div className="text-[11.5px] text-muted">{blurb}</div>
          </div>
          <div className="flex-1" />
          {actions}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex items-center justify-center p-10">
      <div className="max-w-[420px] text-center">
        <div className="text-[14px] font-medium">{title}</div>
        <p className="text-[12.5px] text-muted leading-relaxed mt-[7px]">{blurb}</p>

        {notice && (
          <div className="mt-4 text-left">
            <Notice>{notice}</Notice>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">{actions}</div>
      </div>
    </div>
  );
}
