
SELECT
  t.typname AS domain_name,
  bt.typname AS base_type,
  COALESCE(pg_get_expr(conbin, conrelid), '') AS check_expression,
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_expr(adbin, adrelid) AS default_value
FROM pg_type t
       JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
       JOIN pg_attribute a ON a.atttypid = t.oid
       JOIN pg_class c ON c.oid = a.attrelid
       LEFT JOIN pg_type bt ON t.typbasetype = bt.oid
       LEFT JOIN pg_constraint co ON co.contypid = t.oid
       LEFT JOIN pg_attrdef ad ON ad.adrelid = c.oid AND ad.adnum = a.attnum
WHERE c.relname = ?
  AND a.attname = ?
  AND n.nspname = ?
  AND t.typtype = 'd'
