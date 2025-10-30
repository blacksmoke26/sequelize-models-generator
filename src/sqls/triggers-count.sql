SELECT COUNT(0) AS "triggerCount"
FROM information_schema.triggers AS t
WHERE t.event_object_table = ?
  AND t.event_object_schema = ?
