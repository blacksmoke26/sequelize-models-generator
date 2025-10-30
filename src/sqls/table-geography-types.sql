
SELECT
  f_geography_column AS "columnName",
  TYPE AS "udtName",
  srid AS "dataType",
  coord_dimension AS "elementType"
FROM
  geography_columns
WHERE
  f_table_name = ?
  AND f_table_schema = ?
