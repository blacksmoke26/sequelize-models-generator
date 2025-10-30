SELECT
  n.nspname AS schema_name,
  t.relname AS table_name,
  i.relname AS index_name,
  am.amname AS index_type,
  CASE
    WHEN ix.indisprimary THEN 'PRIMARY KEY'
    WHEN ix.indisunique THEN 'UNIQUE'
    ELSE 'INDEX'
    END AS constraint_type,
  STRING_AGG(a.attname, ', ' ORDER BY array_position(ix.indkey, a.attnum)) AS columns
FROM pg_class t
       JOIN pg_index ix ON t.oid = ix.indrelid
       JOIN pg_class i ON i.oid = ix.indexrelid
       JOIN pg_namespace n ON n.oid = t.relnamespace
       JOIN pg_am am ON am.oid = i.relam
       JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
WHERE n.nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
GROUP BY
  n.nspname,
  t.relname,
  i.relname,
  am.amname,
  ix.indisprimary,
  ix.indisunique
ORDER BY
  n.nspname,
  t.relname,
  constraint_type DESC,  -- PRIMARY KEY first, then UNIQUE, then regular INDEX
  i.relname;
