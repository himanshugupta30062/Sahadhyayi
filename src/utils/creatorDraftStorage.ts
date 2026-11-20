import { CreatorPostState } from '@/types/creatorStudio';

const AUTOSAVE_KEY = 'sahadhyayi_creator_draft_auto';
const SAVED_DRAFTS_KEY = 'sahadhyayi_creator_saved_drafts';

export interface SavedDraft {
  id: string;
  name: string;
  bookTitle?: string;
  postType: string;
  updatedAt: string;
  state: CreatorPostState;
}

export function saveAutoDraft(state: CreatorPostState): void {
  try {
    if (typeof window === 'undefined') return;
    const payload = JSON.stringify({
      state,
      savedAt: new Date().toISOString(),
    });
    localStorage.setItem(AUTOSAVE_KEY, payload);
  } catch (err) {
    console.warn('Failed to auto-save creator studio draft', err);
  }
}

export function loadAutoDraft(): { state: CreatorPostState; savedAt: string } | null {
  try {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(AUTOSAVE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (err) {
    console.warn('Failed to load auto-saved creator draft', err);
    return null;
  }
}

export function clearAutoDraft(): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(AUTOSAVE_KEY);
  } catch (err) {
    console.warn('Failed to clear auto-saved creator draft', err);
  }
}

export function listSavedDrafts(): SavedDraft[] {
  try {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(SAVED_DRAFTS_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (err) {
    console.warn('Failed to list saved creator drafts', err);
    return [];
  }
}

export function saveNamedDraft(state: CreatorPostState, name: string): SavedDraft {
  const drafts = listSavedDrafts();
  const existingIndex = drafts.findIndex((d) => d.id === state.id);

  const draftItem: SavedDraft = {
    id: state.id || `draft-${Date.now()}`,
    name: name || state.slides[0]?.bookTitle || 'Untitled Design',
    bookTitle: state.slides[0]?.bookTitle,
    postType: state.postType,
    updatedAt: new Date().toISOString(),
    state: { ...state, id: state.id || `draft-${Date.now()}` },
  };

  if (existingIndex >= 0) {
    drafts[existingIndex] = draftItem;
  } else {
    drafts.unshift(draftItem);
  }

  // Keep max 20 saved drafts
  const trimmed = drafts.slice(0, 20);
  try {
    localStorage.setItem(SAVED_DRAFTS_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('Failed to persist named draft', err);
  }

  return draftItem;
}

export function deleteSavedDraft(id: string): void {
  const drafts = listSavedDrafts().filter((d) => d.id !== id);
  try {
    localStorage.setItem(SAVED_DRAFTS_KEY, JSON.stringify(drafts));
  } catch (err) {
    console.warn('Failed to delete saved draft', err);
  }
}
