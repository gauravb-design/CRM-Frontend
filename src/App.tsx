import { Route, Routes } from "react-router";
import { Shell } from "./layout/Shell";
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

/** Paths come from src/routes.ts — that file is the map, this one is the wiring. */
export function App() {
  return (
    <CrmProvider>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Dashboard />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="contacts/new" element={<NewContactPage />} />
          <Route path="contacts/:id" element={<ContactPage />} />
          <Route path="contacts/:id/edit" element={<EditContactPage />} />
          <Route path="import" element={<ImportPage />} />
          <Route path="inbox" element={<InboxPage />} />
          <Route path="linkedin" element={<LinkedInPage />} />
          <Route path="sequences" element={<SequencesPage />} />
          <Route path="sequences/new" element={<SequenceBuilderPage />} />
          <Route path="sequences/:id" element={<SequenceBuilderPage />} />
          <Route path="deals" element={<Deals />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </CrmProvider>
  );
}
