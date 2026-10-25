export function createHash(s: string) {
  // tiny poor-man hash (ok for cache keys)
  let h = 0, i = 0;
  const len = s.length;
  while (i < len) h = Math.trunc((h << 5) - h + s.charCodeAt(i++));
  return 'h' + (h >>> 0).toString(36);
}
