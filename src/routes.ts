/**
 * The screen map. Read this instead of globbing for views, and add to it when
 * you add a page. Paths live here as functions so no component builds a URL
 * out of string concatenation.
 */
export const ROUTES = {
  dashboard: "/",
  contacts: "/contacts",
  contactNew: "/contacts/new",
  contact: (id: number | string) => `/contacts/${id}`,
  contactEdit: (id: number | string) => `/contacts/${id}/edit`,
  importCsv: "/import",
  inbox: "/inbox",
  linkedin: "/linkedin",
  sequences: "/sequences",
  sequenceNew: "/sequences/new",
  sequence: (id: number | string) => `/sequences/${id}`,
  upwork: "/upwork",
  upworkProfile: (id: number | string) => `/upwork/profiles/${id}`,
  upworkProposals: "/upwork/proposals",
  upworkProposalNew: "/upwork/proposals/new",
  upworkProposal: (id: number | string) => `/upwork/proposals/${id}`,
  deals: "/deals",
  tasks: "/tasks",
} as const;

/**
 * Sidebar order.
 *
 * `hidden` parks a screen without removing it: the route still resolves and
 * the code still builds, it just does not appear in the nav. Everything except
 * Contacts, LinkedIn and Upwork is parked while those three are the focus —
 * flip the flag off to bring one back.
 */
export const NAV: Array<{
  to: string;
  label: string;
  badge?: "inbox" | "linkedin" | "deals" | "tasks";
  hidden?: true;
}> = [
  { to: ROUTES.dashboard, label: "Dashboard", hidden: true },
  { to: ROUTES.contacts, label: "Contacts" },
  { to: ROUTES.deals, label: "Deals", badge: "deals", hidden: true },
  { to: ROUTES.inbox, label: "Inbox", badge: "inbox", hidden: true },
  { to: ROUTES.linkedin, label: "LinkedIn", badge: "linkedin" },
  { to: ROUTES.upwork, label: "Upwork" },
  { to: ROUTES.sequences, label: "Sequences", hidden: true },
  { to: ROUTES.tasks, label: "Tasks", badge: "tasks", hidden: true },
];

/** What the sidebar actually renders. */
export const VISIBLE_NAV = NAV.filter((n) => !n.hidden);

/**
 * Every page and the file that owns it.
 *
 * (index)            redirects to contacts while Dashboard is parked
 * dashboard          views/Dashboard.tsx            [hidden from nav]
 * contacts           views/contacts/ContactsPage.tsx
 * contacts/new       views/contacts/NewContactPage.tsx
 * contacts/:id       views/contacts/ContactPage.tsx
 * contacts/:id/edit  views/contacts/EditContactPage.tsx
 * import             views/import/ImportPage.tsx
 * inbox              views/inbox/InboxPage.tsx            [hidden from nav]
 * linkedin           views/linkedin/LinkedInPage.tsx
 * upwork             views/upwork/ProfilesPage.tsx
 * upwork/profiles/:id  views/upwork/ProfilePage.tsx
 * upwork/proposals   views/upwork/ProposalsPage.tsx
 * upwork/proposals/new  views/upwork/NewProposalPage.tsx
 * upwork/proposals/:id  views/upwork/ProposalPage.tsx
 * sequences          views/sequences/SequencesPage.tsx  [hidden from nav]
 * sequences/new      views/sequences/SequenceBuilderPage.tsx
 * sequences/:id      views/sequences/SequenceBuilderPage.tsx
 * deals              views/Deals.tsx                [hidden from nav]
 * tasks              views/Tasks.tsx                [hidden from nav]
 */
