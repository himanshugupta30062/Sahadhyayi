import { supabase } from '@/integrations/supabase/client';
import {
  getScientistBySlug,
  scientists as fallbackScientists,
  type ScientistProfile,
} from '@/data/scientists';

export async function fetchScientistProfiles(): Promise<ScientistProfile[]> {
  const { data, error } = await supabase
    .from('scientists')
    .select('id, slug, name, region, discipline, lifespan, summary, status, profile_data, sort_order')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  // Keep the curated static collection available if the Data API is temporarily unavailable
  // or the database has not yet been populated in a preview environment.
  if (error || !data?.length) return fallbackScientists;

  const rows = data;
  const ids = rows.map((row) => row.id);
  const [publicationResult, archiveResult] = await Promise.all([
    supabase
      .from('scientist_publications')
      .select('id, scientist_id, title, year, venue, authors, doi, url, access, note, sort_order')
      .in('scientist_id', ids)
      .order('sort_order', { ascending: true }),
    supabase
      .from('scientist_archives')
      .select('id, scientist_id, title, institution, url, material, note, sort_order')
      .in('scientist_id', ids)
      .order('sort_order', { ascending: true }),
  ]);

  return rows.map((row) => {
    const fallback = getScientistBySlug(row.slug);
    const profileData = (row.profile_data ?? {}) as unknown as Partial<ScientistProfile>;
    const publications = (publicationResult.data ?? [])
      .filter((item) => item.scientist_id === row.id)
      .map(({ title, year, venue, authors, doi, url, access, note }) => ({
        title, year, venue, authors, doi: doi ?? undefined, url,
        access: access as 'publisher' | 'open' | 'catalogue', note,
      }));
    const archives = (archiveResult.data ?? [])
      .filter((item) => item.scientist_id === row.id)
      .map(({ title, institution, url, material, note }) => ({
        title, institution, url, material, note,
      }));

    return {
      ...fallback,
      ...profileData,
      slug: row.slug,
      name: row.name,
      region: row.region as ScientistProfile['region'],
      discipline: row.discipline,
      lifespan: row.lifespan,
      summary: row.summary,
      publications: publications.length ? publications : profileData.publications ?? fallback?.publications,
      archives: archives.length ? archives : profileData.archives ?? fallback?.archives,
    } as ScientistProfile;
  });
}

export async function fetchScientistProfile(slug: string): Promise<ScientistProfile | undefined> {
  const profiles = await fetchScientistProfiles();
  return profiles.find((scientist) => scientist.slug === slug);
}
