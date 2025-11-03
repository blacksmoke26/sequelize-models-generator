SELECT
  n.nspname AS "schema",
  c.relname AS "table",
  t.tgname AS "name",
  CASE
    WHEN (t.tgtype & 2) <> 0 THEN 'BEFORE'
    WHEN (t.tgtype & 4) <> 0 THEN 'AFTER'
    WHEN (t.tgtype & 64) <> 0 THEN 'INSTEAD OF'
    END AS "timing",
  CASE
    WHEN (t.tgtype & 66) = 66 THEN 'UPDATE'
    WHEN (t.tgtype & 20) = 20 THEN 'DELETE'
    WHEN (t.tgtype & 28) = 28 THEN 'TRUNCATE'
    WHEN (t.tgtype & 18) = 18 THEN 'INSERT'
    ELSE (
      CASE WHEN (t.tgtype & 16) <> 0 THEN 'INSERT ' ELSE '' END ||
      CASE WHEN (t.tgtype & 8) <> 0 THEN 'DELETE ' ELSE '' END ||
      CASE WHEN (t.tgtype & 4) <> 0 THEN 'UPDATE ' ELSE '' END ||
      CASE WHEN (t.tgtype & 64) <> 0 THEN 'TRUNCATE' ELSE '' END
      )
    END AS "event",
  p.pronamespace::regnamespace AS "functionSchema",
  p.proname AS "functionName",
  t.tgenabled AS "enabledStatus",
  t.tgconstraint <> 0 AS "isConstraintTrigger",
  pg_get_triggerdef(t.oid, true) AS definition
FROM
  pg_trigger t
    JOIN
  pg_class c ON c.oid = t.tgrelid
    JOIN
  pg_namespace n ON n.oid = c.relnamespace
    JOIN
  pg_proc p ON p.oid = t.tgfoid
WHERE
  NOT t.tgisinternal  -- Exclude internally generated triggers (e.g., for foreign keys)
  AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND n.nspname NOT LIKE 'pg_%'
ORDER BY
  n.nspname,
  c.relname,
  t.tgname;
