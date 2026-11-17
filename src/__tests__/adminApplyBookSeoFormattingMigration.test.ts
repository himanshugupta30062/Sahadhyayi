import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../../supabase/migrations/20261117240000_apply_approved_book_seo_formatting.sql", import.meta.url),
  "utf8",
);

describe("approved book SEO formatting migration", () => {
  it("requires an authenticated administrator and an approved decision with evidence", () => {
    expect(migration).toContain("auth.uid() IS NULL OR NOT public.is_admin()");
    expect(migration).toContain("v_decision.decision <> 'approved'");
    expect(migration).toContain("v_decision.evidence_url IS NULL");
  });

  it("locks decision and book rows and prevents applying a decision twice", () => {
    expect(migration.match(/FOR UPDATE/g)).toHaveLength(2);
    expect(migration).toContain("v_decision.applied_at IS NOT NULL");
    expect(migration).toContain("applied_by = auth.uid()");
    expect(migration).toContain("applied_changes = v_changes");
  });

  it("allows only exact whitespace cleanup for a fixed field allowlist", () => {
    expect(migration).toContain("('title', 'author', 'genre', 'language', 'isbn')");
    expect(migration).toContain("requiresHumanApproval");
    expect(migration).toContain("regexp_replace(v_current, '^[[:space:]]+|[[:space:]]+$', '', 'g')");
    expect(migration).toContain("v_current IS DISTINCT FROM (v_change->>'currentValue')");
  });

  it("exposes the mutation only through the admin-checked RPC", () => {
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.admin_apply_book_seo_review_decision(uuid) FROM PUBLIC, anon");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.admin_apply_book_seo_review_decision(uuid) TO authenticated");
    expect(migration).toContain("applied_at IS NULL");
  });
});
