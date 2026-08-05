import { generateLi } from "../../src/lib/ai";
import { describeParse, parseChat } from "../../src/lib/chatParse";
import { looksLikeLinkedIn, profileUrl } from "../../src/lib/linkedin";
import { blankContact } from "../../src/state/reducer";
import {
  LI_TABS, canChatOnLinkedIn, chatThreadFor, contactById, lastInboundFrom,
  liConversations, liWaiting, suggestedReply, threadsFor,
} from "../../src/state/selectors";
import { S, ok, run } from "./harness";

/* --------------------------------------------------------- profile URLs */
{
  ok("adds a missing scheme", profileUrl("linkedin.com/in/ana") === "https://linkedin.com/in/ana");
  ok("keeps an existing scheme", profileUrl("https://www.linkedin.com/in/ana/") === "https://www.linkedin.com/in/ana/");
  ok("blank is null", profileUrl("") === null);
  ok("a dash is null", profileUrl("—") === null);
  ok("null input is null", profileUrl(null) === null);
  ok("junk is null", profileUrl("not a url at all") === null, profileUrl("not a url at all"));
  ok("recognises linkedin", looksLikeLinkedIn("uk.linkedin.com/in/ana"));
  ok("rejects a non-linkedin host", !looksLikeLinkedIn("example.com/in/ana"));

  const outbound = S.contacts.filter((c) => c.source === "Apollo");
  ok("every outbound contact has an openable profile",
    outbound.every((c) => profileUrl(c.linkedin) !== null),
    outbound.filter((c) => !profileUrl(c.linkedin)).map((c) => c.linkedin));
  ok("Upwork clients carry no LinkedIn URL",
    S.contacts.filter((c) => c.source === "Upwork").every((c) => profileUrl(c.linkedin) === null));

  const added = run(S, { type: "addContact", contact: blankContact("Zoe Zed", "Zed", "MD", "z@zed.com", "") });
  ok("a contact with no URL is not openable",
    profileUrl(added.contacts[added.contacts.length - 1].linkedin) === null);
}

/* -------------------------------------------------------- chat parsing */
{
  const c = contactById(S, 1)!; // Aisha Rahman

  ok("plain text is yours", (() => {
    const p = parseChat("Fifteen minutes on Tuesday?", c);
    return p.length === 1 && p[0].dir === "out";
  })());

  ok('Client said "x" is theirs', (() => {
    const p = parseChat('Client said "zxcvzxcv"', c);
    return p.length === 1 && p[0].dir === "in" && p[0].body === "zxcvzxcv";
  })(), parseChat('Client said "zxcvzxcv"', c));

  ok("Client said without quotes", parseChat("Client said: not right now", c)[0].body === "not right now");
  ok("You said is yours", parseChat('You said "on it"', c)[0].dir === "out");
  ok("Them: label", parseChat("Them: sounds good", c)[0].dir === "in");
  ok("named label is theirs", parseChat("Aisha: sounds good", c)[0].dir === "in");
  ok("full name label is theirs", parseChat("Aisha Rahman: sounds good", c)[0].dir === "in");

  const transcript = 'Aisha Rahman\n10:32 AM\nHappy to look at it.\nYou\n10:40 AM\nGreat — Tuesday?\nClient said "Tuesday works"';
  ok("a transcript splits into turns", (() => {
    const p = parseChat(transcript, c);
    return p.length === 3 && p[0].dir === "in" && p[1].dir === "out" && p[2].dir === "in";
  })(), parseChat(transcript, c));

  ok("timestamps are dropped", !parseChat("Aisha\n10:32 AM\nHello", c)[0].body.includes("10:32"));
  ok("multi-line turns stay together", parseChat("Client said: one\ntwo", c)[0].body === "one\ntwo");
  ok("smart quotes handled", parseChat("Client said “hello”", c)[0].body === "hello");
  ok("empty input parses to nothing", parseChat("   \n  ", c).length === 0);
  ok("describes a mixed paste",
    /1 from Aisha, 1 from you/.test(describeParse(parseChat('Client said "a"\nYou said "b"', c), c)),
    describeParse(parseChat('Client said "a"\nYou said "b"', c), c));
}

