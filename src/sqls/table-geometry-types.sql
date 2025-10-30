
SELECT
  f_geometry_column AS "columnName",
  TYPE AS "udtName",
  srid AS "dataType",
  coord_dimension AS "elementType"
FROM
  geometry_columns
WHERE
  f_table_name = ?
  AND f_table_schema = ?
