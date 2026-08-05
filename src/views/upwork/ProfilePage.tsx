import { useNavigate, useParams } from "react-router";
import { PageHeader } from "../../layout/PageHeader";
import { scoreProfile } from "../../lib/profileScore";
import { ROUTES } from "../../routes";
import { profileById } from "../../state/selectors";
import { useCrm } from "../../state/store";
import { Button } from "../../ui/Button";
import { ProfileChat } from "./ProfileChat";
import { ProfileFields } from "./ProfileFields";

export function ProfilePage() {
  const { state } = useCrm();
  const nav = useNavigate();
  const { id } = useParams();
  const profile = profileById(state, Number(id));

  if (!profile) {
    return (
      <>
        <PageHeader title="Profile not found" sub="It may have been removed" />
        <div className="p-6">
          <Button onClick={() => nav(ROUTES.upwork)}>Back to profiles</Button>
        </div>
      </>
    );
  }

  const { passed, total } = scoreProfile(profile);

  return (
    <>
      <PageHeader
        title={profile.name}
        sub={`${passed} of ${total} checks pass · $${profile.rate}/hr · ${profile.status}`}
        actions={<Button onClick={() => nav(ROUTES.upwork)}>Back</Button>}
      />

      <div className="flex-1 min-h-0 flex">
        <ProfileChat profile={profile} />
        <ProfileFields profile={profile} />
      </div>
    </>
  );
}
