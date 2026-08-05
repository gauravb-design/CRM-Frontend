import { NOW } from "../data/contacts";
import type { ProfileMessage } from "../data/types";
import { profileReply } from "../lib/upworkAi";
import type { Action, CrmState } from "./types";

type UpworkAction = Extract<
  Action,
  | { type: "saveProfile" } | { type: "deleteProfile" } | { type: "profileAsk" }
  | { type: "profileApply" } | { type: "createProposal" } | { type: "saveProposal" }
  | { type: "setProposalState" }
>;

const UPWORK_TYPES = new Set([
  "saveProfile", "deleteProfile", "profileAsk", "profileApply",
  "createProposal", "saveProposal", "setProposalState",
]);

export const isUpworkAction = (a: Action): a is UpworkAction => UPWORK_TYPES.has(a.type);

const nextId = (rows: Array<{ id: number }>) => Math.max(0, ...rows.map((r) => r.id)) + 1;

export function upworkReducer(s: CrmState, a: UpworkAction): CrmState {
  switch (a.type) {
    case "saveProfile":
      return {
        ...s,
        upworkProfiles: s.upworkProfiles.map((p) =>
          p.id === a.id ? { ...p, ...a.patch, updatedAt: NOW } : p,
        ),
        toast: "Profile saved.",
      };

    /* Proposals record which profile they were sent from, and that is part of
     * knowing which profile actually wins work. Deleting one out from under
     * them would quietly break that, so it refuses instead. */
    case "deleteProfile": {
      const profile = s.upworkProfiles.find((p) => p.id === a.id);
      if (!profile) return s;
      const used = s.proposals.filter((p) => p.profileId === a.id).length;
      if (used > 0) {
        return {
          ...s,
          toast: `${used} ${used === 1 ? "proposal was" : "proposals were"} sent from ${profile.name}. Move them to another profile first.`,
        };
      }
      const chats = { ...s.profileChats };
      delete chats[a.id];
      return {
        ...s,
        upworkProfiles: s.upworkProfiles.filter((p) => p.id !== a.id),
        profileChats: chats,
        toast: `${profile.name} deleted.`,
      };
    }

    /* Ask and answer land together. The reply is a pure function of the
     * profile and the question, so there is nothing async to wait on. */
    case "profileAsk": {
      const profile = s.upworkProfiles.find((p) => p.id === a.pid);
      if (!profile || !a.text.trim()) return s;
      const existing = s.profileChats[a.pid] ?? [];
      const base = nextId(existing.length ? existing : [{ id: 0 }]);
      const reply = profileReply(profile, a.text);

      const turns: ProfileMessage[] = [
        { id: base, role: "you", body: a.text.trim() },
        { id: base + 1, role: "ai", ...reply },
      ];
      return { ...s, profileChats: { ...s.profileChats, [a.pid]: [...existing, ...turns] } };
    }

    case "profileApply": {
      const patch =
        a.field === "skills"
          ? { skills: a.value.split(",").map((x) => x.trim()).filter(Boolean) }
          : { [a.field]: a.value };
      return {
        ...s,
        upworkProfiles: s.upworkProfiles.map((p) =>
          p.id === a.pid ? { ...p, ...patch, updatedAt: NOW } : p,
        ),
        toast: `${a.field[0].toUpperCase()}${a.field.slice(1)} updated.`,
      };
    }

    /* A proposal always creates the client it is addressed to — there is no
     * route into Upwork that starts with a contact. */
    case "createProposal": {
      const cid = Math.max(100, ...s.contacts.map((c) => c.id)) + 1;
      const id = nextId(s.proposals);
      return {
        ...s,
        contacts: [...s.contacts, { ...a.client, id: cid }],
        proposals: [...s.proposals, { ...a.proposal, id, cid, at: NOW }],
        toast: `${a.client.company} added and the proposal saved as ${a.proposal.state.toLowerCase()}.`,
      };
    }

    case "saveProposal":
      return {
        ...s,
        proposals: s.proposals.map((p) => (p.id === a.id ? { ...p, body: a.body } : p)),
        toast: "Proposal saved.",
      };

    case "setProposalState": {
      const proposal = s.proposals.find((p) => p.id === a.id);
      if (!proposal) return s;
      if (a.state === "Sent" && !proposal.body.trim()) {
        return { ...s, toast: "Nothing to send — the proposal is empty." };
      }
      const client = s.contacts.find((c) => c.id === proposal.cid);
      return {
        ...s,
        proposals: s.proposals.map((p) => (p.id === a.id ? { ...p, state: a.state, at: NOW } : p)),
        contacts: s.contacts.map((c) =>
          c.id === proposal.cid
            ? {
                ...c, lastAt: NOW,
                status: a.state === "Hired" ? "Interested" : a.state === "Declined" ? "Unqualified" : c.status,
              }
            : c,
        ),
        toast: client ? `${client.company} moved to ${a.state}.` : `Moved to ${a.state}.`,
      };
    }
  }
}
