import { useRef, useState } from "react";
import { cx } from "../../lib/format";
import { Card } from "../../ui/Feedback";

const EXPECTED = [
  "First Name", "Last Name", "Title", "Company", "Email", "Person Linkedin Url", "City", "Country",
];

export function ImportDropzone({ busy, onFile }: { busy: boolean; onFile: (f: File) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const take = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  return (
    <>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          take(e.dataTransfer.files);
        }}
        onClick={() => input.current?.click()}
        className={cx(
          "border border-dashed rounded-xl px-6 py-14 text-center cursor-pointer transition-colors",
          over ? "border-green bg-greensoft" : "border-[#dfdcd5] bg-surface hover:border-[#c9c5bc]",
        )}
      >
        <div className="text-[13.5px] font-medium">
          {busy ? "Reading the file…" : "Drop the Apollo export here"}
        </div>
        <p className="text-[12.5px] text-muted mt-[6px]">or click to choose a .csv file</p>
        <input
          ref={input}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => take(e.target.files)}
        />
      </div>

      <Card className="px-4 py-[14px] mt-[14px]">
        <div className="text-[12.5px] font-medium">What the file needs</div>
        <p className="text-xs text-muted leading-relaxed mt-[6px]">
          Columns are matched by name, so the order does not matter and extra columns are ignored.
          <span className="text-ink2"> First Name</span>,
          <span className="text-ink2"> Email</span> and
          <span className="text-ink2"> Company</span> are required — without them there is nothing
          to send or nobody to send it to.
        </p>
        <div className="flex flex-wrap gap-[6px] mt-[10px]">
          {EXPECTED.map((h) => (
            <span key={h} className="text-[11px] bg-stone text-muted rounded-[5px] px-[8px] py-[2px]">
              {h}
            </span>
          ))}
        </div>
      </Card>
    </>
  );
}
