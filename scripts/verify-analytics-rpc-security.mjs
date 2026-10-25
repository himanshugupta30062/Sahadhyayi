import { readFileSync } from "node:fs";

const migration = readFileSync(
  "supabase/migrations/20261025170000_reassert_admin_analytics_rpc_grants.sql",
  "utf8",
);
const test = readFileSync("supabase/tests/analytics_rpc_security.test.sql", "utf8");

const requirements = [
  ["raw analytics RPC revokes authenticated", /REVOKE ALL ON FUNCTION public\.get_dual_table_website_analytics\(text\) FROM PUBLIC, anon, authenticated/i],
  ["engagement RPC revokes authenticated", /REVOKE ALL ON FUNCTION public\.get_website_engagement_stats\(text\) FROM PUBLIC, anon, authenticated/i],
  ["visit count RPC revokes authenticated", /REVOKE ALL ON FUNCTION public\.get_website_visit_count\(\) FROM PUBLIC, anon, authenticated/i],
  ["admin wrapper explicitly admin-gated", /auth\.uid\(\) IS NULL OR NOT public\.is_admin\(\)/i],
  ["admin wrapper has empty search_path", /SET search_path = ''/i],
  ["admin wrapper grants authenticated access", /GRANT EXECUTE ON FUNCTION public\.get_admin_website_analytics\(text\) TO authenticated, service_role/i],
  ["migration includes runtime ACL assertions", /Raw analytics RPCs must remain service-role-only/i],
];

const missing = requirements.filter(([, pattern]) => !pattern.test(migration));
if (missing.length) {
  console.error("Analytics RPC security verification failed:");
  for (const [label] of missing) console.error(`- ${label}`);
  process.exit(1);
}

for (const role of ["anon", "authenticated"]) {
  for (const fn of ["raw_oid", "engagement_oid", "count_oid"]) {
    if (!new RegExp(`ASSERT NOT has_function_privilege\\('${role}', ${fn}, 'EXECUTE'\\)`, "i").test(test)) {
      console.error(`Missing SQL regression assertion: ${role} cannot execute ${fn}`);
      process.exit(1);
    }
  }
}
if (!/ASSERT has_function_privilege\('authenticated', wrapper_oid, 'EXECUTE'\)/i.test(test)) {
  console.error("Missing SQL regression assertion: authenticated can reach the admin wrapper");
  process.exit(1);
}
console.log("Analytics RPC security migration and SQL regression assertions verified.");
