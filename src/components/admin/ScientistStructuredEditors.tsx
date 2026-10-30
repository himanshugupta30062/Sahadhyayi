import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FieldSpec = { key: string; label: string; multiline?: boolean; placeholder?: string };
type StringRecord = Record<string, unknown>;

const profileDefaults: StringRecord = {
  initials: "", headline: "", birthplace: "", knownFor: [], lifeStory: [],
  work: [], milestones: [], legacy: "", sources: [], portrait: null,
};

function parseObject(value: string): StringRecord {
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? { ...profileDefaults, ...(parsed as StringRecord) }
      : profileDefaults;
  } catch {
    return profileDefaults;
  }
}

function parseArray(value: string): StringRecord[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is StringRecord => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
  } catch {
    return [];
  }
}

function Field({ label, value, onChange, multiline = false, placeholder }: {
  label: string; value: string; onChange: (value: string) => void; multiline?: boolean; placeholder?: string;
}) {
  const id = `scientist-field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {multiline
        ? <Textarea id={id} rows={3} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
        : <Input id={id} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />}
    </div>
  );
}

function TextListEditor({ title, description, items, onChange, placeholder }: {
  title: string; description: string; items: string[]; onChange: (items: string[]) => void; placeholder: string;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-border/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="font-semibold">{title}</h3><p className="text-xs text-muted-foreground">{description}</p></div>
        <Button type="button" size="sm" variant="outline" onClick={() => onChange([...items, ""])}><Plus className="mr-1.5 h-4 w-4" />Add</Button>
      </div>
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-2">
          <Textarea aria-label={`${title} item ${index + 1}`} rows={2} value={item} placeholder={placeholder} onChange={(event) => onChange(items.map((value, i) => i === index ? event.target.value : value))} />
          <Button type="button" size="icon" variant="ghost" aria-label={`Remove ${title} item ${index + 1}`} onClick={() => onChange(items.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
      {items.length === 0 && <p className="text-sm text-muted-foreground">No entries yet. Use Add to create one.</p>}
    </section>
  );
}

function RecordListEditor({ title, description, value, onChange, fields, createItem }: {
  title: string; description: string; value: string; onChange: (value: string) => void;
  fields: FieldSpec[]; createItem: () => StringRecord;
}) {
  const items = parseArray(value);
  const updateItem = (index: number, key: string, next: string) => {
    onChange(JSON.stringify(items.map((item, i) => i === index ? { ...item, [key]: next } : item), null, 2));
  };
  return (
    <section className="space-y-3 rounded-xl border border-border/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="font-semibold">{title}</h3><p className="text-xs text-muted-foreground">{description}</p></div>
        <Button type="button" size="sm" variant="outline" onClick={() => onChange(JSON.stringify([...items, createItem()], null, 2))}><Plus className="mr-1.5 h-4 w-4" />Add record</Button>
      </div>
      {items.map((item, index) => (
        <div key={String(item.id ?? index)} className="space-y-3 rounded-lg bg-muted/35 p-3">
          <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title.slice(0, -1)} {index + 1}</p><Button type="button" size="icon" variant="ghost" aria-label={`Remove ${title} ${index + 1}`} onClick={() => onChange(JSON.stringify(items.filter((_, i) => i !== index), null, 2))}><Trash2 className="h-4 w-4" /></Button></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((field) => <div key={field.key} className={field.multiline ? "sm:col-span-2" : ""}><Field label={field.label} value={String(item[field.key] ?? "")} placeholder={field.placeholder} multiline={field.multiline} onChange={(next) => updateItem(index, field.key, next)} /></div>)}
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-sm text-muted-foreground">No records yet. Use Add record to create one.</p>}
    </section>
  );
}

export function ProfileStructuredEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const profile = parseObject(value);
  const setField = (key: string, next: unknown) => onChange(JSON.stringify({ ...profile, [key]: next }, null, 2));
  const text = (key: string) => String(profile[key] ?? "");
  const list = (key: string) => Array.isArray(profile[key]) ? profile[key] as string[] : [];
  const portrait = profile.portrait && typeof profile.portrait === "object" ? profile.portrait as StringRecord : {};
  const setPortrait = (key: string, next: string) => {
    const updated = { ...portrait, [key]: next };
    const hasContent = Object.values(updated).some((item) => typeof item === "string" && item.trim());
    setField("portrait", hasContent ? updated : null);
  };
  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-xl border border-border/70 p-4">
        <div><h3 className="font-semibold">Profile introduction</h3><p className="text-xs text-muted-foreground">The short identity and introductory details shown on the public profile.</p></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Initials" value={text("initials")} onChange={(v) => setField("initials", v)} placeholder="CVR" />
          <Field label="Birthplace" value={text("birthplace")} onChange={(v) => setField("birthplace", v)} />
          <div className="sm:col-span-2"><Field label="Headline" value={text("headline")} onChange={(v) => setField("headline", v)} /></div>
          <div className="sm:col-span-2"><Field label="Legacy summary" value={text("legacy")} onChange={(v) => setField("legacy", v)} multiline /></div>
        </div>
      </section>
      <TextListEditor title="Known for" description="Short discoveries, theories or contributions." items={list("knownFor")} onChange={(v) => setField("knownFor", v)} placeholder="A key scientific contribution" />
      <TextListEditor title="Life story" description="Write one clear paragraph per entry. Keep claims grounded in sources." items={list("lifeStory")} onChange={(v) => setField("lifeStory", v)} placeholder="Biographical paragraph" />
      <RecordListEditor title="Scientific work" description="Each item needs a title and an explanation." value={JSON.stringify(profile.work ?? [])} onChange={(v) => setField("work", parseArray(v))} fields={[{ key: "title", label: "Work title" }, { key: "description", label: "Description", multiline: true }]} createItem={() => ({ title: "", description: "" })} />
      <RecordListEditor title="Milestones" description="Add dated events in the scientist's life and career." value={JSON.stringify(profile.milestones ?? [])} onChange={(v) => setField("milestones", parseArray(v))} fields={[{ key: "year", label: "Year" }, { key: "title", label: "Milestone title" }, { key: "description", label: "Description", multiline: true }]} createItem={() => ({ year: "", title: "", description: "" })} />
      <RecordListEditor title="Sources" description="Cite institutional, scholarly or archival sources. Use complete https URLs." value={JSON.stringify(profile.sources ?? [])} onChange={(v) => setField("sources", parseArray(v))} fields={[{ key: "label", label: "Source title" }, { key: "publisher", label: "Publisher / institution" }, { key: "url", label: "Source URL" }]} createItem={() => ({ label: "", publisher: "", url: "" })} />
      <section className="space-y-3 rounded-xl border border-border/70 p-4">
        <div><h3 className="font-semibold">Portrait and image credits</h3><p className="text-xs text-muted-foreground">Portrait is optional. Include provenance and rights notes before publishing.</p></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Image URL" value={String(portrait.imageUrl ?? "")} onChange={(v) => setPortrait("imageUrl", v)} />
          <Field label="Alt text" value={String(portrait.alt ?? "")} onChange={(v) => setPortrait("alt", v)} />
          <Field label="Photographer / credit" value={String(portrait.credit ?? "")} onChange={(v) => setPortrait("credit", v)} />
          <Field label="Rights statement" value={String(portrait.rights ?? "")} onChange={(v) => setPortrait("rights", v)} />
          <div className="sm:col-span-2"><Field label="Provenance / source URL" value={String(portrait.sourceUrl ?? "")} onChange={(v) => setPortrait("sourceUrl", v)} /></div>
        </div>
      </section>
    </div>
  );
}

export function PublicationsStructuredEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <RecordListEditor title="Original publications" description="Bibliographic records for original research. Select the correct access classification." value={value} onChange={onChange} fields={[
    { key: "title", label: "Paper / publication title" }, { key: "year", label: "Year" },
    { key: "venue", label: "Journal / venue" }, { key: "authors", label: "Authors" },
    { key: "doi", label: "DOI (optional)" }, { key: "url", label: "Publisher / repository URL" },
    { key: "access", label: "Access type: publisher, open, catalogue" },
    { key: "note", label: "Access and source note", multiline: true },
  ]} createItem={() => ({ title: "", year: "", venue: "", authors: "", doi: "", url: "", access: "publisher", note: "" })} />;
}

export function ArchivesStructuredEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <RecordListEditor title="Archives and historical records" description="Catalogues, manuscripts, institutional biographies and digitised collections." value={value} onChange={onChange} fields={[
    { key: "title", label: "Record title" }, { key: "institution", label: "Holding institution" },
    { key: "url", label: "Archive / catalogue URL" }, { key: "material", label: "Material type" },
    { key: "note", label: "Description and availability note", multiline: true },
  ]} createItem={() => ({ title: "", institution: "", url: "", material: "", note: "" })} />;
}
