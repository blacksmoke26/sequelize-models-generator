SELECT
  t.typname as "typeName",
  array_agg(a.attname ORDER BY a.attnum) as "attributeNames",
  array_agg(format_type(a.atttypid, a.atttypmod) ORDER BY a.attnum) as "attributeTypes"
FROM pg_type t
       JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
       JOIN pg_attribute a ON a.attrelid = t.typrelid
       JOIN pg_class c ON c.relname = ?
       JOIN pg_attribute ca ON ca.attrelid = c.oid AND ca.attname = ?
WHERE t.typtype = 'c'
  AND n.nspname = ?
  AND t.oid = ca.atttypid
GROUP BY t.typname
