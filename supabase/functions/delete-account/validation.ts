/** Pure request-validation helpers shared by the account-deletion handler and unit tests. */

/** Extract a non-empty bearer token without accepting other authorization schemes. */
export function getBearerToken(authorization: string | null): string | null {
  if (!authorization || authorization.length < 7 || authorization.slice(0, 7).toLowerCase() !== "bearer ") return null;
  const token = authorization.slice(7).trim();
  return token || null;
}

/** Require an object body with the exact destructive-action confirmation phrase. */
export function hasDeleteConfirmation(body: unknown): boolean {
  return Boolean(
    body &&
      typeof body === "object" &&
      !Array.isArray(body) &&
      (body as { confirmation?: unknown }).confirmation === "DELETE",
  );
}