/* ------------------------------------------------------ chat committing */
{
  const s1 = run(S, { type: "chatLog", channel: "LinkedIn", cid: 3, messages: [{ dir: "in", body: "Sure, what did you have in mind?" }] });
  const t = chatThreadFor(s1, 3, "LinkedIn")!;
  ok("inbound creates a conversation", Boolean(t));
  ok("thread is LinkedIn with no mailbox", t.channel === "LinkedIn" && t.mailbox === null);
  ok("their message is stored inbound", t.msgs[0].dir === "in" && t.msgs[0].body.startsWith("Sure"));
  ok("contact moves to In conversation", contactById(s1, 3)!.li === "conversation");
  ok("status follows to Replied", contactById(s1, 3)!.status === "Replied");
  ok("touch is logged", s1.liLog.some((l) => l.text === "LinkedIn reply received"));

  /* The whole point: no button was pressed and a reply already exists. */
  const auto = suggestedReply(s1, contactById(s1, 3)!, "LinkedIn");
  ok("AI DRAFTS A REPLY ON ITS OWN", auto.length > 40, auto);
  ok("the draft answers what they said", auto.includes("Priya"), auto.slice(0, 40));
  ok("the user is told a draft is waiting", /drafted below/.test(s1.toast), s1.toast);

  const again = run(s1, { type: "chatRegenerate", channel: "LinkedIn", cid: 3 });
  ok("another angle is different", suggestedReply(again, contactById(again, 3)!, "LinkedIn") !== auto);
  ok("regenerate says so", /different angle/.test(again.toast), again.toast);

  const dropped = run(s1, { type: "chatDismiss", channel: "LinkedIn", cid: 3 });
  ok("discard clears it", suggestedReply(dropped, contactById(dropped, 3)!, "LinkedIn") === "");

  ok("nothing is drafted before they write", suggestedReply(S, contactById(S, 3)!, "LinkedIn") === "");
  ok("an accepted connection is offered an opener",
    suggestedReply(S, contactById(S, 6)!, "LinkedIn").length > 40, suggestedReply(S, contactById(S, 6)!, "LinkedIn"));
  ok("AI refuses to shorten an empty box", generateLi(contactById(s1, 3)!, "shorter", "", "") === null);

  const s2 = run(s1, { type: "chatLog", channel: "LinkedIn", cid: 3, messages: [{ dir: "out", body: "Fifteen minutes on Tuesday?" }] });
  const t2 = chatThreadFor(s2, 3, "LinkedIn")!;
  ok("reply appends to the same thread", t2.msgs.length === 2 && t2.id === t.id, t2.msgs.length);
  ok("reply is stored outbound", t2.msgs[1].dir === "out");
  ok("stays in conversation", contactById(s2, 3)!.li === "conversation");
  ok("last inbound is still theirs", lastInboundFrom(s2, 3).startsWith("Sure"));

  const s3 = run(S, { type: "chatLog", channel: "LinkedIn", cid: 1, messages: [{ dir: "out", body: "Thanks for connecting." }] });
  ok("accepted becomes messaged", contactById(s3, 1)!.li === "messaged", contactById(s3, 1)!.li);

  const before = S.threads.filter((x) => x.channel === "LinkedIn").length;
  const s4 = run(S, { type: "chatLog", channel: "LinkedIn", cid: 7, messages: [{ dir: "in", body: "Following up." }] });
  ok("existing conversation is reused", s4.threads.filter((x) => x.channel === "LinkedIn").length === before);

  const pasted = parseChat('Priya Nair\nHappy to look.\nYou\nTuesday?\nClient said "yes"', contactById(S, 3)!);
  const s5 = run(S, { type: "chatLog", channel: "LinkedIn", cid: 3, messages: pasted });
  const t5 = chatThreadFor(s5, 3, "LinkedIn")!;
  ok("all three turns land", t5.msgs.length === 3, t5.msgs.length);
  ok("order is preserved", t5.msgs.map((m) => m.dir).join(",") === "in,out,in", t5.msgs.map((m) => m.dir));
  ok("timestamps ascend", t5.msgs[0].at < t5.msgs[1].at && t5.msgs[1].at < t5.msgs[2].at);
  ok("one log entry per message", s5.liLog.length === 3, s5.liLog.length);
  ok("a transcript ending on their turn drafts a reply", suggestedReply(s5, contactById(s5, 3)!, "LinkedIn").length > 40);
  ok("adding your own message leaves no draft", suggestedReply(s3, contactById(s3, 1)!, "LinkedIn") === "");
  ok("empty paste is a no-op", run(S, { type: "chatLog", channel: "LinkedIn", cid: 3, messages: [] }) === S);

  ok("to_send list holds untouched people", liConversations(S, "to_send", "").every((c) => c.li === "none"));
  ok("list search narrows", liConversations(S, "to_send", "zzzz").length === 0);
  ok("every funnel tab partitions cleanly",
    LI_TABS.every((t) => liConversations(S, t.id, "").every((c) => t.match(c))));
  const listed = LI_TABS.flatMap((t) => liConversations(S, t.id, "").map((c) => c.id));
  ok("nobody appears in two tabs", new Set(listed).size === listed.length, listed.length);
  ok("the only people missing are suppressed or bounced",
    S.contacts
      .filter((c) => !listed.includes(c.id))
      .every((c) => c.status === "Unsubscribed" || c.status === "Bounced"),
    S.contacts.filter((c) => !listed.includes(c.id)).map((c) => `${c.firstName}:${c.status}`));
  ok("logged chats surface in the unified inbox",
    threadsFor(s1, "needs_reply", "LinkedIn", "").some((x) => x.cid === 3));
  ok("liWaiting counts accepted and replied", liWaiting(S) === 4, liWaiting(S));
}

