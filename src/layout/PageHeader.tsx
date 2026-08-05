import type { ReactNode } from "react";

interface Props {
  title: string;
  sub: string;
  actions?: ReactNode;
}

export function PageHeader({ title, sub, actions }: Props) {
  return (
    <div className="bg-surface border-b border-line px-[22px] py-[14px] flex items-center gap-[14px] shrink-0">
      <div className="min-w-0">
        <div className="text-[15.5px] font-semibold tracking-[-0.01em]">{title}</div>
        <div className="text-[11.5px] text-muted mt-[2px]">{sub}</div>
      </div>
      <div className="flex-1" />
      {actions}
    </div>
  );
}
