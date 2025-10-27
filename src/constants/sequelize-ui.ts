/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @see https://github.com/blacksmoke26
 * @copyright 2025 Junaid Atari
 */

/**
 * Enum representing standardized data types for database columns.
 */
export enum DataTypeType {
  String = 'STRING',
  Text = 'TEXT',
  CiText = 'CITEXT',
  Integer = 'INTEGER',
  BigInt = 'BIGINT',
  SmallInt = 'SMALLINT',
  Float = 'FLOAT',
  Real = 'REAL',
  Double = 'DOUBLE',
  Decimal = 'DECIMAL',
  DateTime = 'DATE_TIME',
  Date = 'DATE',
  Time = 'TIME',
  Boolean = 'BOOLEAN',
  Enum = 'ENUM',
  Array = 'ARRAY',
  Json = 'JSON',
  JsonB = 'JSONB',
  Blob = 'BLOB',
  Uuid = 'UUID',
}

/**
 * Mapping of PostgreSQL data types to standardized DataTypeType enum values.
 * @see https://www.postgresql.org/docs/current/datatype.html
 */
const typeMap: Record<string, DataTypeType> = {
  // Numeric types
  smallint: DataTypeType.SmallInt,
  integer: DataTypeType.Integer,
  bigint: DataTypeType.BigInt, // BigInt in JS, but often handled as string to avoid precision loss
  decimal: DataTypeType.Decimal, // Often represented as string to preserve precision
  numeric: DataTypeType.Decimal, // Same as decimal
  real: DataTypeType.Real,
  'double precision': DataTypeType.Double,
  serial: DataTypeType.String,
  bigserial: DataTypeType.String,

  // Monetary types
  money: DataTypeType.String, // Usually handled as string to avoid floating point issues

  // Character types
  'character varying': DataTypeType.String,
  varchar: DataTypeType.String,
  character: DataTypeType.String,
  char: DataTypeType.String,
  text: DataTypeType.String,

  // Binary data
  bytea: DataTypeType.Blob, // Node.js Buffer or Uint8Array in browsers

  // Date/Time types
  date: DataTypeType.Date,
  time: DataTypeType.Time, // or string, depending on precision needs
  'time without time zone': DataTypeType.Time,
  'time with time zone': DataTypeType.Time,
  timestamp: DataTypeType.DateTime,
  'timestamp without time zone': DataTypeType.DateTime,
  'timestamp with time zone': DataTypeType.DateTime,
  timestamptz: DataTypeType.DateTime,
  interval: DataTypeType.String, // Complex duration, often kept as string

  // Boolean
  boolean: DataTypeType.Boolean,
  bool: DataTypeType.Boolean,

  // Geometric types (usually handled as strings or custom objects)
  point: DataTypeType.Blob,
  line: DataTypeType.Blob,
  lseg: DataTypeType.Blob,
  box: DataTypeType.Blob,
  path: DataTypeType.Blob,
  polygon: DataTypeType.Blob,
  circle: DataTypeType.Blob,

  // Network address types
  cidr: DataTypeType.String,
  inet: DataTypeType.String,
  macaddr: DataTypeType.String,
  macaddr8: DataTypeType.String,

  // Bit string types
  bit: DataTypeType.String,
  'bit varying': DataTypeType.String,
  varbit: DataTypeType.String,

  // Text search types
  tsvector: DataTypeType.String,
  tsquery: DataTypeType.String,

  // UUID
  uuid: DataTypeType.Uuid,

  // XML and JSON
  xml: DataTypeType.String,
  json: DataTypeType.Json,
  jsonb: DataTypeType.JsonB,

  // Arrays (handled as arrays of the base type)
  array: DataTypeType.Array,
  'integer[]': DataTypeType.Array,
  'text[]': DataTypeType.Array,
  'boolean[]': DataTypeType.Array,
  // Note: Generic array handling would require parsing

  // Object identifier types
  oid: DataTypeType.Integer,
  regproc: DataTypeType.String,
  regprocedure: DataTypeType.String,
  regoper: DataTypeType.String,
  regoperator: DataTypeType.String,
  regclass: DataTypeType.String,
  regtype: DataTypeType.String,
  regconfig: DataTypeType.String,
  regdictionary: DataTypeType.String,

  // Range types (usually handled as objects or strings)
  int4range: DataTypeType.String,
  int8range: DataTypeType.String,
  numrange: DataTypeType.String,
  tsrange: DataTypeType.String,
  tstzrange: DataTypeType.String,
  daterange: DataTypeType.String,

  // Default fallback
  default: DataTypeType.String,
} as const;

/**
 * Converts a PostgreSQL data type string to its corresponding DataTypeType enum value.
 * @param pgType - The PostgreSQL data type string.
 * @returns The corresponding DataTypeType enum value. Defaults to DataTypeType.String if not found.
 */
export const toTypeFromPostgresType = (pgType: string): DataTypeType => {
  return typeMap[pgType] ?? DataTypeType.String;
};

/**
 * Checks if a given PostgreSQL data type string represents a date/time column.
 * @param type - The PostgreSQL data type string to check.
 * @returns True if the type is a date/time type, false otherwise.
 */
export const isDateTimeColumn = (type: string) =>
  [
    'date',
    'time',
    'time without time zone',
    'time with time zone',
    'timestamp',
    'timestamp without time zone',
    'timestamp with time zone',
    'timestamptz',
  ].includes(type);
