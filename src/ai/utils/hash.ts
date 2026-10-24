export function createHash(s: string) {
  // tiny poor-man hash (ok for cache keys)
  let h = 0, i = 0;
  const len = s.length;
  while (i < len) {
    h = Math.imul(h, 31) + s.charCodeAt(i++);
    // Keep the original signed 32-bit overflow behavior without bitwise coercion.
    if (h > 2147483647) h -= 4294967296;
  }
  return 'h' + (h < 0 ? h + 4294967296 : h).toString(36);
}
