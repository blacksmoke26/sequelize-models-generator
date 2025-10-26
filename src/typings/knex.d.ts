export interface TableInfo {
  readonly table_catalog: string;
  readonly table_schema: string;
  readonly table_name: string;
  readonly table_type: string;
  readonly self_referencing_column_name: any;
  readonly reference_generation: any;
  readonly user_defined_type_catalog: any;
  readonly user_defined_type_schema: any;
  readonly user_defined_type_name: any;
  readonly is_insertable_into: string;
  readonly is_typed: string;
  readonly commit_action: any;
}

export interface TableColumnInfo {
  readonly table_catalog: string;
  readonly table_schema: string;
  readonly table_name: string;
  readonly column_name: string;
  readonly ordinal_position: number;
  readonly column_default: string;
  readonly is_nullable: 'YES' | 'NO';
  readonly data_type: string;
  readonly character_maximum_length: string | null;
  readonly character_octet_length: string | null;
  readonly numeric_precision: string | null;
  readonly numeric_precision_radix: string | null;
  readonly numeric_scale: string | null;
  readonly datetime_precision: string | null;
  readonly interval_type: string | null;
  readonly interval_precision: string | null;
  readonly character_set_catalog: string | null;
  readonly character_set_schema: string | null;
  readonly character_set_name: string | null;
  readonly collation_catalog: string | null;
  readonly collation_schema: string | null;
  readonly collation_name: string | null;
  readonly domain_catalog: string | null;
  readonly domain_schema: string | null;
  readonly domain_name: string | null;
  readonly udt_catalog: string;
  readonly udt_schema: string;
  readonly udt_name: string;
  readonly scope_catalog: string | null;
  readonly scope_schema: string | null;
  readonly scope_name: string | null;
  readonly maximum_cardinality: string | null;
  readonly dtd_identifier: string;
  readonly is_self_referencing: 'YES' | 'NO';
  readonly is_identity: 'YES' | 'NO';
  readonly identity_generation: string | null;
  readonly identity_start: string | null;
  readonly identity_increment: string | null;
  readonly identity_maximum: string | null;
  readonly identity_minimum: string | null;
  readonly identity_cycle: 'YES' | 'NO';
  readonly is_generated: 'NEVER' | string;
  readonly generation_expression: string | null;
  readonly is_updatable: 'YES' | 'NO';
}

export type PostgresToTypeScript = {
  // Numeric types
  'smallint': number;          // int2
  'integer': number;           // int4
  'bigint': string;            // int8 – often represented as string to avoid precision loss
  'decimal': string;           // numeric – arbitrary precision, usually kept as string
  'numeric': string;
  'real': number;              // float4
  'double precision': number;  // float8

  // Serial types (auto-incrementing integers)
  'smallserial': number;       // serial2
  'serial': number;            // serial4
  'bigserial': string;         // serial8

  // Character types
  'char': string;              // char(n)
  'character': string;
  'varchar': string;           // varchar(n)
  'character varying': string;
  'text': string;

  // Boolean
  'boolean': boolean;

  // Date/Time types
  'date': string;              // ISO 8601 date string (e.g., "2025-10-23")
  'time': string;              // e.g., "14:30:00"
  'time without time zone': string;
  'time with time zone': string;
  'timestamp': string;         // e.g., "2025-10-23T14:30:00"
  'timestamp without time zone': string;
  'timestamp with time zone': string; // e.g., "2025-10-23T14:30:00Z"
  'timestamptz': string;

  // Interval
  'interval': string;          // e.g., "1 day 2 hours"

  // UUID
  'uuid': string;

  // JSON types
  'json': any;                 // or unknown for stricter typing
  'jsonb': any;

  // Binary data
  'bytea': Buffer | string;    // often base64-encoded string or Buffer in Node.js

  // Network address types (often represented as strings)
  'inet': string;
  'cidr': string;
  'macaddr': string;

  // Geometric types (usually handled as strings or custom types)
  'point': string;
  'line': string;
  'lseg': string;
  'box': string;
  'path': string;
  'polygon': string;
  'circle': string;

  // Arrays – represented as arrays of the base type
  'integer[]': number[];
  'text[]': string[];
  'boolean[]': boolean[];
  // Note: For full support, you'd need a more dynamic mapping or codegen

  // Enum types – typically strings
  // (custom enums would map to string or a union of literals if known)

  // Other / fallback
  'unknown': unknown;
};
