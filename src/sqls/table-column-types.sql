SELECT
  pk.constraint_type AS "constraint",
  c.COLUMN_NAME AS "name",
  c.column_default AS "defaultValue",
  c.is_nullable::BOOL AS "nullable",
  (CASE WHEN c.udt_name = 'hstore' THEN c.udt_name ELSE c.data_type END) || (CASE WHEN c.character_maximum_length IS NOT NULL THEN '(' || c.character_maximum_length || ')' ELSE'' END) AS "type",
  (
    SELECT
      ARRAY_AGG(e.enumlabel)
    FROM
      pg_catalog.pg_type t
        JOIN pg_catalog.pg_enum e ON t.OID = e.enumtypid
    WHERE
      t.typname = c.udt_name
  ) AS "special",
  (
    SELECT
      pgd.description
    FROM
      pg_catalog.pg_statio_all_tables AS st
        INNER JOIN pg_catalog.pg_description pgd ON (pgd.objoid = st.relid)
    WHERE
      c.ordinal_position = pgd.objsubid
      AND c.TABLE_NAME = st.relname
  ) AS "comment"
FROM
  information_schema.COLUMNS c
    LEFT JOIN (
    SELECT
      tc.table_schema,
      tc.TABLE_NAME,
      cu.COLUMN_NAME,
      tc.constraint_type
    FROM
      information_schema.TABLE_CONSTRAINTS tc
        JOIN information_schema.KEY_COLUMN_USAGE cu ON tc.table_schema = cu.table_schema
        AND tc.TABLE_NAME = cu.TABLE_NAME
        AND tc.CONSTRAINT_NAME = cu.CONSTRAINT_NAME
        AND tc.constraint_type = 'PRIMARY KEY'
  ) pk ON pk.table_schema = c.table_schema
    AND pk.TABLE_NAME = c.TABLE_NAME
    AND pk.COLUMN_NAME = c.COLUMN_NAME
WHERE
  c.TABLE_NAME = ?
  AND c.table_schema = ?;
