/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import { DataTypes } from 'sequelize';

/**
 * Represents all supported Sequelize data types.
 */
export type SequelizeType =
  | 'ABSTRACT'
  | 'STRING'
  | 'CHAR'
  | 'TEXT'
  | 'NUMBER'
  | 'TINYINT'
  | 'SMALLINT'
  | 'MEDIUMINT'
  | 'INTEGER'
  | 'BIGINT'
  | 'FLOAT'
  | 'REAL'
  | 'DOUBLE'
  | 'DECIMAL'
  | 'BOOLEAN'
  | 'TIME'
  | 'DATE'
  | 'DATEONLY'
  | 'HSTORE'
  | 'JSON'
  | 'JSONB'
  | 'NOW'
  | 'BLOB'
  | 'RANGE'
  | 'UUID'
  | 'UUIDV1'
  | 'UUIDV4'
  | 'VIRTUAL'
  | 'ENUM'
  | 'ARRAY'
  | 'GEOMETRY'
  | 'GEOGRAPHY'
  | 'CIDR'
  | 'INET'
  | 'MACADDR'
  | 'CITEXT'
  | 'TSVECTOR';

/**
 * Maps PostgreSQL data types to their corresponding Sequelize DataTypes objects.
 */
export const PostTypesMap = {
  // Numeric types
  smallint: DataTypes.SMALLINT,
  integer: DataTypes.INTEGER, // 'INTEGER',
  bigint: DataTypes.BIGINT,
  decimal: DataTypes.DECIMAL,
  numeric: DataTypes.DECIMAL, // numeric is synonymous with decimal in PostgreSQL
  real: DataTypes.REAL,
  double: DataTypes.DOUBLE,
  'double precision': DataTypes.DOUBLE,
  serial: DataTypes.INTEGER, // serial is auto-incrementing integer
  bigserial: DataTypes.BIGINT, // bigserial is auto-incrementing bigint

  // Character types
  char: DataTypes.CHAR,
  character: DataTypes.CHAR,
  varchar: DataTypes.STRING,
  'character varying': DataTypes.STRING,
  text: DataTypes.TEXT,
  citext: DataTypes.CITEXT,

  // Boolean
  boolean: DataTypes.BOOLEAN,

  // Date/Time
  date: DataTypes.DATEONLY,
  time: DataTypes.TIME,
  'time without time zone': DataTypes.TIME,
  'time with time zone': DataTypes.TIME,
  timestamp: DataTypes.DATE,
  'timestamp without time zone': DataTypes.DATE,
  'timestamp with time zone': DataTypes.DATE,

  // UUID
  uuid: DataTypes.UUID,

  // JSON
  json: DataTypes.JSON,
  jsonb: DataTypes.JSONB,

  // Binary
  bytea: DataTypes.BLOB,

  // Enum (mapped generically; actual enum values must be defined separately)
  enum: DataTypes.ENUM, // Note: PostgreSQL enums require explicit values in Sequelize

  // Geometric, network, etc. (not directly supported by Sequelize — map to STRING or custom)
  inet: DataTypes.INET, // IP address
  cidr: DataTypes.CIDR,
  macaddr: DataTypes.MACADDR,
  interval: DataTypes.STRING, // or custom type

  // Array
  array: DataTypes.ARRAY,

  // Geometric types
  point: DataTypes.GEOMETRY('POINT'),
  line: DataTypes.GEOMETRY,
  lseg: DataTypes.GEOMETRY,
  box: DataTypes.GEOMETRY,
  path: DataTypes.GEOMETRY,
  polygon: DataTypes.GEOMETRY('POLYGON'),
  circle: DataTypes.GEOMETRY,

  // Money
  money: DataTypes.DECIMAL,

  // XML
  xml: DataTypes.TEXT,

  // TSVector
  tsvector: DataTypes.STRING,

  // User-defined types
  'user-defined': DataTypes.JSON, // Default for user-defined types (composite, domain)
  composite: DataTypes.JSON,
  domain: DataTypes.STRING,
} as const;

/**
 * Maps PostgreSQL data types to their corresponding Sequelize type strings.
 */
export const TypesMap = {
  // Numeric types
  int2: 'SMALLINT',
  int4: 'INTEGER',
  int8: 'BIGINT',
  smallint: 'SMALLINT',
  integer: 'INTEGER', // 'INTEGER',
  bigint: 'BIGINT',
  decimal: 'DECIMAL',
  numeric: 'DECIMAL', // numeric is synonymous with decimal in PostgreSQL
  num: 'DECIMAL', // numeric is synonymous with decimal in PostgreSQL
  real: 'REAL',
  double: 'DOUBLE',
  'double precision': 'DOUBLE',
  serial: 'INTEGER', // serial is auto-incrementing integer
  bigserial: 'BIGINT', // bigserial is auto-incrementing bigint

  // Character types
  char: 'CHAR',
  character: 'CHAR',
  varchar: 'STRING',
  bit: 'STRING',
  varbit: 'STRING',
  'character varying': 'STRING',
  'bit varying': 'STRING',
  text: 'TEXT',
  citext: 'CITEXT',

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
  inet: 'INET', // IP address
  cidr: 'CIDR',
  macaddr: 'MACADDR',
  interval: 'STRING', // or custom type

  // Array
  array: DataTypes.ARRAY,

  // Geometric types
  point: `GEOMETRY('POINT')`,
  line: 'GEOMETRY',
  lseg: 'GEOMETRY',
  box: 'GEOMETRY',
  path: 'GEOMETRY',
  polygon: `GEOMETRY('POLYGON')`,
  circle: 'GEOMETRY',

  // Money
  money: 'DECIMAL',

  // XML
  xml: 'TEXT',

  // TSVector
  tsvector: 'STRING',

  // User-defined types
  'user-defined': 'JSON', // Default for user-defined types (composite, domain)
  composite: 'JSON',
  domain: 'STRING',
} as const;
