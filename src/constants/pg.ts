
export const pgJsTypesMap: Record<string, string> = {
  // Integer types
  int2: 'number',
  int4: 'number',
  int8: 'string',
  integer: 'number', // int2
  smallint: 'number', // int4
  int: 'number',
  bigint: 'string', // int8 – often represented as string to avoid precision loss

  // Precision types
  double: 'number',
  'double precision': 'number',  // float8
  real: 'number', // float4
  float4: 'number',
  float: 'number',
  float8: 'number',
  numeric: 'string',
  decimal: 'string', // numeric – arbitrary precision, usually kept as string

  // Serial types (auto-incrementing integers)
  smallserial: 'number', // serial2
  serial: 'number', // serial4
  bigserial: 'string',  // serial8

  // Common string types
  character: 'string',
  'character varying': 'string',
  uuid: 'string',
  text: 'string',
  varchar: 'string', // varchar(n)
  char: 'string', // char(n)
  bpchar: 'string',
  citext: 'string',
  name: 'string',

  // Bool types
  bit: 'boolean',
  bool: 'boolean',
  boolean: 'boolean',

  // Dates and times
  date: 'Date', // ISO 8601 date string (e.g., "2025-10-23")
  timestamp: 'Date', // e.g., "2025-10-23T14:30:00"
  'timestamp with time zone': 'string', // e.g., "2025-10-23T14:30:00Z"
  'timestamp without time zone': 'string',
  timestamptz: 'Date',
  time: 'Date', // e.g., "14:30:00"
  'time with time zone': 'string',
  'time without time zone': 'string',
  timetz: 'Date',
  interval: 'string',

  // Network address types (often represented as strings)
  inet: 'string',
  cidr: 'string',
  macaddr: 'string',
  macaddr8: 'string',

  // Extra types
  money: 'string',
  tsvector: 'string',
  void: 'undefined',

  // JSON types
  json: 'object',
  jsonb: 'object',

  // Bytes / Binary data
  bytea: 'Buffer | string',

  // Geometric types (usually handled as strings or custom types)
  point: 'string',
  line: 'string',
  lseg: 'string',
  box: 'string',
  path: 'string',
  polygon: 'string',
  circle: 'string',

  // Arrays – represented as arrays of the base type
  array: 'Array<unknown>',
  'integer[]': 'number[]',
  'text[]': 'string[]',
  'boolean[]': 'boolean[]',
  // Note: For full support, you'd need a more dynamic mapping or codegen

  // Enum types – typically strings
  // (custom enums would map to string or a union of literals if known)

  // Other / fallback
  unknown: 'unknown',
};

/**
 * Map PostgreSQL data types to Sequelize DataTypes.
 */
export const pgSequelizeTypeMap: Record<string, string> = {
  integer: 'DataTypes.INTEGER',
  smallint: 'DataTypes.INTEGER',
  bigint: 'DataTypes.BIGINT',
  decimal: 'DataTypes.DECIMAL',
  numeric: 'DataTypes.DECIMAL',
  real: 'DataTypes.FLOAT',
  double: 'DataTypes.DOUBLE',
  serial: 'DataTypes.INTEGER',
  bigserial: 'DataTypes.BIGINT',
  money: 'DataTypes.DECIMAL',
  varchar: 'DataTypes.STRING',
  character: 'DataTypes.STRING',
  text: 'DataTypes.TEXT',
  boolean: 'DataTypes.BOOLEAN',
  date: 'DataTypes.DATEONLY',
  timestamp: 'DataTypes.DATE',
  timestamptz: 'DataTypes.DATE',
  time: 'DataTypes.TIME',
  timetz: 'DataTypes.TIME',
  json: 'DataTypes.JSON',
  jsonb: 'DataTypes.JSONB',
  bytea: 'DataTypes.BLOB',
  uuid: 'DataTypes.UUID',
  // add more mappings as needed
};

export const sequelizeTypeMap: { [key: number]: string } = {
  20: 'BIGINT', // int8
  21: 'SMALLINT', // int2
  23: 'INTEGER', // int4
  700: 'FLOAT', // float4
  701: 'DOUBLE', // float8
  1043: 'STRING', // varchar
  1082: 'DATEONLY', // date
  1114: 'DATE', // timestamp
  1184: 'DATE', // timestamptz
  16: 'BOOLEAN', // bool
  17: 'BLOB', // bytea
  1083: 'DATE', // time
  1266: 'DATE', // timetz
  1700: 'DECIMAL', // numeric
  2950: 'UUID', // uuid
  114: 'JSON', // json
  3802: 'JSONB', // jsonb
  600: 'GEOMETRY', // point
  601: 'GEOMETRY', // lseg
  602: 'GEOMETRY', // path
  603: 'GEOMETRY', // box
  604: 'GEOMETRY', // polygon
  718: 'GEOMETRY', // circle
};

