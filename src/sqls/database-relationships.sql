WITH fk_info AS (
  SELECT
    tc.table_schema AS source_schema,
    tc.table_name AS source_table,
    kcu.column_name AS source_column,
    ccu.table_schema AS target_schema,
    ccu.table_name AS target_table,
    ccu.column_name AS target_column,
    tc.constraint_name
  FROM
    information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
           ON tc.constraint_name = kcu.constraint_name
             AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
           ON ccu.constraint_name = tc.constraint_name
             AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
),

-- HasOne: FK column has a UNIQUE constraint
     unique_fks AS (
       SELECT DISTINCT
         f.source_schema,
         f.source_table,
         f.source_column,
         f.target_schema,
         f.target_table,
         f.target_column
       FROM fk_info f
       WHERE EXISTS (
         SELECT 1
         FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                     ON tc.constraint_name = kcu.constraint_name
         WHERE tc.constraint_type = 'UNIQUE'
           AND tc.table_schema = f.source_schema
           AND tc.table_name = f.source_table
           AND kcu.column_name = f.source_column
       )
     ),

-- Detect junction tables (exactly 2 FKs, no extra non-key columns)
     junction_tables AS (
       SELECT
         tc.table_schema,
         tc.table_name
       FROM information_schema.table_constraints tc
       WHERE tc.constraint_type = 'FOREIGN KEY'
       GROUP BY tc.table_schema, tc.table_name
       HAVING
         COUNT(DISTINCT tc.constraint_name) = 2
          AND NOT EXISTS (
         SELECT 1
         FROM information_schema.columns c
         WHERE c.table_schema = tc.table_schema
           AND c.table_name = tc.table_name
           AND c.column_name NOT IN (
           -- PK columns
           SELECT kcu.column_name
           FROM information_schema.key_column_usage kcu
                  JOIN information_schema.table_constraints tc2
                       ON kcu.constraint_name = tc2.constraint_name
           WHERE tc2.table_schema = tc.table_schema
             AND tc2.table_name = tc.table_name
             AND tc2.constraint_type = 'PRIMARY KEY'
           UNION
           -- FK columns
           SELECT kcu.column_name
           FROM information_schema.key_column_usage kcu
                  JOIN information_schema.table_constraints tc2
                       ON kcu.constraint_name = tc2.constraint_name
           WHERE tc2.table_schema = tc.table_schema
             AND tc2.table_name = tc.table_name
             AND tc2.constraint_type = 'FOREIGN KEY'
         )
       )
     ),

-- ManyToMany relationships
     many_to_many AS (
       SELECT DISTINCT
         f1.target_schema AS source_schema,
         f1.target_table AS source_table,
         f1.target_column AS source_column,
         f2.target_schema AS target_schema,
         f2.target_table AS target_table,
         f2.target_column AS target_column,
         'ManyToMany' AS rel_type,
         f1.source_schema AS junction_schema,
         f1.source_table AS junction_table
       FROM fk_info f1
              JOIN fk_info f2
                   ON f1.source_schema = f2.source_schema
                     AND f1.source_table = f2.source_table
                     AND (f1.target_schema, f1.target_table) < (f2.target_schema, f2.target_table)
       WHERE (f1.source_schema, f1.source_table) IN (
         SELECT table_schema, table_name FROM junction_tables
       )
     ),

-- HasOne
     has_one AS (
       SELECT
         source_schema,
         source_table,
         source_column,
         target_schema,
         target_table,
         target_column,
         'HasOne' AS rel_type,
         NULL::text AS junction_schema,
         NULL::text AS junction_table
       FROM unique_fks
     ),

-- HasMany (non-unique FKs)
     has_many AS (
       SELECT
         f.source_schema,
         f.source_table,
         f.source_column,
         f.target_schema,
         f.target_table,
         f.target_column,
         'HasMany' AS rel_type,
         NULL::text AS junction_schema,
         NULL::text AS junction_table
       FROM fk_info f
       WHERE (f.source_schema, f.source_table, f.source_column, f.target_schema, f.target_table)
               NOT IN (
               SELECT source_schema, source_table, source_column, target_schema, target_table
               FROM unique_fks
             )
     ),

-- BelongsTo = inverse of HasOne and HasMany
     belongs_to AS (
       SELECT
         h.target_schema AS source_schema,
         h.target_table AS source_table,
         h.target_column AS source_column,
         h.source_schema AS target_schema,
         h.source_table AS target_table,
         h.source_column AS target_column,
         'BelongsTo' AS rel_type,
         NULL::text AS junction_schema,
         NULL::text AS junction_table
       FROM has_one h
       UNION ALL
       SELECT
         h.target_schema AS source_schema,
         h.target_table AS source_table,
         h.target_column AS source_column,
         h.source_schema AS target_schema,
         h.source_table AS target_table,
         h.source_column AS target_column,
         'BelongsTo' AS rel_type,
         NULL::text AS junction_schema,
         NULL::text AS junction_table
       FROM has_many h
     )

-- Final union
SELECT
  source_schema,
  source_table,
  source_column,
  target_schema,
  target_table,
  target_column,
  rel_type AS relationship_type,
  junction_schema,
  junction_table
FROM (
       SELECT * FROM has_one
       UNION ALL
       SELECT * FROM has_many
       UNION ALL
       SELECT * FROM belongs_to
     ) AS direct_and_inverse

UNION

SELECT
  source_schema,
  source_table,
  source_column,
  target_schema,
  target_table,
  target_column,
  rel_type AS relationship_type,
  junction_schema,
  junction_table
FROM many_to_many

ORDER BY
  source_schema,
  source_table,
  target_schema,
  target_table,
  relationship_type;
