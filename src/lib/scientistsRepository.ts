import { supabase } from '@/integrations/supabase/client';
import {
  getScientistBySlug,
  scientists as fallbackScientists,
  type ScientistProfile,
} from '@/data/scientists';

type ProfileData = Partial<ScientistProfile> & Record<string, unknown>;

function isCompleteProfile(profile: ProfileData): boolean {
  const requiredArrays = ['knownFor', 'lifeStory', 'work', 'milestones', 'sources'];
  return requiredArrays.every((key) => Array.isArray(profile[key]) && (profile[key] as unknown[]).length > 0)
    && typeof profile.headline === 'string' && Boolean(profile.headline.trim())
    && typeof profile.legacy === 'string' && Boolean(profile.legacy.trim());
}

export async function fetchScientistProfiles(): Promise<ScientistProfile[]> {
  const { data, error } = await supabase
    .from('scientists')
    .select('id, slug, name, region, discipline, lifespan, summary, status, profile_data, sort_order')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  // Keep the curated static collection available if the Data API is temporarily unavailable
  // or the database has not yet been populated in a preview environment.
  if (error) return fallbackScientists;
  if (!data?.length) return [];

  const ids = data.map((row) => row.id);
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

  return data.flatMap((row) => {
    const fallback = getScientistBySlug(row.slug);
    const profileData = (row.profile_data ?? {}) as ProfileData;
    // A newly created record must contain a complete profile before it can appear publicly.
    // Existing curated profiles can continue using their reviewed static biography.
    if (!fallback && !isCompleteProfile(profileData)) return [];

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
    const merged = {
      ...fallback,
      ...profileData,
      slug: row.slug,
      name: row.name,
      region: row.region as ScientistProfile['region'],
      discipline: row.discipline,
      lifespan: row.lifespan,
      summary: row.summary,
      // A successful empty query means the admin intentionally removed all rows.
      publications: publicationResult.error ? fallback?.publications ?? [] : publications,
      archives: archiveResult.error ? fallback?.archives ?? [] : archives,
    } as ScientistProfile;
    return [merged];
  });
}

export async function fetchScientistProfile(slug: string): Promise<ScientistProfile | undefined> {
  const profiles = await fetchScientistProfiles();
  return profiles.find((scientist) => scientist.slug === slug);
}
