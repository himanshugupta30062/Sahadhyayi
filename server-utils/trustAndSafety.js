// src/utils/trustAndSafety.ts
var bannedWords = [
  "nigger", "nigga", "faggot", "fag", "retard", "retarded",
  "kike", "spic", "chink", "wetback", "beaner", "gook",
  "tranny", "shemale",
  "fuck", "shit", "bitch", "asshole", "cunt", "dick", "cock", "pussy",
  "kill yourself", "kys", "go die", "neck yourself",
  "porn", "hentai", "xxx", "nsfw",
  "buy now", "click here", "free money", "make money fast"
];
var containsInappropriateLanguage = (text) => {
  const lower = text.toLowerCase();
  return bannedWords.some((w) => {
    if (w.length <= 4) {
      const regex = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      return regex.test(lower);
    }
    return lower.includes(w);
  });
};
export {
  bannedWords,
  containsInappropriateLanguage
};
