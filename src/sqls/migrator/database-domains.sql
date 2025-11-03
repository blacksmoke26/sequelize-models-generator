SELECT
  n.nspname AS domain_schema,
  t.typname AS domain_name,
  pg_type.typname AS base_type,
  -- Reconstruct the full domain definition
  FORMAT (
    'CREATE DOMAIN %I AS %s%s%s%s;',
    t.typname,
    pg_type.typname,
    CASE
      WHEN t.typnotnull THEN
        ' NOT NULL'
      ELSE
        ''
      END,
    CASE
      WHEN t.typdefault IS NOT NULL THEN
        FORMAT (' DEFAULT %L', t.typdefault)
      ELSE
        ''
      END,
    COALESCE (
      (
        SELECT
          string_agg (FORMAT (' CONSTRAINT %I CHECK (%s)', con.conname, pg_get_expr (con.conbin, con.conrelid)), ' ')
        FROM
          pg_constraint con
        WHERE
          con.contypid = t.OID
      ),
      ''
    )
  ) AS domain_definition
FROM
  pg_type t
    JOIN pg_namespace n ON n.OID = t.typnamespace
    JOIN pg_type pg_type ON pg_type.OID = t.typbasetype
WHERE
  t.typtype = 'd' -- 'd' = domain
  AND n.nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY
  n.nspname,
  t.typname;
