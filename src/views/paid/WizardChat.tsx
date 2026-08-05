import { useEffect, useRef, useState } from "react";
import { cx } from "../../lib/format";
import type { Prompt } from "../../lib/paidChat";
import { Button } from "../../ui/Button";

export interface Turn {
  id: number;
  role: "you" | "ai";
  body: string;
}

/** **bold** only — the replies use it for the campaign type and nothing else. */
function Body({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

interface Props {
  turns: Turn[];
  prompt: Prompt;
  onAnswer: (text: string) => void;
}

export function WizardChat({ turns, prompt, onAnswer }: Props) {
  const [text, setText] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [turns.length, prompt.slot]);

  const send = (value: string) => {
    if (!value.trim()) return;
    onAnswer(value);
    setText("");
  };

  return (
    <div className="w-[460px] shrink-0 border-r border-line bg-surface flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto px-[18px] py-4">
        {turns.map((t) => (
          <div key={t.id} className={cx("mb-[14px] flex", t.role === "you" ? "justify-end" : "justify-start")}>
            <div
              className={cx(
                "max-w-[360px] text-[12.5px] leading-[1.7] whitespace-pre-line rounded-[12px] px-[13px] py-[9px]",
                t.role === "you" ? "bg-greensoft" : "bg-canvas border border-line",
              )}
            >
              <Body text={t.body} />
            </div>
          </div>
        ))}

        {/* The live question sits in the stream rather than only in the input,
            so the thread reads back as a conversation afterwards. */}
        {prompt.slot && (
          <div className="flex justify-start mb-[14px]">
            <div className="max-w-[360px] text-[12.5px] leading-[1.7] bg-canvas border border-line rounded-[12px] px-[13px] py-[9px]">
              <Body text={prompt.ask} />
            </div>
          </div>
        )}
        <div ref={bottom} />
      </div>

      <div className="border-t border-line px-[18px] py-3 shrink-0">
        {prompt.options && (
          <div className="flex flex-wrap gap-[6px] mb-[9px]">
            {prompt.options.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => send(o)}
                className="text-[11.5px] bg-stone text-ink2 rounded-full px-[11px] py-[5px] cursor-pointer hover:bg-line"
              >
                {o}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            className="flex-1 bg-surface border border-line rounded-[7px] px-[10px] py-2 text-[12.5px] disabled:bg-hover"
            value={text}
            disabled={!prompt.slot}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(text)}
            placeholder={prompt.slot ? (prompt.placeholder ?? "Type your answer") : "All done"}
          />
          <Button variant="primary" disabled={!prompt.slot} onClick={() => send(text)}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
