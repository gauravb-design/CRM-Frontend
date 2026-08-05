# Backend notes — Outbound CRM

Everything the frontend assumes, so none of it has to be rediscovered when the
API gets built. The frontend today runs entirely off an in-memory seed
(`src/data/`); a reload resets it. **`src/state/reducer.ts`,
`src/state/linkedinReducer.ts` and `src/state/sequenceReducer.ts` are the only
places state changes** — each `case` maps to roughly one endpoint.

---

## 1. The one idea the whole product rests on

**Email logs itself. LinkedIn cannot.**

| | Email | LinkedIn |
| --- | --- | --- |
| Sending | We send it | The rep sends it, in LinkedIn |
| Inbound | Arrives at our mailbox | Rep copies and pastes it in |
| Threading | `In-Reply-To` header | Contact id, because there is nothing else |
| Truth of the record | Automatic | Only as good as the rep marking it off |

Every UI decision follows from that row. The LinkedIn screen says so on the
page, deliberately — a rep who thinks it is syncing will stop logging.

---

## 2. Data model

TypeScript source of truth: `src/data/types.ts`. Field names below match it.

### Contact
`id, firstName, lastName, title, company, location, email, linkedin, hook,
status, owner, source, seqId, seqStep, createdAt, lastAt, li, liAt, recycleAt`

- `status`: `New | Contacted | Replied | Interested | Unqualified | Unsubscribed | Bounced`
- `li`: `none | requested | accepted | messaged | conversation | recycled`
- `hook` — one concrete observation about their site. **Load-bearing**: every
  opener and every AI draft is written from it. Apollo has no column for it, so
  imported contacts arrive with it empty and the UI flags them.
- `linkedin` is stored as typed (`linkedin.com/in/x`, no scheme). Normalise on
  read with `lib/linkedin.ts#profileUrl`, never in the database.
- `recycleAt` — when a parked contact re-enters the to-send queue (90 days).

**Uniqueness:** `email`, lowercased. That is the dedupe key on import.

### Thread + Message
`Thread: id, cid, channel, state, subject, mailbox, msgs[]`
`Message: dir ('in'|'out'), at, body`

- `channel`: `Email | LinkedIn`. A LinkedIn conversation is an ordinary thread
  with `mailbox: null`, so it appears in the unified inbox with no special
  casing.
- `state`: `needs_reply | awaiting | queued | done | bounced` — drives the inbox tabs.
- **Server must add per message:** `messageId`, `inReplyTo`, `providerId`,
  `direction`, `deliveredAt`, `openedAt?`. The frontend does not model these yet.

### Deal
`id, cid, value, stage, at` — `at` is when it entered the current stage, for
the staleness counter. Stages: `New | Meeting booked | Proposal sent |
Negotiation | Won | Lost`. One deal per contact is enforced in the reducer.

### Sequence + SequenceStep
`Sequence: id, name, note, active, steps[]`
`SequenceStep: channel, title, delayDays, body`

`manual` is **derived**, not stored — `isManual(step) === step.channel === "LinkedIn"`.
A stored flag could disagree with the channel.

### Also
`Task (id, cid, type, at, done)`, `Note (id, cid, body, at, author)`,
`LiLogEntry (id, cid, text, at)`, `Mailbox (address, sentToday, cap)`.

---

## 3. Email

### Sending
Per-mailbox SMTP or provider API (Postmark / SendGrid / Google Workspace).
Four sending domains are seeded, **none of them the company's real domain** — a
bounce on a cold-sending domain must never touch the address clients reply to.

Keep the returned `Message-ID` against the message row. Everything downstream
depends on it.

### Receiving — the part that makes "logs itself" true
Either IMAP poll per mailbox or a provider inbound webhook. On arrival:

1. Read `In-Reply-To` / `References`.
2. Match against stored `Message-ID`s → thread, and therefore contact.
3. Append inbound, set thread `state = needs_reply`, contact `status = Replied`.

**Unmatched inbound is the known gap.** Forwarded replies, replies from a
different address, and auto-responders will not match. There is **no UI for
this yet** and silently dropping them loses real buyers. Needs:
`GET /inbox/unmatched`, plus assign-to-contact and discard.

### Bounces and complaints
Provider webhook, or parse the bounce. Hard bounce → contact `status = Bounced`,
thread `state = bounced`, suppress permanently. Feed the per-mailbox bounce rate;
above ~2% the mailbox should stop sending.

### Suppression
Global, checked before every send, and it must outlive contact deletion.
`Unsubscribed` is never re-imported — the CSV import already skips known emails,
but suppression needs its own table keyed on email and domain.

---

## 4. LinkedIn — no API, by design

There is no LinkedIn API for this and scraping risks the account, so **the app
never sends anything**. It records what the rep does.

The flow the UI implements:

```
open profile ↗  →  do it in LinkedIn  →  come back  →  mark it
paste what they sent  →  AI drafts a reply  →  copy  →  paste in LinkedIn  →  mark sent
```

