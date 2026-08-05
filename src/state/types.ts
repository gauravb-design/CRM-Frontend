import type {
  Campaign,
  CampaignState,
  Channel,
  Contact,
  Deal,
  DealStage,
  LiLogEntry,
  LiState,
  Note,
  ProfileMessage,
  Proposal,
  ProposalState,
  Sequence,
  SequenceStep,
  Task,
  Thread,
  ThreadState,
  UpworkProfile,
} from "../data/types";

export interface CrmState {
  contacts: Contact[];
  threads: Thread[];
  deals: Deal[];
  tasks: Task[];
  notes: Note[];
  liLog: LiLogEntry[];
  sequences: Sequence[];

  /** Composer text keyed by thread id. Absent means "use the seeded draft". */
  compose: Record<number, string>;
  /** Threads whose current draft came out of the AI, so we can say so. */
  aiUsed: Record<number, boolean>;
  /** Per-message expand state, keyed "threadId:index". Absent means default. */
  openMsgs: Record<string, boolean>;
  /**
   * The pending reply in a manual-channel chat, keyed `${channel}:${cid}`.
   * Written by the AI when their message is logged, then editable.
   */
  chatDrafts: Record<string, string>;

  campaigns: Campaign[];
  upworkProfiles: UpworkProfile[];
  proposals: Proposal[];
  /** Profile-optimisation conversations, keyed by profile id. */
  profileChats: Record<number, ProfileMessage[]>;

  liSentToday: number;
  liWeek: number;
  toast: string;
}

export type Action =
  | { type: "toast"; text: string }
  | { type: "dismissToast" }
  | { type: "setCompose"; tid: number; text: string }
  | { type: "aiApply"; tid: number; text: string }
  | { type: "toggleMsg"; key: string; fallback: boolean }
  | { type: "setSubject"; tid: number; subject: string }
  | { type: "send"; tid: number; text: string; next: ThreadState; status?: Contact["status"]; advance?: boolean }
  | { type: "closeThread"; tid: number; status: Contact["status"]; text: string }
  | { type: "patchContact"; id: number; patch: Partial<Contact> }
  | { type: "saveContact"; id: number; patch: Partial<Contact> }
  | { type: "suppressMany"; ids: number[] }
  | { type: "addContact"; contact: Omit<Contact, "id"> }
  | { type: "importContacts"; contacts: Array<Omit<Contact, "id">>; seqId: number }
  | { type: "createDeal"; cid: number; value?: number }
  | { type: "moveDeal"; id: number; stage: DealStage }
  | { type: "completeTask"; id: number }
  | { type: "addNote"; cid: number; body: string }
  | { type: "liSend"; cid: number }
  | { type: "liSet"; cid: number; li: LiState; note: string }
  | { type: "liRecycle"; cid: number }
  | { type: "liRestore"; cid: number }
  /* Manual-channel chat. One set of actions for LinkedIn and Upwork — the
   * only difference between them is which drafter writes the reply. */
  | { type: "chatLog"; cid: number; channel: Channel; messages: Array<{ dir: "in" | "out"; body: string }> }
  | { type: "chatDraft"; cid: number; channel: Channel; text: string }
  | { type: "chatRegenerate"; cid: number; channel: Channel }
  | { type: "chatDismiss"; cid: number; channel: Channel }

  /* Upwork */
  /* Paid media */
  | { type: "createCampaign"; campaign: Omit<Campaign, "id" | "state" | "startedAt" | "metrics">; start: boolean }
  | { type: "saveCampaign"; id: number; patch: Partial<Campaign> }
  | { type: "setCampaignState"; id: number; state: CampaignState }
  | { type: "applyFix"; id: number; label: string; patch: Partial<Campaign> }

  | { type: "saveProfile"; id: number; patch: Partial<UpworkProfile> }
  | { type: "deleteProfile"; id: number }
  | { type: "profileAsk"; pid: number; text: string }
  | { type: "profileApply"; pid: number; field: "headline" | "overview" | "skills"; value: string }
  | { type: "createProposal"; proposal: Omit<Proposal, "id" | "cid" | "at">; client: Omit<Contact, "id"> }
  | { type: "saveProposal"; id: number; body: string }
  | { type: "setProposalState"; id: number; state: ProposalState }
  | { type: "saveSequence"; id: number | null; name: string; note: string; steps: SequenceStep[] }
  | { type: "deleteSequence"; id: number }
  | { type: "toggleSequence"; id: number };
