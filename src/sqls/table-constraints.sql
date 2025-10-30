SELECT DISTINCT
  tc.constraint_name as "constraintName",
  tc.constraint_type as "constraintType",
  tc.constraint_schema as "sourceSchema",
  tc.table_name as "sourceTable",
  kcu.column_name as "sourceColumn",
  CASE WHEN tc.constraint_type = 'FOREIGN KEY' THEN ccu.constraint_schema ELSE null END AS "targetSchema",
  CASE WHEN tc.constraint_type = 'FOREIGN KEY' THEN ccu.table_name ELSE null END AS "targetTable",
  CASE WHEN tc.constraint_type = 'FOREIGN KEY' THEN ccu.column_name ELSE null END AS "targetColumn",
  co.column_default as "extra",
  co.identity_generation as "generation"
FROM information_schema.table_constraints AS tc
       JOIN information_schema.key_column_usage AS kcu
            ON tc.table_schema = kcu.table_schema AND tc.table_name = kcu.table_name AND tc.constraint_name = kcu.constraint_name
       JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_schema = tc.constraint_schema AND ccu.constraint_name = tc.constraint_name
       JOIN information_schema.columns AS co
            ON co.table_schema = kcu.table_schema AND co.table_name = kcu.table_name AND co.column_name = kcu.column_name
WHERE tc.table_name = ?
  AND tc.table_schema = ?
