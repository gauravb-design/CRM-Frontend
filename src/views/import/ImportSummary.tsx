import type { Sequence } from "../../data/types";
import type { ImportAnalysis } from "../../lib/apolloImport";
import { Button } from "../../ui/Button";
import { Card, Notice } from "../../ui/Feedback";
import { Field, inputCls } from "../../ui/Field";
import { Label } from "../../ui/Pill";

interface Props {
  analysis: ImportAnalysis;
  sequences: Sequence[];
  seqId: string;
  onSeq: (v: string) => void;
  onReset: () => void;
}

export function ImportSummary({ analysis, sequences, seqId, onSeq, onReset }: Props) {
  const { fileName, total, ready, skipped, missing } = analysis;

  if (missing.length) {
    return (
      <>
        <Notice>
          <strong>{fileName}</strong> is missing {missing.join(", ")}. Re-export from Apollo with
          those columns included — nothing has been imported.
        </Notice>
        <Button className="mt-3" onClick={onReset}>
          Choose another file
        </Button>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-[14px] flex-wrap">
        <span className="text-[13px] font-medium">{fileName}</span>
        <span className="n text-[11.5px] text-muted">{total} rows</span>
        <div className="flex-1" />
        <Button small onClick={onReset}>
          Choose another file
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="px-4 py-[14px]">
          <Label>Ready to import</Label>
          <div className="n text-[24px] mt-1">{ready.length}</div>
          <p className="text-[11.5px] text-muted leading-snug mt-[6px]">
            New to us, with a work email on a company domain.
          </p>
        </Card>

        <Card className="px-4 py-[14px]">
          <Label>Left behind</Label>
          <div className="n text-[24px] mt-1">{total - ready.length}</div>
          {skipped.length === 0 ? (
            <p className="text-[11.5px] text-muted mt-[6px]">Nothing was skipped.</p>
          ) : (
            <div className="mt-[8px]">
              {skipped.map((s) => (
                <div key={s.reason} className="flex justify-between text-[11.5px] mb-[3px]">
                  <span className="text-muted">{s.reason}</span>
                  <span className="n text-ink2">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {ready.length > 0 && (
        <>
          <div className="mt-[14px]">
            <Notice>
              None of these has a hook yet — Apollo has no column for it. Add one on each record
              before the first email goes out; the opener is written from it, and without one the
              email reads like every other generated email.
            </Notice>
          </div>

          <Card className="px-4 py-[14px] mt-[14px]">
            <Label>First five</Label>
            <div className="mt-2">
              {ready.slice(0, 5).map((c) => (
                <div key={c.email} className="flex gap-3 text-[12px] py-[5px] border-b border-line2 last:border-0">
                  <span className="w-[150px] shrink-0 truncate">{c.firstName} {c.lastName}</span>
                  <span className="w-[160px] shrink-0 truncate text-muted">{c.company}</span>
                  <span className="flex-1 min-w-0 truncate text-muted">{c.email}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="mt-[14px] max-w-[300px]">
            <Field label="Enrol in" hint="They can be enrolled later from the contacts table.">
              <select
                className={`${inputCls} chev cursor-pointer`}
                value={seqId}
                onChange={(e) => onSeq(e.target.value)}
              >
                <option value="0">Nothing for now</option>
                {sequences.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </>
      )}
    </>
  );
}