/* ------------------------------------------- no chat before they accept */
{
  // LinkedIn refuses messages to non-connections, so the composer must not
  // appear for anyone who has not accepted.
  const cannot = ["none", "requested", "recycled"];
  const can = ["accepted", "messaged", "conversation"];

  ok("no chat before a request is sent",
    !canChatOnLinkedIn({ ...contactById(S, 3)!, li: "none" }));
  ok("NO CHAT WHILE A REQUEST IS PENDING",
    !canChatOnLinkedIn({ ...contactById(S, 3)!, li: "requested" }));
  ok("no chat once parked",
    !canChatOnLinkedIn({ ...contactById(S, 3)!, li: "recycled" }));
  ok("chat opens on acceptance",
    canChatOnLinkedIn({ ...contactById(S, 3)!, li: "accepted" }));
  ok("chat stays once messaged",
    canChatOnLinkedIn({ ...contactById(S, 3)!, li: "messaged" }));
  ok("chat stays in conversation",
    canChatOnLinkedIn({ ...contactById(S, 3)!, li: "conversation" }));

  ok("every state is decided",
    [...cannot, ...can].every((li) =>
      typeof canChatOnLinkedIn({ ...contactById(S, 3)!, li: li as never }) === "boolean"));

  // The to-send and awaiting tabs must never contain someone who can chat.
  ok("the to-send queue is all pre-connection",
    liConversations(S, "to_send", "").every((c) => !canChatOnLinkedIn(c)));
  ok("awaiting holds requested and messaged", (() => {
    const rows = liConversations(S, "awaiting", "");
    return rows.some((c) => !canChatOnLinkedIn(c)) && rows.some((c) => canChatOnLinkedIn(c));
  })());

  // No draft should be offered to someone who cannot be messaged.
  ok("no opener is suggested to an unaccepted contact",
    suggestedReply(S, { ...contactById(S, 3)!, li: "requested" }, "LinkedIn") === "");
}

/* ------------------------------------------------------ editing details */
{
  const s = run(S, {
    type: "saveContact", id: 3,
    patch: { hook: "size guide is a JPEG", linkedin: "linkedin.com/in/priya-nair", owner: "Amit R." },
  });
  const c = contactById(s, 3)!;
  ok("hook updated", c.hook === "size guide is a JPEG", c.hook);
  ok("owner reassigned", c.owner === "Amit R.");
  ok("edit is confirmed to the user", /Priya Nair updated/.test(s.toast), s.toast);
  ok("untouched fields survive", c.company === "Anantha Retail" && c.email === S.contacts[2].email);
  ok("edited URL is openable", profileUrl(c.linkedin) === "https://linkedin.com/in/priya-nair");

  const cleared = run(S, { type: "saveContact", id: 3, patch: { linkedin: "—" } });
  ok("clearing the URL removes it from the queue", profileUrl(contactById(cleared, 3)!.linkedin) === null);
}
