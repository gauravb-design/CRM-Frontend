import { checkProfile, scoreProfile, weakestCheck } from "../../src/lib/profileScore";
import { profileReply, proposalDraft, upworkReply } from "../../src/lib/upworkAi";
import { parseChat } from "../../src/lib/chatParse";
import { letterMark } from "../../src/lib/format";
import {
  chatThreadFor, contactById, profileById, proposalById, suggestedReply, threadsFor, timelineFor,
} from "../../src/state/selectors";
import type { Contact } from "../../src/data/types";
import { S, ok, run } from "./harness";

/** createProposal takes a client without an id — the reducer assigns it. */
const withoutId = ({ id: _id, ...rest }: Contact): Omit<Contact, "id"> => rest;

/* ------------------------------------------------------- the profile row */
{
  ok("initials skip punctuation", letterMark("Web app UI/UX") === "WA", letterMark("Web app UI/UX"));
  ok("ampersands are not letters", letterMark("Shopify & ecommerce") === "SE", letterMark("Shopify & ecommerce"));
  ok("a single word still gives a mark", letterMark("Design") === "D");
  ok("empty text falls back", letterMark("   ") === "—");
  ok("every seeded profile has a mark", S.upworkProfiles.every((p) => letterMark(p.name).length >= 1));
}

/* --------------------------------------------------------- profile score */
{
  const strong = profileById(S, 1)!;
  const weak = profileById(S, 2)!;

  ok("a finished profile passes everything", scoreProfile(strong).passed === scoreProfile(strong).total,
    checkProfile(strong).filter((c) => !c.ok).map((c) => c.id));
  ok("a thin profile does not", scoreProfile(weak).passed < scoreProfile(weak).total / 2,
    scoreProfile(weak).passed);

  const failing = checkProfile(weak).filter((c) => !c.ok).map((c) => c.id);
  ok("thin headline caught", failing.includes("headline"), failing);
  ok("filler caught", failing.includes("filler"), failing);
  ok("no number caught", failing.includes("proof"), failing);
  ok("too few skills caught", failing.includes("skills"), failing);
  ok("thin portfolio caught", failing.includes("portfolio"), failing);
  ok("weakest is the first failure", weakestCheck(weak)?.id === failing[0]);
  ok("every check has a hint", checkProfile(weak).every((c) => c.hint.length > 20));
}

/* ------------------------------------------------------- profile chat */
{
  const p = profileById(S, 2)!;

  ok("headline question returns an edit", profileReply(p, "Rewrite my headline").apply?.field === "headline");
  ok("overview question returns an edit", profileReply(p, "fix the overview").apply?.field === "overview");
  ok("skills question returns an edit", profileReply(p, "are my skills right?").apply?.field === "skills");
  ok("rate question is advice only", profileReply(p, "should I raise my rate?").apply === undefined);
  ok("an open question names the weakest check",
    profileReply(p, "what is wrong with this?").body.includes("checks pass"),
    profileReply(p, "what is wrong with this?").body.slice(0, 50));

  const asked = run(S, { type: "profileAsk", pid: 2, text: "Rewrite my headline" });
  const turns = asked.profileChats[2] ?? [];
  ok("ask and answer land together", turns.length === 2 && turns[0].role === "you" && turns[1].role === "ai");
  ok("the answer carries the new headline", Boolean(turns[1].apply?.value));
  ok("empty questions are ignored", (run(S, { type: "profileAsk", pid: 2, text: "  " }).profileChats[2] ?? []).length === 0);

  const applied = run(asked, {
    type: "profileApply", pid: 2, field: "headline", value: turns[1].apply!.value,
  });
  ok("APPLYING CHANGES THE PROFILE", profileById(applied, 2)!.headline === turns[1].apply!.value);
  ok("the headline check now passes", checkProfile(profileById(applied, 2)!).find((c) => c.id === "headline")!.ok);

  const skills = run(S, { type: "profileApply", pid: 2, field: "skills", value: "A, B, C ,, D" });
  ok("skills split and trim", profileById(skills, 2)!.skills.join("|") === "A|B|C|D",
    profileById(skills, 2)!.skills);

  const edited = run(S, { type: "saveProfile", id: 2, patch: { rate: 80 } });
  ok("direct edits save", profileById(edited, 2)!.rate === 80);
  ok("saving stamps the time", profileById(edited, 2)!.updatedAt > profileById(S, 2)!.updatedAt);
}

