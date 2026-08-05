import { useState } from "react";
import { useNavigate } from "react-router";
import { OWNERS } from "../../data/contacts";
import { PageHeader } from "../../layout/PageHeader";
import { analyseApolloCsv, type ImportAnalysis } from "../../lib/apolloImport";
import { ROUTES } from "../../routes";
import { useCrm } from "../../state/store";
import { Button } from "../../ui/Button";
import { FormPanel } from "../../ui/Field";
import { ImportDropzone } from "./ImportDropzone";
import { ImportSummary } from "./ImportSummary";

/**
 * Two steps on one page: choose a file, then look at what it actually
 * contains before anything is written. Apollo exports are messy enough that
 * importing blind is how a list of 400 turns into 90 sends and no explanation.
 */
export function ImportPage() {
  const { state, dispatch } = useCrm();
  const nav = useNavigate();
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null);
  const [seqId, setSeqId] = useState("0");
  const [busy, setBusy] = useState(false);

  const read = async (file: File) => {
    setBusy(true);
    try {
      const text = await file.text();
      setAnalysis(analyseApolloCsv(file.name, text, state.contacts, OWNERS[0]));
    } catch {
      dispatch({ type: "toast", text: "That file could not be read." });
    } finally {
      setBusy(false);
    }
  };

  const run = () => {
    if (!analysis?.ready.length) return;
    dispatch({ type: "importContacts", contacts: analysis.ready, seqId: Number(seqId) });
    nav(ROUTES.contacts);
  };

  return (
    <>
      <PageHeader
        title="Import from Apollo"
        sub="Upload the CSV Apollo exports. Everyone lands as a contact, never as a deal."
        actions={
          <>
            <Button onClick={() => nav(ROUTES.contacts)}>Cancel</Button>
            {analysis && (
              <Button variant="primary" disabled={!analysis.ready.length} onClick={run}>
                Import {analysis.ready.length} contacts
              </Button>
            )}
          </>
        }
      />

      <FormPanel width={760}>
        {!analysis ? (
          <ImportDropzone busy={busy} onFile={read} />
        ) : (
          <ImportSummary
            analysis={analysis}
            sequences={state.sequences}
            seqId={seqId}
            onSeq={setSeqId}
            onReset={() => setAnalysis(null)}
          />
        )}
      </FormPanel>
    </>
  );
}
