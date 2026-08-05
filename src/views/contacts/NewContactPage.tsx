import { useState } from "react";
import { useNavigate } from "react-router";
import { PageHeader } from "../../layout/PageHeader";
import { ROUTES } from "../../routes";
import { blankContact } from "../../state/reducer";
import { useCrm } from "../../state/store";
import { Button } from "../../ui/Button";
import { Field, FormPanel, inputCls } from "../../ui/Field";

export function NewContactPage() {
  const { dispatch } = useCrm();
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", company: "", title: "", email: "", url: "", hook: "" });

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  const save = () => {
    if (!f.name.trim() || !f.email.trim()) {
      dispatch({ type: "toast", text: "A name and a work email are the minimum." });
      return;
    }
    const contact = blankContact(f.name, f.company, f.title, f.email, f.url);
    dispatch({ type: "addContact", contact: { ...contact, hook: f.hook.trim() } });
    nav(ROUTES.contacts);
  };

  return (
    <>
      <PageHeader
        title="Add a contact"
        sub="For someone you found yourself rather than through Apollo"
        actions={
          <>
            <Button onClick={() => nav(ROUTES.contacts)}>Cancel</Button>
            <Button variant="primary" onClick={save}>
              Add contact
            </Button>
          </>
        }
      />

      <FormPanel>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name">
            <input className={inputCls} value={f.name} onChange={set("name")} placeholder="Jamie Fowler" />
          </Field>
          <Field label="Company">
            <input className={inputCls} value={f.company} onChange={set("company")} placeholder="Fowler Group" />
          </Field>
          <Field label="Title">
            <input className={inputCls} value={f.title} onChange={set("title")} placeholder="Marketing Director" />
          </Field>
          <Field label="Work email">
            <input className={inputCls} value={f.email} onChange={set("email")} placeholder="jamie@fowlergroup.com" />
          </Field>
          <Field label="LinkedIn" span>
            <input className={inputCls} value={f.url} onChange={set("url")} placeholder="linkedin.com/in/jamiefowler" />
          </Field>
          <Field
            label="What you noticed"
            span
            hint="The opener is written from this. One concrete thing, not a compliment."
          >
            <textarea
              className={`${inputCls} min-h-[70px] leading-relaxed resize-y`}
              value={f.hook}
              onChange={set("hook")}
              placeholder="checkout makes people create an account before they can pay"
            />
          </Field>
        </div>
      </FormPanel>
    </>
  );
}