/* ----------------------------------------------------- deleting a profile */
{
  // Profile 2 has no proposals against it; profiles 1 and 3 do.
  const gone = run(S, { type: "deleteProfile", id: 2 });
  ok("an unused profile deletes", gone.upworkProfiles.length === S.upworkProfiles.length - 1);
  ok("it is the right one", profileById(gone, 2) === null);
  ok("deleting is confirmed", /deleted/.test(gone.toast), gone.toast);

  const withChat = run(S, { type: "profileAsk", pid: 2, text: "Rewrite my headline" });
  ok("the chat exists first", (withChat.profileChats[2] ?? []).length === 2);
  const cleaned = run(withChat, { type: "deleteProfile", id: 2 });
  ok("its chat goes with it", cleaned.profileChats[2] === undefined);

  const blocked = run(S, { type: "deleteProfile", id: 1 });
  ok("A PROFILE WITH PROPOSALS IS KEPT", blocked.upworkProfiles.length === S.upworkProfiles.length);
  ok("and it says how many", /2 proposals were sent/.test(blocked.toast), blocked.toast);

  const one = run(S, { type: "deleteProfile", id: 3 });
  ok("the count reads singular", /1 proposal was sent/.test(one.toast), one.toast);

  ok("deleting something gone is a no-op", run(S, { type: "deleteProfile", id: 99 }) === S);
}

/* ---------------------------------------------------------- proposals */
{
  const profile = profileById(S, 1)!;
  const client = contactById(S, 101)!;
  ok("a draft is written from the job and the profile",
    proposalDraft("Redesign the dashboard", profile, client).includes("Northlane Analytics"));

  const before = S.contacts.length;
  const s = run(S, {
    type: "createProposal",
    proposal: {
      profileId: 1, jobTitle: "New landing page", jobUrl: "", budget: "$2k",
      connects: 16, body: "Here is what I would change.", state: "Sent",
    },
    client: { ...withoutId(client), firstName: "Nina", lastName: "Bloom", company: "Bloomwork" },
  });

  ok("A PROPOSAL CREATES ITS CLIENT", s.contacts.length === before + 1, s.contacts.length);
  const created = s.contacts[s.contacts.length - 1];
  ok("the client is attached to the proposal", s.proposals[s.proposals.length - 1].cid === created.id);
  ok("client ids stay unique", new Set(s.contacts.map((c) => c.id)).size === s.contacts.length);
  ok("the client is marked as coming from Upwork", created.source === "Upwork");

  const sent = run(S, { type: "setProposalState", id: 3, state: "Sent" });
  ok("an empty proposal cannot be submitted", proposalById(sent, 3)!.state === "Draft", proposalById(sent, 3)!.state);
  ok("and it says why", /Nothing to send/.test(sent.toast), sent.toast);

  const written = run(S, { type: "saveProposal", id: 3, body: "Something real." });
  ok("saving the body works", proposalById(written, 3)!.body === "Something real.");
  const nowSent = run(written, { type: "setProposalState", id: 3, state: "Sent" });
  ok("then it can be submitted", proposalById(nowSent, 3)!.state === "Sent");

  const hired = run(S, { type: "setProposalState", id: 1, state: "Hired" });
  ok("hired marks the client Interested", contactById(hired, 101)!.status === "Interested");
  const lost = run(S, { type: "setProposalState", id: 1, state: "Declined" });
  ok("declined marks them Unqualified", contactById(lost, 101)!.status === "Unqualified");
}

/* ------------------------------------------- the Upwork chat, shared code */
{
  const s = run(S, {
    type: "chatLog", channel: "Upwork", cid: 101,
    messages: [{ dir: "in", body: "Looks good. What would the first two weeks look like?" }],
  });

  const t = chatThreadFor(s, 101, "Upwork")!;
  ok("an Upwork conversation is created", Boolean(t) && t.channel === "Upwork" && t.mailbox === null);
  ok("A REPLY IS DRAFTED WITH NOTHING PRESSED",
    suggestedReply(s, contactById(s, 101)!, "Upwork").length > 40,
    suggestedReply(s, contactById(s, 101)!, "Upwork"));
  ok("the draft names them", suggestedReply(s, contactById(s, 101)!, "Upwork").includes("Marcus"));
  ok("a reply moves the proposal on", proposalById(s, 1)!.state === "Replied");

  ok("LinkedIn state is untouched by an Upwork chat", contactById(s, 101)!.li === "none");
  ok("no LinkedIn touch is logged", s.liLog.length === 0);

  const again = run(s, { type: "chatRegenerate", channel: "Upwork", cid: 101 });
  ok("another angle differs",
    suggestedReply(again, contactById(again, 101)!, "Upwork") !==
      suggestedReply(s, contactById(s, 101)!, "Upwork"));

  ok("the two channels keep separate drafts",
    suggestedReply(s, contactById(s, 101)!, "LinkedIn") === "");

  const pasted = parseChat('Client said "Can you start Monday?"', contactById(S, 101)!);
  ok("the same parser is used", pasted.length === 1 && pasted[0].dir === "in");

  ok("Upwork replies rotate", upworkReply(contactById(S, 101)!, 0, "x") !== upworkReply(contactById(S, 101)!, 1, "x"));

  ok("the conversation reaches the unified inbox",
    threadsFor(s, "needs_reply", "Upwork", "").some((x) => x.cid === 101));
  ok("and the client timeline", timelineFor(s, 101, "activity").length > 0);
}