/**
 * PostgreSQL type IDs mapped to their corresponding data type names.
 */
export const postgresTypeNames: Record<number, string> = {
  20: 'int8',
  21: 'int2',
  23: 'int4',
  700: 'float4',
  701: 'float8',
  1043: 'varchar',
  1082: 'date',
  1114: 'timestamp',
  1184: 'timestamptz',
  16: 'bool',
  17: 'bytea',
  1083: 'time',
  1266: 'timetz',
  1700: 'numeric',
  2950: 'uuid',
  114: 'json',
  3802: 'jsonb',
  600: 'point',
  601: 'lseg',
  602: 'path',
  603: 'box',
  604: 'polygon',
  718: 'circle',
};

/**
 * Convert a PostgreSQL type ID to its corresponding type name.
 * @param {number} pgTypeID - The PostgreSQL type ID.
 * @returns {string} The corresponding type name, or "unknown" if not found.
 */
export const getPostgresTypeName = (pgTypeID: number): string => {
  return postgresTypeNames[pgTypeID] || 'unknown';
};

/**
 * Map a PostgreSQL type ID to its corresponding Sequelize data type.
 * @param {number} pgTypeID - The PostgreSQL type ID.
 * @returns {string} The corresponding Sequelize data type, or "STRING" as default.
 */
export const mapPostgresToSequelize = (pgTypeID: number): string => {
  return sequelizeTypeMap[pgTypeID] || 'STRING';
};

/**
 * Map PostgreSQL type IDs to their corresponding Sequelize data types.
 * This is used to determine the appropriate Sequelize data type based on PostgreSQL type IDs.
 */
export const convertPostgresType = (value: any, dataTypeID: number): any => {
  // Handle NULL values
  if (value === null || value === undefined) {
    return null;
  }

  // Numeric types
  switch (dataTypeID) {
    case 20: // int8
    case 21: // int2
    case 23: // int4
      return parseInt(value, 10);
    case 700: // float4
    case 701: // float8
      return parseFloat(value);
    case 1700: // numeric
      return parseFloat(value);
  }

  // Boolean type
  if (dataTypeID === 16) {
    return value === 'true' || value === 't' || value === '1';
  }

  // Date/Time types
  switch (dataTypeID) {
    case 1082: // date
      return new Date(value);
    case 1083: // time
    case 1266: // timetz
      return value;
    case 1114: // timestamp
    case 1184: // timestamptz
      return new Date(value);
  }

  // JSON types
  if (dataTypeID === 114 || dataTypeID === 3802) {
    return JSON.parse(value);
  }

  // Array types
  if (dataTypeID === 1007 || dataTypeID === 1008 || dataTypeID === 1009) {
    return JSON.parse(value);
  }

  // String types
  switch (dataTypeID) {
    case 25: // text
    case 1043: // varchar
    case 18: // char
    case 19: // name
      return value;
  }

  // Default case - return as string
  return value;
};

export const pgToSequelize: Record<string, string> = {
  // Numeric types
  smallint: 'SMALLINT',
  integer: 'INTEGER',
  bigint: 'BIGINT',
  decimal: 'DECIMAL',
  numeric: 'DECIMAL', // numeric is synonymous with decimal in PostgreSQL
  real: 'REAL',
  double: 'DOUBLE',
  serial: 'INTEGER', // serial is auto-incrementing integer
  bigserial: 'BIGINT', // bigserial is auto-incrementing bigint

  // Character types
  char: 'CHAR',
  character: 'CHAR',
  varchar: 'STRING',
  'character varying': 'STRING',
  text: 'TEXT',

  // Boolean
  boolean: 'BOOLEAN',

  // Date/Time
  date: 'DATEONLY',
  time: 'TIME',
  'time without time zone': 'TIME',
  'time with time zone': 'TIME',
  timestamp: 'DATE',
  'timestamp without time zone': 'DATE',
  'timestamp with time zone': 'DATE',

  // UUID
  uuid: 'UUID',

  // JSON
  json: 'JSON',
  jsonb: 'JSONB',

  // Binary
  bytea: 'BLOB',

  // Enum (mapped generically; actual enum values must be defined separately)
  enum: 'ENUM', // Note: PostgreSQL enums require explicit values in Sequelize

  // Geometric, network, etc. (not directly supported by Sequelize — map to STRING or custom)
  inet: 'STRING', // IP address
  cidr: 'STRING',
  macaddr: 'STRING',
  interval: 'STRING', // or custom type

  array: 'ARRAY',
};

