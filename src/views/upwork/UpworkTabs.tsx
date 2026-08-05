import { useNavigate } from "react-router";
import { ROUTES } from "../../routes";
import { useCrm } from "../../state/store";
import { Tabs } from "../../ui/Tabs";

/** The two halves of Upwork: the profile that gets you read, and the proposals. */
export function UpworkTabs({ active }: { active: "profiles" | "proposals" }) {
  const { state } = useCrm();
  const nav = useNavigate();

  return (
    <Tabs
      tabs={[
        { id: "profiles", label: "Profiles", count: state.upworkProfiles.length },
        { id: "proposals", label: "Proposals", count: state.proposals.length },
      ]}
      active={active}
      onChange={(id) => nav(id === "profiles" ? ROUTES.upwork : ROUTES.upworkProposals)}
    />
  );
}
