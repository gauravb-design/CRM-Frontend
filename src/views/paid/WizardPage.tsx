import { useState } from "react";
import { useNavigate } from "react-router";
import { PageHeader } from "../../layout/PageHeader";
import { applyAnswer, nextPrompt, type Draft } from "../../lib/paidChat";
import { checkAssets } from "../../lib/paidWizard";
import { ROUTES } from "../../routes";
import { useCrm } from "../../state/store";
import { Button } from "../../ui/Button";
import { CampaignPreview } from "./CampaignPreview";
import { WizardChat, type Turn } from "./WizardChat";

const OPENING =
  "I will put a campaign together with you. Four or five questions, and I will tell you when an answer is going to cause a problem rather than letting you find out in three weeks.";

/**
 * The campaign built through a conversation rather than a form. The chat asks,
 * the panel on the right fills in, and the reasoning lives in the replies —
 * `lib/paidChat.ts` holds all of it as pure functions, so the same flow can be
 * driven over the API.
 */
export function WizardPage() {
  const { dispatch } = useCrm();
  const nav = useNavigate();

  const [draft, setDraft] = useState<Draft>({});
  const [turns, setTurns] = useState<Turn[]>([{ id: 0, role: "ai", body: OPENING }]);

  const prompt = nextPrompt(draft);

  const answer = (text: string) => {
    if (!prompt.slot) return;
    const { draft: next, reply } = applyAnswer(draft, prompt.slot, text);
    setDraft(next);
    setTurns((t) => [
      ...t,
      { id: t.length, role: "you", body: text },
      ...(reply ? [{ id: t.length + 1, role: "ai" as const, body: reply }] : []),
    ]);
  };

  const ready = Boolean(draft.name && draft.platform && draft.type && draft.objective);
  const assetsOk =
    draft.platform && draft.headlines
      ? checkAssets(draft.platform, draft.headlines, draft.descriptions ?? []).ok
      : false;

  const create = (start: boolean) => {
    if (!ready) {
      dispatch({ type: "toast", text: "Finish the questions on the left first." });
      return;
    }
    if (start && !assetsOk) {
      dispatch({ type: "toast", text: "The copy is over the character limit. Fix it or save a draft." });
      return;
    }
    dispatch({
      type: "createCampaign",
      start,
      campaign: {
        platform: draft.platform!,
        type: draft.type!,
        name: draft.name!,
        objective: draft.objective!,
        dailyBudget: draft.dailyBudget ?? 0,
        targetCpa: draft.targetCpa ?? 0,
        geo: draft.geo ?? "—",
        audience: draft.audience ?? "—",
        landingUrl: draft.landingUrl ?? "",
        hasFeed: Boolean(draft.hasFeed),
        hasTracking: Boolean(draft.hasTracking),
        headlines: (draft.headlines ?? []).filter((h) => h.trim()),
        descriptions: (draft.descriptions ?? []).filter((d) => d.trim()),
      },
    });
    nav(ROUTES.paid);
  };

  return (
    <>
      <PageHeader
        title="New campaign"
        sub={draft.type ? `${draft.platform} · ${draft.type}` : "Answer a few questions and I will build it"}
        actions={
          <>
            <Button onClick={() => nav(ROUTES.paid)}>Cancel</Button>
            <Button disabled={!ready} onClick={() => create(false)}>
              Save as draft
            </Button>
            <Button variant="primary" disabled={!ready} onClick={() => create(true)}>
              Start campaign
            </Button>
          </>
        }
      />

      <div className="flex-1 min-h-0 flex">
        <WizardChat turns={turns} prompt={prompt} onAnswer={answer} />
        <CampaignPreview draft={draft} onChange={setDraft} />
      </div>
    </>
  );
}
