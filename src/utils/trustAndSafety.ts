export const bannedWords = [
  // Slurs and hate speech
  'nigger', 'nigga', 'faggot', 'fag', 'retard', 'retarded',
  'kike', 'spic', 'chink', 'wetback', 'beaner', 'gook',
  'tranny', 'shemale',
  // Severe profanity
  'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'cock', 'pussy',
  // Violence and threats
  'kill yourself', 'kys', 'go die', 'neck yourself',
  // Sexual content
  'porn', 'hentai', 'xxx', 'nsfw',
  // Spam/scam indicators
  'buy now', 'click here', 'free money', 'make money fast',
];

export const containsInappropriateLanguage = (text: string): boolean => {
  const lower = text.toLowerCase();
  return bannedWords.some(w => {
    // Use word boundary matching for short words to avoid false positives
    if (w.length <= 4) {
      const regex = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(lower);
    }
    return lower.includes(w);
  });
};
