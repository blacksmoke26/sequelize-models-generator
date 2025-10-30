SELECT
  c.column_name AS "columnName",
  LOWER(c.data_type) AS "dataType",
  c.udt_name AS "udtName",
  e.data_type AS "elementType",
  (
    SELECT
      ARRAY_AGG(pe.enumlabel)
    FROM
      pg_catalog.pg_type pt
        JOIN pg_catalog.pg_enum pe ON pt.OID = pe.enumtypid
    WHERE
      pt.typname = c.udt_name
       OR CONCAT ('_', pt.typname) = c.udt_name
  ) AS "enumData"
FROM
  information_schema.COLUMNS c
    LEFT JOIN information_schema.element_types e ON (
    (c.table_catalog, c.table_schema, c.TABLE_NAME, 'TABLE', c.dtd_identifier) = (e.object_catalog, e.object_schema, e.object_name, e.object_type, e.collection_type_identifier)
    )
WHERE
  c.TABLE_NAME = ?
  AND c.table_schema = ?;
