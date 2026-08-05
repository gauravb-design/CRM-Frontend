import { isManual } from "../../src/data/types";
import { analyseApolloCsv } from "../../src/lib/apolloImport";
import { parseCsv } from "../../src/lib/csv";
import { S, ok, run } from "./harness";

/* -------------------------------------------------------- CSV parsing */
{
  const rows = parseCsv('a,b,c\n1,"two, with comma",3\n4,"line\nbreak",6\r\n');
  ok("parses 3 rows", rows.length === 3, rows.length);
  ok("keeps commas inside quotes", rows[1][1] === "two, with comma", rows[1][1]);
  ok("keeps newlines inside quotes", rows[2][1] === "line\nbreak", JSON.stringify(rows[2][1]));
  ok("handles CRLF", rows[2][2] === "6", rows[2][2]);

  ok("strips a BOM", parseCsv("﻿First Name\nx")[0][0] === "First Name");
  ok("unescapes doubled quotes", parseCsv('a\n"say ""hi"""')[1][0] === 'say "hi"');
  ok("skips blank lines", parseCsv("a\n\n\nb").length === 2);
}

/* ----------------------------------------------------- Apollo analysis */
{
  const csv = [
    "First Name,Last Name,Title,Company,Email,Person Linkedin Url,City,Country",
    "Ana,Reyes,CMO,Reyes Ltd,ana@reyes.com,linkedin.com/in/ana,Madrid,Spain",
    "Bob,Smith,MD,Smith Co,bob@gmail.com,,London,UK",
    "Cara,Vance,CEO,Vance,,,Leeds,UK",
    ",,,,,,,",
    "Dan,Ito,CTO,,dan@ito.com,,Tokyo,Japan",
    "Ana,Reyes,CMO,Reyes Ltd,ana@reyes.com,,Madrid,Spain",
    "Eve,Kim,Head of Marketing,Kim Group,aisha@merakiinteriors.com,,Seoul,Korea",
  ].join("\n");

  const a = analyseApolloCsv("apollo.csv", csv, S.contacts, "Aarav S.");
  ok("one row survives", a.ready.length === 1, a.ready.map((c) => c.email));
  ok("survivor is mapped", a.ready[0].firstName === "Ana" && a.ready[0].company === "Reyes Ltd");
  ok("location joined", a.ready[0].location === "Madrid, Spain", a.ready[0].location);
  ok("imported hook starts empty", a.ready[0].hook === "");
  ok("source records the route", a.ready[0].source === "Apollo CSV");

  const reasons = Object.fromEntries(a.skipped.map((s) => [s.reason, s.count]));
  ok("personal domain counted", reasons["Personal email domain"] === 1, reasons);
  ok("missing email counted", reasons["No email address"] === 1, reasons);
  ok("missing company counted", reasons["Missing a name or a company"] === 1, reasons);
  ok("in-file duplicate counted", reasons["Duplicated inside this file"] === 1, reasons);
  ok("existing contact counted", reasons["Already in the CRM"] === 1, reasons);
  ok("every row accounted for", a.ready.length + a.skipped.reduce((n, s) => n + s.count, 0) === a.total, a.total);

  const renamed = analyseApolloCsv("x.csv", "first_name,company,work email\nZoe,Zed Ltd,zoe@zed.com", [], "Aarav S.");
  ok("column aliases resolve", renamed.ready.length === 1, renamed.missing);

  const bad = analyseApolloCsv("x.csv", "Name,Phone\nZoe,123", [], "Aarav S.");
  ok("missing columns reported, nothing imported", bad.missing.length === 3 && bad.ready.length === 0, bad.missing);
}

/* ------------------------------------------------------ import commits */
{
  const rows = analyseApolloCsv(
    "a.csv",
    "First Name,Company,Email\nAna,Reyes Ltd,ana@reyes.com\nBo,Bo Ltd,bo@bo.com",
    S.contacts,
    "Aarav S.",
  ).ready;
  const s = run(S, { type: "importContacts", contacts: rows, seqId: 2 });
  ok("contacts appended", s.contacts.length === S.contacts.length + 2, s.contacts.length);
  ok("ids stay unique", new Set(s.contacts.map((c) => c.id)).size === s.contacts.length);
  ok("enrolled onto the chosen sequence", s.contacts.slice(-2).every((c) => c.seqId === 2));
  ok("toast names the sequence", /Gulf/.test(s.toast), s.toast);
}

/* ---------------------------------------------------- sequence builder */
{
  const steps = [
    { channel: "LinkedIn" as const, title: "Connect", delayDays: 1, body: "no note" },
    { channel: "Email" as const, title: "Opener", delayDays: 1, body: "one thing" },
  ];
  const made = run(S, { type: "saveSequence", id: null, name: "US — SMB", note: "n", steps });
  ok("sequence created", made.sequences.length === 3, made.sequences.length);
  ok("new sequence starts active", made.sequences[2].active === true);
  ok("ids do not collide", new Set(made.sequences.map((q) => q.id)).size === 3);

  const edited = run(made, { type: "saveSequence", id: 3, name: "US — renamed", note: "n", steps });
  ok("edit renames in place", edited.sequences[2].name === "US — renamed" && edited.sequences.length === 3);

  ok("LinkedIn steps are manual", isManual(steps[0]) && !isManual(steps[1]));

  const paused = run(made, { type: "toggleSequence", id: 3 });
  ok("pause flips active", paused.sequences[2].active === false);
  ok("pause explains itself", /Nothing further will send/.test(paused.toast), paused.toast);

  ok("delete removes an unused sequence", run(made, { type: "deleteSequence", id: 3 }).sequences.length === 2);

  const guarded = run(S, { type: "deleteSequence", id: 1 });
  ok("delete refused while contacts are enrolled", guarded.sequences.length === 2, guarded.sequences.length);
  ok("refusal says how many", /contacts are still on that sequence/.test(guarded.toast), guarded.toast);
}
