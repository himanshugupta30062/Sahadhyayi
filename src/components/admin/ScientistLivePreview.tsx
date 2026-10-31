import type { ScientistArchive, ScientistMilestone, ScientistPublication, ScientistProfile } from "@/data/scientists";

type PreviewProfile = Omit<ScientistProfile, "slug" | "name" | "region" | "discipline" | "lifespan" | "summary">;

function parseProfile(value: string): Partial<PreviewProfile> {
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Partial<PreviewProfile> : {};
  } catch {
    return {};
  }
}

function parseRecords<T>(value: string): T[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

function safeHttpUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="border-t border-[#E5DED2] pt-5 dark:border-[#29332D]"><h3 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#8F681C] dark:text-[#D5B16D]">{title}</h3>{children}</section>;
}

export function ScientistLivePreview({ name, region, discipline, lifespan, summary, profileData, publications, archives }: {
  name: string; region: "india" | "world"; discipline: string; lifespan: string; summary: string;
  profileData: string; publications: string; archives: string;
}) {
  const profile = parseProfile(profileData);
  const papers = parseRecords<ScientistPublication>(publications);
  const records = parseRecords<ScientistArchive>(archives);
  const portrait = profile.portrait;
  const imageUrl = portrait && typeof portrait === "object" ? safeHttpUrl(portrait.imageUrl) : undefined;
  const knownFor = Array.isArray(profile.knownFor) ? profile.knownFor.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : [];
  const lifeStory = Array.isArray(profile.lifeStory) ? profile.lifeStory.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : [];
  const work = Array.isArray(profile.work) ? profile.work : [];
  const milestones = Array.isArray(profile.milestones) ? profile.milestones as ScientistMilestone[] : [];
  const sources = Array.isArray(profile.sources) ? profile.sources : [];
  const portraitAlt = portrait && typeof portrait === "object" && typeof portrait.alt === "string" ? portrait.alt : name;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#D8CDBB] bg-[#FAF7F2] text-[#1C201D] shadow-sm dark:border-[#354238] dark:bg-[#0B0D0C] dark:text-[#F3F0E7]">
      <div className="bg-[#101711] px-5 py-6 text-white sm:px-7">
        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_112px] sm:items-center">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#E4C17B]">
              <span>{region === "india" ? "Indian scientist" : "Scientist around the world"}</span><span aria-hidden="true">·</span><span>{discipline || "Discipline not set"}</span>
            </div>
            <h2 className="font-serif text-3xl font-bold leading-tight text-[#FBF7EF]">{name || "Scientist name"}</h2>
            <p className="mt-2 text-xs text-white/65">{lifespan || "Lifespan not set"}{profile.birthplace ? ` · ${profile.birthplace}` : ""}</p>
            <p className="mt-3 font-serif text-lg leading-relaxed text-[#E9D7B5]">{profile.headline || "Profile headline will appear here."}</p>
            <p className="mt-2 text-sm leading-6 text-white/75">{summary || "The short profile summary will appear here."}</p>
          </div>
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] font-serif text-3xl font-bold text-white/80">
            {imageUrl ? <img src={imageUrl} alt={portraitAlt} className="h-full w-full object-cover" /> : <span>{profile.initials || "?"}</span>}
          </div>
        </div>
        {portrait && typeof portrait === "object" && (portrait.credit || portrait.rights) && <p className="mt-3 max-w-3xl text-[10px] leading-4 text-white/55">{[portrait.credit, portrait.rights].filter((item): item is string => typeof item === "string" && Boolean(item.trim())).join(" · ")}</p>}
      </div>
      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="min-w-0 space-y-6">
          <PreviewSection title="The life story">
            {lifeStory.length ? <div className="space-y-3 text-sm leading-7 text-[#4E574F] dark:text-[#C0C7C0]">{lifeStory.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div> : <p className="text-sm text-muted-foreground">Add biography paragraphs to preview this section.</p>}
          </PreviewSection>
          <PreviewSection title="Discoveries & scientific work">
            {work.length ? <div className="space-y-3">{work.map((item, index) => <article key={index} className="rounded-xl border border-[#E5DED2] bg-white p-4 dark:border-[#29332D] dark:bg-[#111614]"><h4 className="font-serif font-bold">{typeof item.title === "string" ? item.title : "Untitled contribution"}</h4><p className="mt-1 text-sm leading-6 text-[#687067] dark:text-[#A5ADA6]">{typeof item.description === "string" ? item.description : ""}</p></article>)}</div> : <p className="text-sm text-muted-foreground">Add scientific work records to preview this section.</p>}
          </PreviewSection>
          {papers.length > 0 && <PreviewSection title="Original research & publications"><div className="space-y-3">{papers.map((paper, index) => <article key={paper.id ?? paper.title ?? index} className="rounded-xl border border-[#E5DED2] bg-white p-4 dark:border-[#29332D] dark:bg-[#111614]"><p className="text-[10px] font-bold uppercase tracking-wider text-[#8F681C] dark:text-[#D5B16D]">{paper.year} · {paper.access}</p><h4 className="mt-1 font-serif font-bold">{paper.title}</h4><p className="mt-1 text-xs text-muted-foreground">{paper.authors} · {paper.venue}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{paper.note}</p>{safeHttpUrl(paper.url) && <span className="mt-2 inline-block text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">External research link ↗</span>}</article>)}</div></PreviewSection>}
          {records.length > 0 && <PreviewSection title="Archives & historical records"><div className="grid gap-3 sm:grid-cols-2">{records.map((record, index) => <article key={record.url ?? index} className="rounded-xl border border-[#E5DED2] bg-white p-4 dark:border-[#29332D] dark:bg-[#111614]"><p className="text-[10px] font-bold uppercase tracking-wider text-[#8F681C] dark:text-[#D5B16D]">{record.material}</p><h4 className="mt-1 font-serif font-bold">{record.title}</h4><p className="mt-1 text-xs text-muted-foreground">{record.institution}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{record.note}</p></article>)}</div></PreviewSection>}
          {milestones.length > 0 && <PreviewSection title="Life & work timeline"><ol className="space-y-3 border-l border-[#D8CDBB] pl-4 dark:border-[#465448]">{milestones.map((item, index) => <li key={index}><p className="text-xs font-bold text-[#8F681C] dark:text-[#D5B16D]">{item.year}</p><h4 className="font-semibold">{item.title}</h4><p className="text-sm leading-6 text-muted-foreground">{item.description}</p></li>)}</ol></PreviewSection>}
          {profile.legacy && <PreviewSection title="Why their work matters"><blockquote className="rounded-xl border-l-4 border-[#B38A42] bg-[#EEE9DE] px-4 py-4 font-serif leading-7 text-[#39463A] dark:bg-[#172019] dark:text-[#E8DDC7]">{profile.legacy}</blockquote></PreviewSection>}
          {sources.length > 0 && <PreviewSection title="Sources & further reading"><ul className="space-y-2">{sources.map((source, index) => <li key={index} className="rounded-lg border border-[#E5DED2] bg-white p-3 text-sm dark:border-[#29332D] dark:bg-[#111614]"><span className="font-semibold">{typeof source.label === "string" ? source.label : "Source"}</span><span className="block text-xs text-muted-foreground">{typeof source.publisher === "string" ? source.publisher : ""}</span></li>)}</ul></PreviewSection>}
        </div>
        <aside className="h-fit rounded-xl border border-[#E5DED2] bg-white p-4 dark:border-[#29332D] dark:bg-[#111614]">
          <h3 className="font-serif font-bold">Known for</h3>
          {knownFor.length ? <div className="mt-3 flex flex-wrap gap-2">{knownFor.map((item) => <span key={item} className="rounded-full bg-muted px-2.5 py-1 text-xs">{item}</span>)}</div> : <p className="mt-2 text-xs text-muted-foreground">Add key discoveries or contributions.</p>}
          <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">This is a live editorial preview. Save and publish to make changes visible publicly.</p>
        </aside>
      </div>
    </div>
  );
}
