import { PageHeader } from "../layout/PageHeader";

export function Dashboard() {
  return (
    <>
      <PageHeader title="Dashboard" sub="Nothing here yet" />
      <div className="flex-1 min-h-0 flex items-center justify-center p-10">
        <div className="text-center max-w-[400px]">
          <div className="text-sm font-medium">Dashboard</div>
          <p className="text-[12.5px] text-muted leading-[1.7] mt-[7px]">
            Placeholder for now. Once the inbox and the pipeline have run for a few weeks there
            will be something real to put here — reply rate by mailbox, meetings booked, and where
            deals stall.
          </p>
        </div>
      </div>
    </>
  );
}
