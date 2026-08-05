import type { Contact, Deal, Sequence, Task } from "../../data/types";
import { daysSince, money, rel } from "../../lib/format";
import { Notice } from "../../ui/Feedback";
import { Label } from "../../ui/Pill";

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-[10px] mb-[10px]">
      <span className="text-[11.5px] text-faint w-[76px] shrink-0">{k}</span>
      <span className="text-[11.5px] text-ink2 min-w-0">{v}</span>
    </div>
  );
}

const Rule = () => <div className="h-px bg-line2 my-[15px]" />;

interface Props {
  contact: Contact;
  deal: Deal | null;
  sequence: Sequence | null;
  tasks: Task[];
}

export function ContactFacts({ contact: c, deal, sequence, tasks }: Props) {
  return (
    <div className="w-[286px] shrink-0 border-r border-line bg-surface overflow-y-auto p-[17px]">
      <Label className="mb-[10px]">Properties</Label>
      <Fact k="Email" v={c.email} />
      <Fact k="LinkedIn" v={c.linkedin} />
      <Fact k="Company" v={c.company} />
      <Fact k="Location" v={c.location} />
      <Fact k="Source" v={c.source} />
      <Fact k="Owner" v={c.owner} />
      <Fact k="Sequence" v={sequence ? `${sequence.name} · step ${c.seqStep}` : "Not enrolled"} />
      <Fact k="Added" v={`${rel(c.createdAt)} ago`} />

      <Rule />
      <Label className="mb-[9px]">What we noticed</Label>
      {c.hook ? (
        <p className="text-[11.5px] text-ink2 leading-relaxed">{c.hook}</p>
      ) : (
        <Notice>
          Nothing noted yet. The opener is written from this, so add one before the first email
          goes out.
        </Notice>
      )}

      <Rule />
      <Label className="mb-[9px]">Deal</Label>
      {deal ? (
        <>
          <div className="text-[12.5px] font-medium">
            {c.company} — {money(deal.value)}
          </div>
          <div className="text-[11.5px] text-muted mt-[3px]">
            {deal.stage} · {Math.max(1, daysSince(deal.at))}d in stage
          </div>
        </>
      ) : (
        <div className="text-[11.5px] text-faint">No deal yet.</div>
      )}

      <Rule />
      <Label className="mb-[9px]">Open tasks</Label>
      {tasks.length ? (
        tasks.map((t) => (
          <div key={t.id} className="text-[11.5px] text-ink2 mb-[7px] leading-snug">
            {t.type}
            <span className="text-faint"> · {t.at <= Date.now() ? "due now" : "upcoming"}</span>
          </div>
        ))
      ) : (
        <div className="text-[11.5px] text-faint">None open.</div>
      )}
    </div>
  );
}
