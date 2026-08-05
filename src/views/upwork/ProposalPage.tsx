import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { PROPOSAL_STATES, type ProposalState } from "../../data/types";
import { PageHeader } from "../../layout/PageHeader";
import { fullName } from "../../lib/format";
import { ROUTES } from "../../routes";
import { contactById, profileById, proposalById } from "../../state/selectors";
import { useCrm } from "../../state/store";
import { Button, LinkButton } from "../../ui/Button";
import { Field, inputCls } from "../../ui/Field";
import { ChatInput } from "../chat/ChatInput";
import { ChatStream } from "../chat/ChatStream";

/**
 * The proposal on the left, the conversation on the right. Same chat as
 * LinkedIn — no API here either, so replies are pasted in and the answer is
 * drafted the moment they land.
 */
export function ProposalPage() {
  const { state, dispatch } = useCrm();
  const nav = useNavigate();
  const { id } = useParams();
  const proposal = proposalById(state, Number(id));
  const [body, setBody] = useState(proposal?.body ?? "");

  if (!proposal) {
    return (
      <>
        <PageHeader title="Proposal not found" sub="It may have been removed" />
        <div className="p-6">
          <Button onClick={() => nav(ROUTES.upworkProposals)}>Back to proposals</Button>
        </div>
      </>
    );
  }

  const client = contactById(state, proposal.cid);
  const profile = profileById(state, proposal.profileId);

  return (
    <>
      <PageHeader
        title={proposal.jobTitle}
        sub={`${client ? `${fullName(client)} · ${client.company}` : "No client"} · ${proposal.budget}${profile ? ` · from ${profile.name}` : ""}`}
        actions={
          <>
            <select
              className="chev border border-line rounded-[7px] px-[10px] py-2 text-[12.5px] cursor-pointer"
              value={proposal.state}
              onChange={(e) =>
                dispatch({ type: "setProposalState", id: proposal.id, state: e.target.value as ProposalState })
              }
            >
              {PROPOSAL_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {proposal.jobUrl && <LinkButton href={proposal.jobUrl}>Open job ↗</LinkButton>}
            <Button onClick={() => nav(ROUTES.upworkProposals)}>Back</Button>
          </>
        }
      />

      <div className="flex-1 min-h-0 flex">
        <div className="w-[440px] shrink-0 border-r border-line bg-surface overflow-y-auto px-[18px] py-4">
          <Field label="The proposal" hint={`${proposal.connects} connects · submitted in Upwork, recorded here`}>
            <textarea
              className={`${inputCls} min-h-[300px] leading-relaxed resize-y`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </Field>
          <div className="flex justify-end mt-2">
            <Button
              variant="primary"
              disabled={body === proposal.body}
              onClick={() => dispatch({ type: "saveProposal", id: proposal.id, body })}
            >
              Save proposal
            </Button>
          </div>
        </div>

        {client ? (
          <div className="flex-1 min-w-0 flex flex-col bg-canvas">
            <ChatStream
              contact={client}
              channel="Upwork"
              externalUrl={proposal.jobUrl || null}
              externalLabel="Open job ↗"
              emptyNote="Once they reply in Upwork, paste it here and an answer gets written for you. Upwork gives us no API to read."
            />
            <ChatInput key={client.id} contact={client} channel="Upwork" />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[12.5px] text-faint">
            No client attached to this proposal.
          </div>
        )}
      </div>
    </>
  );
}
