// src/utils/trustAndSafety.ts
var bannedWords = [
  "badword1",
  "badword2",
  "badword3"
];
var containsInappropriateLanguage = (text) => {
  const lower = text.toLowerCase();
  return bannedWords.some((w) => lower.includes(w));
};
export {
  bannedWords,
  containsInappropriateLanguage
};