const postgresToJsType: Record<string, string> = {
  // Numeric types
  smallint: 'number',
  integer: 'number',
  bigint: 'string', // BigInt in JS, but often handled as string to avoid precision loss
  decimal: 'string', // Often represented as string to preserve precision
  numeric: 'string', // Same as decimal
  real: 'number',
  'double precision': 'number',
  serial: 'number',
  bigserial: 'string',

  // Monetary types
  money: 'string', // Usually handled as string to avoid floating point issues

  // Character types
  'character varying': 'string',
  varchar: 'string',
  character: 'string',
  char: 'string',
  text: 'string',

  // Binary data
  bytea: 'Buffer', // Node.js Buffer or Uint8Array in browsers

  // Date/Time types
  date: 'Date',
  time: 'Date', // or string, depending on precision needs
  'time without time zone': 'Date',
  'time with time zone': 'Date',
  timestamp: 'Date',
  'timestamp without time zone': 'Date',
  'timestamp with time zone': 'Date',
  timestamptz: 'Date',
  interval: 'string', // Complex duration, often kept as string

  // Boolean
  boolean: 'boolean',
  bool: 'boolean',

  // Geometric types (usually handled as strings or custom objects)
  point: 'object',
  line: 'object',
  lseg: 'object',
  box: 'object',
  path: 'object',
  polygon: 'object',
  circle: 'object',

  // Network address types
  cidr: 'string',
  inet: 'string',
  macaddr: 'string',
  macaddr8: 'string',

  // Bit string types
  bit: 'string',
  'bit varying': 'string',
  varbit: 'string',

  // Text search types
  tsvector: 'string',
  tsquery: 'string',

  // UUID
  uuid: 'string',

  // XML and JSON
  xml: 'string',
  json: 'object',
  jsonb: 'object',

  // Arrays (handled as arrays of the base type)
  'array': 'Array<unknown>',
  'integer[]': 'Array<number>',
  'text[]': 'Array<string>',
  'boolean[]': 'Array<boolean>',
  // Note: Generic array handling would require parsing

  // Object identifier types
  oid: 'number',
  regproc: 'string',
  regprocedure: 'string',
  regoper: 'string',
  regoperator: 'string',
  regclass: 'string',
  regtype: 'string',
  regconfig: 'string',
  regdictionary: 'string',

  // Range types (usually handled as objects or strings)
  int4range: 'object',
  int8range: 'object',
  numrange: 'object',
  tsrange: 'object',
  tstzrange: 'object',
  daterange: 'object',

  // Default fallback
  default: 'any',
};

/**
 * Map PostgreSQL data types to their corresponding JavaScript/TypeScript types.
 * This provides a comprehensive mapping for various PostgreSQL types including numeric,
 * string, date/time, boolean, and other specialized types.
 *
 * @param postgresType - The PostgreSQL data type as a string.
 * @returns The corresponding JavaScript/TypeScript type as a string.
 * If the PostgreSQL type is not recognized, it defaults to 'any'.
 *
 * @remarks
 * This function is designed to handle a wide range of PostgreSQL data types, including
 * numeric types (e.g., integer, decimal), string types (e.g., varchar, text), date/time
 * types (e.g., date, timestamp), boolean types, and specialized types like JSONB and UUID.
 * It also handles array types by appending '[]' to the corresponding base type.
 * If the PostgreSQL type is not recognized, it defaults to 'any'.
 *
 * @example
 * // Direct mapping lookup
 * console.log(postgresToJsType['integer']); // 'number'
 * console.log(postgresToJsType['text']); // 'string'
 *
 * // Using the helper function (handles edge cases)
 * console.log(getJsType('INTEGER')); // 'number' (case insensitive)
 * console.log(getJsType('varchar(255)')); // 'string'
 * console.log(getJsType('numeric(10,2)')); // 'string'
 * console.log(getJsType('text[]')); // 'Array<string>'
 * console.log(getJsType('unknown_type')); // 'any'
 */
export const getJsType = (postgresType: string): string => {
  const normalizedType = postgresType.toLowerCase().trim();

  // Handle array types generically
  if (normalizedType.endsWith('[]')) {
    const baseType = normalizedType.slice(0, -2);
    const jsBaseType =
      postgresToJsType[baseType] || postgresToJsType['default'];
    return `Array<${jsBaseType}>`;
  }

  // Handle numeric types with precision/scale (e.g., "numeric(10,2)")
  if (
    normalizedType.startsWith('numeric') ||
    normalizedType.startsWith('decimal')
  ) {
    return postgresToJsType['numeric'];
  }

  // Handle character types with length (e.g., "varchar(255)")
  if (
    normalizedType.startsWith('character varying') ||
    normalizedType.startsWith('varchar') ||
    normalizedType.startsWith('character') ||
    normalizedType.startsWith('char')
  ) {
    return 'string';
  }

  return postgresToJsType[normalizedType] || postgresToJsType['default'];
};
