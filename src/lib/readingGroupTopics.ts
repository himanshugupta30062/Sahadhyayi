export interface ReadingGroupTopic {
  id: string;
  label: string;
  terms: readonly string[];
}

export const READING_GROUP_TOPICS: readonly ReadingGroupTopic[] = [
  { id: 'all', label: 'All topics', terms: [] },
  { id: 'fiction', label: 'Fiction', terms: ['fiction', 'novel', 'story', 'stories', 'fantasy', 'mystery', 'romance'] },
  { id: 'philosophy', label: 'Philosophy', terms: ['philosophy', 'philosoph', 'ethics', 'existential', 'upanishad', 'vedanta'] },
  { id: 'science', label: 'Science', terms: ['science', 'scientific', 'physics', 'biology', 'technology', 'research'] },
  { id: 'history', label: 'History', terms: ['history', 'historical', 'civilization', 'culture', 'heritage'] },
  { id: 'poetry', label: 'Poetry', terms: ['poetry', 'poet', 'verse', 'ghazal', 'literature'] },
  { id: 'growth', label: 'Personal growth', terms: ['growth', 'self-help', 'self development', 'habits', 'mindfulness'] },
];

/** Match a topic against group title and description; unknown topics fall back to All. */
export const matchesReadingGroupTopic = (
  topicId: string,
  name: string,
  description: string | null | undefined,
): boolean => {
  const topic = READING_GROUP_TOPICS.find((item) => item.id === topicId);
  if (!topic || topic.id === 'all') return true;
  const searchable = `${name} ${description ?? ''}`.toLocaleLowerCase();
  return topic.terms.some((term) => searchable.includes(term.toLocaleLowerCase()));
};