Endpoints:
- `POST /linkedin/:cid/request` — increments today's counter, sets `li=requested`
- `POST /linkedin/:cid/state` — accepted / messaged / conversation / withdrawn
- `POST /linkedin/:cid/chat` — `{ messages: [{ dir, body }] }`. One endpoint,
  because the UI is one box: the client parses a pasted transcript into turns
  before sending. **When the last message is inbound the response should carry
  a drafted reply** — the rep never asks for one.
- `POST /linkedin/:cid/regenerate` — a different angle on the same last message
- `POST /linkedin/:cid/recycle` and `/restore`

**Caps are server-enforced, not just UI.** 20/day and 100/week per *user*, not
per org — the client counter is a convenience and will drift across devices.
The daily cap refuses rather than warns; keep that on the server.

**Recycling:** `recycleAt = now + 90 days`. A job returns them to the to-send
queue on that date and resets `li` to `none`.

Not built, worth knowing: a browser extension is the only way to remove the
copy-paste step. LinkedIn blocks iframing, so no in-app embed is possible.

---

## 5. Apollo import

CSV upload only — no API integration. `lib/csv.ts` (RFC 4180 parser) and
`lib/apolloImport.ts` (mapping and rejection accounting) already encode the
rules; the server should apply the same ones so a re-import is idempotent.

**Required columns:** First Name, Email, Company. Matched by name with aliases,
so export order does not matter.

**Rejection reasons, each counted and shown:** missing name or company, no
email, personal email domain, already in the CRM, duplicated inside the file.

A silent import reporting "268 added" while binning 72 rows is how a rep ends up
wondering why half a list was never contacted. Keep the breakdown.

---

## 6. AI drafting

`lib/ai.ts`. Two kinds, and the distinction matters:

- **`compose` / `composeLi`** — canned copy today, personalised from the hook.
  These become the model call. Nothing else needs to change.
- **`shorten` / `direct`** — real string transformations of what is in the box.
  They already behave exactly as shipped and should **stay client-side**: no
  latency, no cost, no round trip.

Both refuse when the box is empty rather than inventing a message.

Prompt inputs when this becomes a model call: contact `hook`, company, first
name, the full thread, and the intent. Email intents in `intentsFor`, LinkedIn
in `LI_INTENTS`.

**LinkedIn drafting is not user-triggered.** Logging an inbound message
produces the reply as part of the same action — there is no "draft this"
button and there should not be one. That means the chat endpoint above does a
model call inline, so it needs a short timeout and a fallback: if the model is
slow or down, log the message anyway and return no draft. Losing the record
because the drafter failed would be the worse outcome.

**Operational note from the earlier build:** the Anthropic SDK retries
timeouts, so wall-clock is `timeout × (retries + 1)`. Set an explicit `timeout`
and `maxRetries: 0` for anything behind a request, and catch
`APIConnectionTimeoutError` **before** `APIConnectionError` — it is a subclass,
so the order matters.

Every AI-written draft is marked in the UI and the rep must confirm before it
sends. Keep that; it is the reason the feature is safe to ship.

---

## 7. Endpoints by screen

| Screen | Needs |
| --- | --- |
| Contacts | `GET /contacts` (tab, owner, search, page), `PATCH /contacts/:id`, `POST /contacts`, `POST /contacts/bulk/suppress`, `POST /contacts/bulk/enrol` |
| Import | `POST /import/analyse` (dry run, returns the breakdown), `POST /import/commit` |
| Inbox | `GET /threads`, `GET /threads/:id`, `POST /threads/:id/send`, `POST /threads/:id/close`, `GET /inbox/unmatched` |
| LinkedIn | the six endpoints in §4 |
| Sequences | `GET/POST/PUT/DELETE /sequences`, `POST /sequences/:id/toggle` |
| Deals | `GET /deals`, `POST /deals`, `PATCH /deals/:id/stage` |
| Tasks | `GET /tasks`, `POST /tasks/:id/complete` |
| Record | `GET /contacts/:id/timeline`, `POST /contacts/:id/notes` |

**Timeline is assembled, never stored.** It is derived from threads, notes,
tasks, deals and the LinkedIn log (`selectors.ts#timelineFor`). A stored
timeline can drift from the conversation it describes, which is worse than none.

---

## 8. Auth and multi-user

Not in the frontend at all yet. The earlier build settled on **JWT in an
httpOnly cookie (`so_session`)** with bcryptjs hashes — reuse that.

`owner` is currently a string from a fixed list of three. It needs to become a
user id, and every list needs an "assigned to me" filter. Sending caps are
per-user, so mailboxes belong to users too.

---

## 9. Open questions

1. **Unmatched replies** — needs a screen before go-live, not after.
2. **Timezones.** The Gulf sequence assumes Sunday–Thursday and nothing sends
   Friday. Send windows are per-sequence and need a timezone per contact.
3. **Who owns a reply** when it lands in a shared mailbox?
4. **Sequence edits mid-flight** — does a contact on step 3 of an edited
   sequence get the old step 4 or the new one? Frontend currently implies the new one.
5. **Hook enforcement.** Should a send be blocked when `hook` is empty? The UI
   warns; it does not block.
