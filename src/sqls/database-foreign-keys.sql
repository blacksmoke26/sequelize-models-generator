SELECT
  -- Constraint information
  tc.CONSTRAINT_SCHEMA AS fk_schema,
  tc.CONSTRAINT_NAME AS fk_constraint_name,
  tc.table_schema AS table_schema,
  tc.TABLE_NAME AS TABLE_NAME,
  kcu.COLUMN_NAME AS COLUMN_NAME,
  -- Referenced table information
  ccu.table_schema AS referenced_schema,
  ccu.TABLE_NAME AS referenced_table,
  ccu.COLUMN_NAME AS referenced_column,
  -- Constraint metadata
  tc.constraint_type,
  rc.update_rule,
  rc.delete_rule,
  rc.match_option,
  -- Comments
  pgc.condeferrable AS is_deferrable,
  pgc.condeferred AS is_deferred,
  pgd.description AS constraint_comment,
  -- Column comments (source and target)
  pgd_col_src.description AS source_column_comment,
  pgd_col_tgt.description AS referenced_column_comment,
  -- Table comments (source and target)
  pgd_tbl_src.description AS source_table_comment,
  pgd_tbl_tgt.description AS referenced_table_comment
FROM
  information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.CONSTRAINT_CATALOG = kcu.CONSTRAINT_CATALOG
    AND tc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
    AND tc.CONSTRAINT_NAME = kcu.
      CONSTRAINT_NAME JOIN information_schema.referential_constraints rc ON tc.CONSTRAINT_CATALOG = rc.CONSTRAINT_CATALOG
    AND tc.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
    AND tc.CONSTRAINT_NAME = rc.
      CONSTRAINT_NAME JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_catalog = ccu.CONSTRAINT_CATALOG
    AND rc.unique_constraint_schema = ccu.CONSTRAINT_SCHEMA
    AND rc.unique_constraint_name = ccu.CONSTRAINT_NAME -- Join with pg_constraint for additional metadata
    JOIN pg_constraint pgc ON pgc.conname = tc.CONSTRAINT_NAME
    AND pgc.connamespace = (SELECT OID FROM pg_namespace WHERE nspname = tc.CONSTRAINT_SCHEMA)
    -- Join for constraint comment
    LEFT JOIN pg_description pgd ON pgd.objoid = pgc.OID -- Join for source column comment
    LEFT JOIN pg_description pgd_col_src ON pgd_col_src.objoid = (
    SELECT
      attrelid
    FROM
      pg_attribute
    WHERE
      attrelid = (SELECT OID FROM pg_class WHERE relname = tc.TABLE_NAME AND relnamespace = (SELECT OID FROM pg_namespace WHERE nspname = tc.table_schema))
      AND attname = kcu.COLUMN_NAME
  )
    AND pgd_col_src.objsubid = (
      SELECT
        attnum
      FROM
        pg_attribute
      WHERE
        attrelid = (SELECT OID FROM pg_class WHERE relname = tc.TABLE_NAME AND relnamespace = (SELECT OID FROM pg_namespace WHERE nspname = tc.table_schema))
        AND attname = kcu.COLUMN_NAME
    )
    -- Join for referenced column comment
    LEFT JOIN pg_description pgd_col_tgt ON pgd_col_tgt.objoid = (
    SELECT
      attrelid
    FROM
      pg_attribute
    WHERE
      attrelid = (SELECT OID FROM pg_class WHERE relname = ccu.TABLE_NAME AND relnamespace = (SELECT OID FROM pg_namespace WHERE nspname = ccu.table_schema))
      AND attname = ccu.COLUMN_NAME
  )
    AND pgd_col_tgt.objsubid = (
      SELECT
        attnum
      FROM
        pg_attribute
      WHERE
        attrelid = (SELECT OID FROM pg_class WHERE relname = ccu.TABLE_NAME AND relnamespace = (SELECT OID FROM pg_namespace WHERE nspname = ccu.table_schema))
        AND attname = ccu.COLUMN_NAME
    )
    -- Join for source table comment
    LEFT JOIN pg_description pgd_tbl_src ON pgd_tbl_src.objoid = (SELECT OID FROM pg_class WHERE relname = tc.TABLE_NAME AND relnamespace = (SELECT OID FROM pg_namespace WHERE nspname = tc.table_schema))
    AND pgd_tbl_src.objsubid = 0
    -- Join for referenced table comment
    LEFT JOIN pg_description pgd_tbl_tgt ON pgd_tbl_tgt.objoid = (SELECT OID FROM pg_class WHERE relname = ccu.TABLE_NAME AND relnamespace = (SELECT OID FROM pg_namespace WHERE nspname = ccu.table_schema))
    AND pgd_tbl_tgt.objsubid = 0
WHERE
  tc.constraint_type = 'FOREIGN KEY'
ORDER BY
  tc.table_schema,
  tc.TABLE_NAME,
  kcu.ordinal_position;
