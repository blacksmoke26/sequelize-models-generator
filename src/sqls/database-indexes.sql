SELECT
  n.nspname AS SCHEMA_NAME,
  t.relname AS TABLE_NAME,
  i.relname AS index_name,
  am.amname AS index_type,
  CASE
    WHEN ix.indisprimary THEN
      'PRIMARY KEY'
    WHEN ix.indisunique THEN
      'UNIQUE'
    ELSE
      'INDEX'
    END AS constraint_type,
  STRING_AGG (a.attname, ', ' ORDER BY array_position (ix.indkey, a.attnum)) AS COLUMNS,
  idx_desc.description AS index_comment -- Index comment
FROM
  pg_class t
    JOIN pg_index ix ON t.OID = ix.indrelid
    JOIN pg_class i ON i.OID = ix.indexrelid
    JOIN pg_namespace n ON n.OID = t.relnamespace
    JOIN pg_am am ON am.OID = i.relam
    JOIN pg_attribute a ON a.attrelid = t.OID
    AND a.attnum = ANY (ix.indkey)
    LEFT JOIN pg_description idx_desc ON idx_desc.objoid = i.OID
    AND idx_desc.objsubid = 0 -- comment on the index itself
WHERE
  n.nspname IN ('public')
  AND a.attnum > 0 -- exclude system columns
GROUP BY
  n.nspname,
  t.relname,
  i.relname,
  am.amname,
  ix.indisprimary,
  ix.indisunique,
  idx_desc.description
ORDER BY
  n.nspname,
  t.relname,
  constraint_type DESC,
  i.relname;
