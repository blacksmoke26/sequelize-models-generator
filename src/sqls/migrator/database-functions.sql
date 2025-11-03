SELECT
  n.nspname AS "schema",
  p.proname AS "name",
  pg_get_function_identity_arguments (p.OID) AS arguments,
  pg_get_function_result (p.OID) AS "returnType",
  l.lanname AS "language",
  CASE
    WHEN p.provolatile = 'i' THEN
      'Immutable'
    WHEN p.provolatile = 's' THEN
      'Stable'
    WHEN p.provolatile = 'v' THEN
      'Volatile'
  END AS volatility,
  p.prosecdef AS "isSecurityDefiner",
  pg_get_functiondef (p.OID) AS definition
FROM
  pg_proc p
  INNER JOIN pg_namespace n ON p.pronamespace = n.
  OID INNER JOIN pg_language l ON p.prolang = l.OID
WHERE
  n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND n.nspname NOT LIKE'pg_%'
ORDER BY
  "schema",
  "name";
