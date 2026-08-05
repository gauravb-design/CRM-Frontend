# UIUX Studio — Outbound CRM (frontend)

React front end for the cold email + LinkedIn CRM. Built from the design in
`../Signal AI sales-ops platform/Cold Outbound.dc.html`.

**Frontend only.** Every screen runs off an in-memory seed in `src/data/`;
nothing calls an API yet. Reloading the page resets it.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # typecheck + production bundle
npm run smoke     # 45 checks over the reducer, selectors and AI helpers
```

## Screens

| Route | What it is |
| --- | --- |
| `/` | Dashboard — placeholder until there is real data to show |
| `/contacts` | Table with saved views, bulk actions, Apollo import |
| `/inbox` | Threads, conversation, composer, contact panel |
| `/linkedin` | LinkedIn-shaped chat — conversation list, message thread, paste-in/draft-out composer |
| `/sequences` | Steps and delays, with the manual ones flagged |
| `/deals` | Stage board |
| `/tasks` | Overdue / today / upcoming |

The contact record opens as a drawer over any screen via `?record=<id>`, so the
inbox, the table and the task list can all reach it without knowing about each
other.

## Layout

```
src/
  data/        seed data and types — the only place fixtures live
  lib/         format helpers, colour tokens, AI drafting
  state/       reducer, provider, selectors
  ui/          Button, Pill, Tabs, Modal, Card, Toast — everything composes from these
  layout/      Shell, Sidebar, PageHeader
  views/       one folder per screen
  modals/      contact record, Apollo import, add contact
```

## House rules

- **No file over 300 lines.** Split by section before crossing it.
- **Reusable components.** If markup appears twice it becomes a component the
  first time, not the third.
- **Plain hooks only** — `useState`, `useReducer`, `useContext`. No custom hook
  abstractions.
- **Flat data access.** Derived data is small pure functions in
  `state/selectors.ts`; no query layers.

## Two things that are deliberate

**Email logs itself, LinkedIn does not.** Outbound email carries
`from <mailbox> · logged automatically`; a reply carries `matched to this
thread`, which is the `In-Reply-To` header pointing at the `Message-ID` we
kept. LinkedIn has no API, so every state change there is a person pressing a
button, and the UI says so.

**The LinkedIn daily cap refuses rather than warns.** At 20 requests the button
declines and explains why. That is the number that keeps an account
unrestricted, so a soft nudge would be the wrong shape.

## Wiring it to the backend

**[docs/BACKEND.md](docs/BACKEND.md)** has the whole picture: data model,
endpoints per screen, email threading, the LinkedIn manual model, Apollo import
rules, AI notes and the open questions.

Short version: the three reducers are the only places state changes, and each
`case` maps to about one endpoint. `lib/ai.ts` `compose()` is canned copy and
becomes the model call; `shorten()` and `direct()` are real transformations and
stay client-side.
