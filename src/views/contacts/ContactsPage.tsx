import { useState } from "react";
import { useNavigate } from "react-router";
import { OWNERS } from "../../data/contacts";
import { PageHeader } from "../../layout/PageHeader";
import { ROUTES } from "../../routes";
import { CONTACT_TABS, filteredContacts } from "../../state/selectors";
import { useCrm } from "../../state/store";
import { Button } from "../../ui/Button";
import { Card, Empty } from "../../ui/Feedback";
import { inputCls } from "../../ui/Field";
import { Tabs } from "../../ui/Tabs";
import { BulkBar } from "./BulkBar";
import { ContactsTable } from "./ContactsTable";

export function ContactsPage() {
  const { state } = useCrm();
  const nav = useNavigate();

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [owner, setOwner] = useState("all");
  const [selected, setSelected] = useState<number[]>([]);

  const rows = filteredContacts(state, tab, owner, search);
  const allOn = rows.length > 0 && rows.every((c) => selected.includes(c.id));

  return (
    <>
      <PageHeader
        title="Contacts"
        sub={`${state.contacts.length} contacts, all sourced from Apollo unless added by hand`}
        actions={
          <>
            <Button onClick={() => nav(ROUTES.contactNew)}>Add contact</Button>
            <Button variant="primary" onClick={() => nav(ROUTES.importCsv)}>
              Import CSV
            </Button>
          </>
        }
      />

      <Tabs
        tabs={CONTACT_TABS.map((t) => ({
          id: t.id,
          label: t.label,
          count: state.contacts.filter(t.match).length,
        }))}
        active={tab}
        onChange={(id) => {
          setTab(id);
          setSelected([]);
        }}
      />

      <div className="px-[22px] py-[11px] flex gap-[9px] items-center shrink-0">
        <input
          className={`${inputCls} w-[264px]`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, company or email"
        />
        <select
          className="chev border border-line rounded-[7px] px-[10px] py-2 text-[12.5px] cursor-pointer w-[158px]"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
        >
          <option value="all">All owners</option>
          {OWNERS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <Button variant="primary" onClick={() => setSelected(rows.map((c) => c.id))}>
          Select all {rows.length} contacts
        </Button>
      </div>

      <BulkBar selected={selected} onClear={() => setSelected([])} />

      <div className="flex-1 min-h-0 overflow-auto px-[22px] pb-[22px]">
        <Card className="overflow-hidden">
          <ContactsTable
            rows={rows}
            selected={selected}
            onToggle={(id) =>
              setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
            }
            onToggleAll={() => setSelected(allOn ? [] : rows.map((c) => c.id))}
            onOpen={(id) => nav(ROUTES.contact(id))}
          />
          {rows.length === 0 && <Empty>No contacts match this view.</Empty>}
        </Card>
      </div>
    </>
  );
}
