# Query Performance Optimizations

The application issues metadata queries against the Supabase/PostgREST API.
These can be expensive when repeated frequently. To minimise the overhead we
adopt the following strategies:

1. **Client side caching** – React Query is configured with a five minute
   `staleTime` and ten minute `cacheTime` so that identical requests reuse
   cached results instead of re-fetching from the server.
2. **Early filtering** – When new queries are added, apply schema filters as
   early as possible within any CTEs to limit the amount of data processed.
3. **Execution plan analysis** – Use `EXPLAIN ANALYZE` on new or slow queries to
   ensure indexes are used efficiently and avoid unnecessary sequential scans.
4. **Simplify subqueries** – Consolidate repeated lookups and avoid redundant
   JSON conversions in SQL whenever possible.
5. **Stored procedures and materialized views** – For complex metadata
   generation create stored procedures or materialized views that can be
   refreshed periodically instead of executing large catalog queries for every
   request.

These approaches reduce database load and improve response times when working
with Supabase.
