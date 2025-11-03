SELECT
  n.nspname AS schema_name,
  c.relname AS object_name,
  CASE c.relkind
    WHEN 'v' THEN 'View'
    WHEN 'm' THEN 'MaterializedView'
    ELSE c.relkind::text
    END AS object_type,
  pg_get_userbyid(c.relowner) AS owner,
  CASE c.relkind
    WHEN 'v' THEN pg_get_viewdef(c.oid, true)
    WHEN 'm' THEN pg_get_viewdef(c.oid, true)
    ELSE NULL
    END AS definition,
  obj_description(c.oid, 'pg_class') AS comment,
  -- Creation time is not natively tracked; placeholder note
  'Not tracked by default in PostgreSQL' AS creation_time_note,
  -- Approximate access stats (limited for materialized views)
  COALESCE(s.seq_tup_read, 0) + COALESCE(s.idx_tup_fetch, 0) AS estimated_access_count,
  -- For materialized views: size and refresh info
  CASE
    WHEN c.relkind = 'm' THEN pg_size_pretty(pg_total_relation_size(c.oid))
    ELSE NULL
    END AS matview_size,
  -- Last autoanalyze/autovacuum may hint at recent usage (not refresh time)
  CASE
    WHEN c.relkind = 'm' THEN s.last_autovacuum::text
    ELSE NULL
    END AS last_vacuum_or_analyze
FROM
  pg_class c
    JOIN
  pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN
  pg_stat_user_tables s
  ON s.relname = c.relname AND s.schemaname = n.nspname
WHERE
  c.relkind IN ('v', 'm')  -- 'v' = view, 'm' = materialized view
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY
  n.nspname,
  c.relkind,  -- views first, then materialized
  c.relname;
