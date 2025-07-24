export const bannedWords = [
  'badword1',
  'badword2',
  'badword3'
];

export const containsInappropriateLanguage = (text: string): boolean => {
  const lower = text.toLowerCase();
  return bannedWords.some(w => lower.includes(w));
};
