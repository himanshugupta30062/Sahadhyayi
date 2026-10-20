# PostgreSQL collation version mismatch (Supabase)

## Observed production finding

The Sahadhyayi Supabase project was observed on PostgreSQL 17.11 with the current
database reporting a recorded collation version of `153.120` and actual provider
version `153.121`. This is a real version mismatch warning; it is not, by itself,
evidence that the database is corrupted.

## Important: do not hide the warning first

Running `ALTER DATABASE postgres REFRESH COLLATION VERSION` only updates the
recorded version. It does not rebuild collation-dependent indexes or other
objects. Refreshing metadata before reviewing/rebuilding affected objects can
leave sorted/indexed data inconsistent with the new collation behavior.

Avoid placing either `ALTER DATABASE ... REFRESH COLLATION VERSION` or
`REINDEX DATABASE` in a routine application migration. This project uses
managed Supabase PostgreSQL; database-wide maintenance should be coordinated
with Supabase support and carried out in an appropriate maintenance window.

## Read-only diagnostic

Run `supabase/diagnostics/postgres-collation-version.sql` in the SQL Editor
to capture the current recorded/actual versions and inspect collation metadata.
Save the results with the support request.

## Safe remediation workflow

1. Confirm the current database and provider versions using the diagnostic.
2. Open a Supabase support request identifying the project and exact versions.
   Ask Supabase to confirm the platform-side library change and the supported
   maintenance procedure for this managed instance.
3. Take/verify a recent recoverable backup before index maintenance.
4. Have the affected default/named-collation objects reviewed. Rebuild relevant
   indexes/objects as directed by the platform guidance. Consider locks, runtime,
   and write availability before executing any reindex operation.
5. Only after affected objects have been reconciled, refresh the database's
   recorded collation version if instructed and permitted by the managed platform.
6. Rerun the diagnostic. The database recorded version should match the actual
   version. Confirm the startup warning no longer recurs and smoke-test key app
   paths (authentication, book/library reads, key RPCs, and Realtime subscriptions).

## Scope

This procedure addresses collation metadata/index consistency. It does not
establish or fix a frontend deployment outage. Investigate website availability
separately using deployment, API gateway, PostgREST, Auth, Edge Function, and
Realtime logs.
