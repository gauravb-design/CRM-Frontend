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
  deals: "/deals",
  tasks: "/tasks",
} as const;

/** Sidebar order. Anything not listed here is reachable but not in the nav. */
export const NAV: Array<{ to: string; label: string; badge?: "inbox" | "linkedin" | "deals" | "tasks" }> = [
  { to: ROUTES.dashboard, label: "Dashboard" },
  { to: ROUTES.contacts, label: "Contacts" },
  { to: ROUTES.deals, label: "Deals", badge: "deals" },
  { to: ROUTES.inbox, label: "Inbox", badge: "inbox" },
  { to: ROUTES.linkedin, label: "LinkedIn", badge: "linkedin" },
  { to: ROUTES.sequences, label: "Sequences" },
  { to: ROUTES.tasks, label: "Tasks", badge: "tasks" },
];

/**
 * Every page and the file that owns it.
 *
 * dashboard          views/Dashboard.tsx
 * contacts           views/contacts/ContactsPage.tsx
 * contacts/new       views/contacts/NewContactPage.tsx
 * contacts/:id       views/contacts/ContactPage.tsx
 * contacts/:id/edit  views/contacts/EditContactPage.tsx
 * import             views/import/ImportPage.tsx
 * inbox              views/inbox/InboxPage.tsx
 * linkedin           views/linkedin/LinkedInPage.tsx
 * sequences          views/sequences/SequencesPage.tsx
 * sequences/new      views/sequences/SequenceBuilderPage.tsx
 * sequences/:id      views/sequences/SequenceBuilderPage.tsx
 * deals              views/Deals.tsx
 * tasks              views/Tasks.tsx
 */
