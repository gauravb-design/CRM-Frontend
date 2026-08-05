import { useNavigate } from "react-router";
import type { Contact } from "../../data/types";
import { fullName, initials, money, rel } from "../../lib/format";
import { STATUS_PILL } from "../../lib/tokens";
import { ROUTES } from "../../routes";
import { dealFor, sequenceById } from "../../state/selectors";
import { useCrm } from "../../state/store";
import { Button } from "../../ui/Button";
import { Avatar, Label, Pill } from "../../ui/Pill";

const Rule = () => <div className="h-px bg-line2 my-[15px]" />;

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-[10px] mb-[9px]">
      <span className="text-[11.5px] text-faint w-[74px] shrink-0">{k}</span>
      <span className="text-[11.5px] text-ink2 min-w-0 truncate" title={v}>
        {v}
      </span>
    </div>
  );
}

/**
 * The record card, in the position a CRM puts it. This replaced a "why we
 * contacted them" panel, which stopped making sense the moment the thread
 * itself was visible — the signal is already the first line of the opener.
 */
export function ContactPanel({ contact }: { contact: Contact }) {
  const { state, dispatch } = useCrm();
  const nav = useNavigate();
  const deal = dealFor(state, contact.id);
  const seq = sequenceById(state, contact.seqId);

  return (
    <div className="w-[294px] shrink-0 bg-surface border-l border-line overflow-y-auto px-[17px] py-[18px]">
      <div className="flex items-center gap-[11px]">
        <Avatar size={40}>{initials(contact)}</Avatar>
        <div className="min-w-0">
          <div className="text-[13.5px] font-semibold">{fullName(contact)}</div>
          <div className="text-[11.5px] text-muted truncate">{contact.title}</div>
        </div>
      </div>

      <div className="mt-[11px] flex items-center gap-[7px] flex-wrap">
        <Pill tone={STATUS_PILL[contact.status]}>{contact.status}</Pill>
        <span className="text-[11.5px] text-muted">{contact.company}</span>
      </div>

      <Rule />
      <Row k="Email" v={contact.email} />
      <Row k="LinkedIn" v={contact.linkedin} />
      <Row k="Noticed" v={contact.hook} />
      <Row k="Location" v={contact.location} />
      <Row k="Source" v={contact.source} />
      <Row k="Owner" v={contact.owner} />
      <Row k="Added" v={`${rel(contact.createdAt)} ago`} />

      <Rule />
      <Label className="mb-2">Sequence</Label>
      {seq ? (
        <>
          <div className="text-[12.5px]">{seq.name}</div>
          <div className="text-[11.5px] text-muted mt-[3px]">
            Step {contact.seqStep} of {seq.steps.length}
          </div>
        </>
      ) : (
        <div className="text-[11.5px] text-faint">Not enrolled</div>
      )}

      <Rule />
      <Label className="mb-2">Deal</Label>
      {deal ? (
        <>
          <div className="text-[12.5px] font-medium">
            {contact.company} — {money(deal.value)}
          </div>
          <div className="text-[11.5px] text-muted mt-[3px]">{deal.stage}</div>
        </>
      ) : (
        <Button className="w-full" onClick={() => dispatch({ type: "createDeal", cid: contact.id })}>
          Create a deal
        </Button>
      )}

      <Rule />
      <Button className="w-full mb-[7px] text-left" onClick={() => nav(ROUTES.contact(contact.id))}>
        Open full record
      </Button>
      <Button
        className="w-full mb-[7px] text-left"
        onClick={() =>
          dispatch({ type: "liSet", cid: contact.id, li: "messaged", note: "LinkedIn touch logged" })
        }
      >
        Log a LinkedIn touch
      </Button>
    </div>
  );
}
