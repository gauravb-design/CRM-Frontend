import { Navigate, Route, Routes } from "react-router";
import { Shell } from "./layout/Shell";
import { ROUTES } from "./routes";
import { CrmProvider } from "./state/store";
import { Dashboard } from "./views/Dashboard";
import { Deals } from "./views/Deals";
import { Tasks } from "./views/Tasks";
import { ContactPage } from "./views/contacts/ContactPage";
import { ContactsPage } from "./views/contacts/ContactsPage";
import { EditContactPage } from "./views/contacts/EditContactPage";
import { NewContactPage } from "./views/contacts/NewContactPage";
import { ImportPage } from "./views/import/ImportPage";
import { InboxPage } from "./views/inbox/InboxPage";
import { LinkedInPage } from "./views/linkedin/LinkedInPage";
import { SequenceBuilderPage } from "./views/sequences/SequenceBuilderPage";
import { SequencesPage } from "./views/sequences/SequencesPage";
import { CampaignPage } from "./views/paid/CampaignPage";
import { CampaignsPage } from "./views/paid/CampaignsPage";
import { WizardPage } from "./views/paid/WizardPage";
import { NewProposalPage } from "./views/upwork/NewProposalPage";
import { ProfilePage } from "./views/upwork/ProfilePage";
import { ProfilesPage } from "./views/upwork/ProfilesPage";
import { ProposalPage } from "./views/upwork/ProposalPage";
import { ProposalsPage } from "./views/upwork/ProposalsPage";

/** Paths come from src/routes.ts — that file is the map, this one is the wiring. */
export function App() {
  return (
    <CrmProvider>
      <Routes>
        <Route element={<Shell />}>
          {/* Dashboard is parked, so the app opens on the first visible
              screen rather than a page with no nav entry. The route still
              resolves at /dashboard for anyone who wants it. */}
          <Route index element={<Navigate to={ROUTES.contacts} replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="contacts/new" element={<NewContactPage />} />
          <Route path="contacts/:id" element={<ContactPage />} />
          <Route path="contacts/:id/edit" element={<EditContactPage />} />
          <Route path="import" element={<ImportPage />} />
          <Route path="inbox" element={<InboxPage />} />
          <Route path="linkedin" element={<LinkedInPage />} />
          <Route path="upwork" element={<ProfilesPage />} />
          <Route path="upwork/profiles/:id" element={<ProfilePage />} />
          <Route path="upwork/proposals" element={<ProposalsPage />} />
          <Route path="upwork/proposals/new" element={<NewProposalPage />} />
          <Route path="upwork/proposals/:id" element={<ProposalPage />} />
          <Route path="paid" element={<CampaignsPage />} />
          <Route path="paid/new" element={<WizardPage />} />
          <Route path="paid/:id" element={<CampaignPage />} />
          <Route path="sequences" element={<SequencesPage />} />
          <Route path="sequences/new" element={<SequenceBuilderPage />} />
          <Route path="sequences/:id" element={<SequenceBuilderPage />} />
          <Route path="deals" element={<Deals />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="*" element={<Navigate to={ROUTES.contacts} replace />} />
        </Route>
      </Routes>
    </CrmProvider>
  );
}
