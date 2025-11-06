-- This SQL query retrieves information about composite types in PostgreSQL,
-- including their schema, name, parameters, and full definition.
SELECT
  n.nspname AS "schema",
  t.typname AS "name",
  STRING_AGG(
    a.attname || ' ' || format_type(a.atttypid, a.atttypmod),
    ', '
    ORDER BY a.attnum
  ) AS "params",
  'CREATE TYPE ' ||
  quote_ident(t.typname) ||
  ' AS (' ||
  STRING_AGG(
    quote_ident(a.attname) || ' ' || format_type(a.atttypid, a.atttypmod),
    ', '
    ORDER BY a.attnum
  ) ||
  ');' AS "definition"
FROM
  pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    JOIN pg_class c ON t.typrelid = c.oid
    JOIN pg_attribute a ON a.attrelid = c.oid
WHERE
  t.typtype = 'c'                    -- composite type
  AND c.relkind = 'c'                -- must match composite type in pg_class
  AND a.attnum > 0                   -- skip system columns
  AND NOT a.attisdropped             -- exclude dropped columns
GROUP BY
  n.nspname,
  t.typname,
  t.oid
ORDER BY
  n.nspname,
  t.typname;
