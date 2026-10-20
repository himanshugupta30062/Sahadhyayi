-- PostgreSQL collation mismatch diagnostic and safe remediation guide.
--
-- A collation-version mismatch is platform-level maintenance, not an application
-- schema migration. Do not run ALTER DATABASE ... REFRESH COLLATION VERSION until
-- objects that depend on the affected collation have been reviewed/rebuilt.
-- Do not put REINDEX DATABASE into an automated production migration: it can be
-- disruptive and may require elevated privileges/maintenance planning.
--
-- Read-only preflight for the Supabase SQL Editor:
-- 1. Confirm database-level recorded vs actual collation version.
-- 2. List collations whose recorded version differs from the current provider.
-- 3. Inventory indexes that explicitly depend on a named collation. A zero-row
--    result is not proof that there are no collation-dependent indexes: default
--    collation dependencies can be represented differently by PostgreSQL.
--
-- Run this diagnostic file manually in the SQL Editor; do not treat it as an
-- automated migration that resolves the mismatch.

SELECT
  d.datname AS database_name,
  d.datcollversion AS recorded_database_collation_version,
  pg_database_collation_actual_version(d.oid) AS actual_database_collation_version,
  d.datcollversion IS DISTINCT FROM pg_database_collation_actual_version(d.oid)
    AS has_collation_version_mismatch
FROM pg_database AS d
WHERE d.datname = current_database();

SELECT
  c.oid::regcollation AS collation,
  c.collname AS collation_name,
  c.collprovider AS provider,
  c.collversion AS recorded_collation_version,
  pg_collation_actual_version(c.oid) AS actual_collation_version
FROM pg_collation AS c
WHERE c.collversion IS DISTINCT FROM pg_collation_actual_version(c.oid)
ORDER BY c.collname;

SELECT
  ns.nspname AS schema_name,
  tbl.relname AS table_name,
  idx.relname AS index_name,
  pg_get_indexdef(i.indexrelid) AS index_definition,
  i.indisvalid AS is_valid,
  i.indisready AS is_ready
FROM pg_index AS i
JOIN pg_class AS idx ON idx.oid = i.indexrelid
JOIN pg_class AS tbl ON tbl.oid = i.indrelid
JOIN pg_namespace AS ns ON ns.oid = tbl.relnamespace
WHERE EXISTS (
  SELECT 1
  FROM pg_depend AS dep
  JOIN pg_collation AS coll ON coll.oid = dep.refobjid
  WHERE dep.classid = 'pg_class'::regclass
    AND dep.objid = i.indexrelid
    AND dep.refclassid = 'pg_collation'::regclass
    AND coll.collname = 'default'
)
ORDER BY ns.nspname, tbl.relname, idx.relname;
