import { direct, generate, shorten } from "../../src/lib/ai";
import { countWords } from "../../src/lib/format";
import { blankContact } from "../../src/state/reducer";
import {
  CONTACT_TABS, contactById, draftFor, filteredContacts, threadsFor, timelineFor,
} from "../../src/state/selectors";
import { S, ok, run } from "./harness";

/* ---------------------------------------------------------------- seed */
ok("15 contacts seeded", S.contacts.length === 15, S.contacts.length);
ok("10 threads seeded", S.threads.length === 10, S.threads.length);
ok("every contact has a hook", S.contacts.every((c) => c.hook.length > 10));

/* -------------------------------------------------------------- drafts */
ok("queued thread seeds an opener", draftFor(S, 7).includes("size guide is an image"), draftFor(S, 7).slice(0, 40));
ok("reply thread starts empty", draftFor(S, 1) === "");

/* ----------------------------------------------------- sending a reply */
{
  const typed = "Around $18k depending on scope. Free Tuesday?";
  const s = run(S,
    { type: "setCompose", tid: 1, text: typed },
    { type: "send", tid: 1, text: typed, next: "awaiting", status: "Replied" },
  );
  const t = s.threads.find((x) => x.id === 1)!;
  ok("reply appended", t.msgs.length === 4, t.msgs.length);
  ok("sent text is what was typed", t.msgs[3].body.startsWith("Around $18k"));
  ok("thread moved to awaiting", t.state === "awaiting", t.state);
  ok("contact marked Replied", contactById(s, 1)!.status === "Replied");
  ok("draft cleared after send", draftFor(s, 1) === "", draftFor(s, 1));
}

{
  const before = contactById(S, 3)!.seqStep;
  const s = run(S, { type: "send", tid: 7, text: "Hi Priya…", next: "awaiting", status: "Contacted", advance: true });
  ok("seqStep advanced", contactById(s, 3)!.seqStep === before + 1, contactById(s, 3)!.seqStep);
  ok("queued send logged a message", s.threads.find((x) => x.id === 7)!.msgs.length === 1);
}

/* ------------------------------------------------------------------ AI */
{
  const long = draftFor(S, 7);
  const short = shorten(long);
  ok("shorten actually shortens", countWords(short) < countWords(long), `${countWords(long)} -> ${countWords(short)}`);
  ok("shorten keeps the greeting", short.startsWith("Hi Priya,"), short.slice(0, 14));
  ok("shorten keeps a question", short.trim().endsWith("?"));

  const d = direct("Hi Sam,\n\nI think maybe we could just have a quick chat. Happy to send it over.");
  ok("direct strips hedges", !/\bjust\b|\bmaybe\b|I think|Happy to/i.test(d), d);

  ok("generate refuses an empty shorten", generate(contactById(S, 1)!, "shorter", "") === null);
  ok("generate composes an opener", (generate(contactById(S, 1)!, "opener", "") ?? "").includes("enquiry form"));
}

{
  const s = run(S, { type: "aiApply", tid: 1, text: "drafted" });
  ok("aiUsed flagged", s.aiUsed[1] === true);
  ok("send clears the AI flag", run(s, { type: "send", tid: 1, text: "drafted", next: "awaiting" }).aiUsed[1] === undefined);
}

/* --------------------------------------------------------------- deals */
{
  const s = run(S, { type: "createDeal", cid: 4 });
  ok("deal created", s.deals.length === 4, s.deals.length);
  ok("contact marked Interested", contactById(s, 4)!.status === "Interested");
  ok("duplicate deal refused", run(s, { type: "createDeal", cid: 4 }).deals.length === 4);
  ok("stage move works",
    run(s, { type: "moveDeal", id: 1, stage: "Won" }).deals.find((d) => d.id === 1)!.stage === "Won");
}

/* ------------------------------------------------------------ contacts */
{
  ok("bulk suppress applies",
    run(S, { type: "suppressMany", ids: [1, 2] }).contacts.filter((c) => c.status === "Unsubscribed").length === 3);

  const added = run(S, { type: "addContact", contact: blankContact("Jamie Fowler", "Fowler Group", "MD", "j@f.com", "") });
  ok("contact added", added.contacts.length === 16);
  ok("name split correctly", added.contacts[15].firstName === "Jamie" && added.contacts[15].lastName === "Fowler");

  ok("every tab resolves", CONTACT_TABS.every((t) => Array.isArray(filteredContacts(S, t.id, "all", ""))));
  ok("owner filter works", filteredContacts(S, "all", "Neha K.", "").every((c) => c.owner === "Neha K."));
  ok("search matches company", filteredContacts(S, "all", "all", "meraki").length === 1);
}

/* -------------------------------------------------------- inbox/record */
{
  ok("needs_reply has three", threadsFor(S, "needs_reply", "all", "").length === 3);
  ok("channel filter works", threadsFor(S, "needs_reply", "LinkedIn", "").every((t) => t.channel === "LinkedIn"));
  ok("search narrows to nothing", threadsFor(S, "needs_reply", "all", "zzzz").length === 0);
  ok("timeline is newest first", (() => {
    const tl = timelineFor(S, 1, "activity");
    return tl.every((e, i) => i === 0 || tl[i - 1].at >= e.at);
  })());
  ok("email tab excludes linkedin", timelineFor(S, 7, "emails").every((e) => e.kind === "email"));

  const s = run(S, { type: "addNote", cid: 1, body: "Called, asked for pricing." });
  ok("note on the timeline", timelineFor(s, 1, "notes").some((e) => e.body.startsWith("Called")));
}
