export function createHash(s: string) {
  // tiny poor-man hash (ok for cache keys)
  let h = 0, i = 0;
  const len = s.length;
  while (i < len) h = (h << 5) - h + s.charCodeAt(i++) | 0;
  return 'h' + (h >>> 0).toString(36);
}
