// src/utils/trustAndSafety.ts
var bannedWords = [
  // Slurs and hate speech
  "nigger",
  "nigga",
  "faggot",
  "fag",
  "retard",
  "retarded",
  "kike",
  "spic",
  "chink",
  "wetback",
  "beaner",
  "gook",
  "tranny",
  "shemale",
  // Severe profanity
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "cunt",
  "dick",
  "cock",
  "pussy",
  // Violence and threats
  "kill yourself",
  "kys",
  "go die",
  "neck yourself",
  // Sexual content
  "porn",
  "hentai",
  "xxx",
  "nsfw",
  // Spam/scam indicators
  "buy now",
  "click here",
  "free money",
  "make money fast"
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
