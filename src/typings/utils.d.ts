/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import { RelationshipType } from '~/classes/DbUtils';

// types
import type { TableColumnInfo } from '~/typings/knex';

/**
 * Interface representing a relationship between two database tables.
 */
export interface Relationship {
  /** Type of relationship (e.g., BelongsTo, HasOne) */
  type: RelationshipType;
  /** Source table information (the "many" side in most cases) */
  source: {
    /** Database schema name */
    schema: string;
    /** Table name */
    table: string;
    /** Column name that participates in the relationship */
    column: string;
  };
  /** Target table information (the "one" side in most cases) */
  target: {
    /** Database schema name */
    schema: string;
    /** Table name */
    table: string;
    /** Column name that participates in the relationship */
    column: string;
  };
  /** Junction table information for ManyToMany relationships */
  junction: {
    /** Database schema name of the junction table (null for non-ManyToMany) */
    schema: string | null;
    /** Junction table name (null for non-ManyToMany) */
    table: string | null;
  };
}

/**
 * Interface representing detailed information about a table column.
 */
export interface TableColumnType {
  /** Constraint type (e.g., PRIMARY KEY) */
  readonly constraint: string | null;
  /** Column name */
  readonly name: string | null;
  /** Default value for the column */
  readonly defaultValue: string | null;
  /** Whether the column can be null */
  readonly nullable: boolean;
  /** Data type of the column */
  readonly type: string;
  /** Special attributes (e.g., enum values) */
  readonly special: string | null;
  /** Column comment */
  readonly comment: string | null;
}

/**
 * Interface representing element types of a table column.
 */
export interface TableElementType {
  /** Column name */
  readonly columnName: string;
  /** Data type in lowercase */
  readonly dataType: string;
  /** User-defined type name */
  readonly udtName: string;
  /** Element type for array columns */
  readonly elementType: string | null;
  /** Whether the column is an enum type */
  readonly isEnum: boolean;
  /** Enum values if applicable */
  readonly enumData: string[] | null;
  /** Whether the column is a domain type */
  readonly isDomain: boolean;
  /** Domain information if applicable */
  readonly domainData: DomainTypeData | null;
  /** Whether the column is a composite type */
  readonly isComposite: boolean;
  /** Composite information if applicable */
  readonly compositeData: CompositeTypeData | null;
}

/**
 * Interface representing index information for a database table.
 */
export interface TableIndex {
  /** Database schema name */
  schema: string;
  /** Table name */
  table: string;
  /** Index name */
  name: string;
  /** Type of index (e.g., btree, gin, hash) */
  type: 'btree' | 'gin' | 'hash' | 'gist' | 'spgist' | 'brin' | 'bloom';
  /** Type of constraint (PRIMARY KEY, UNIQUE, or INDEX) */
  constraint: 'PRIMARY KEY' | 'UNIQUE' | 'INDEX';
  /** Array of column names included in the index */
  columns: string[];
  /** Index comment if any */
  comment: string | null;
}

/**
 * Interface representing detailed information about a foreign key constraint in a database.
 */
export interface ForeignKey {
  /** Database schema name where the foreign key is defined */
  schema: string;
  /** Name of the foreign key constraint */
  constraintName: string;
  /** Comment associated with the foreign key constraint */
  comment: null | string;
  /** Schema name of the table containing the foreign key */
  tableSchema: string;
  /** Name of the table containing the foreign key */
  tableName: string;
  /** Name of the column that references another table */
  columnName: string;
  /** Default value of the column */
  defaultValue: string | null;
  /** Information about the referenced (target) table and column */
  referenced: {
    /** Schema name of the referenced table */
    schema: string | null;
    /** Name of the referenced table */
    table: string | null;
    /** Name of the referenced column */
    column: string | null;
    /** Comment on the referenced column */
    columnComment: string | null;
    /** Comment on the referenced table */
    tableComment: string | null;
  };
  /** Information about the source (current) table and column */
  source: {
    /** Comment on the source column */
    columnComment: string | null;
    /** Comment on the source table */
    tableComment: string | null;
  };
  /** Rules for update and delete operations */
  rule: {
    /** Action to perform on update */
    update: 'RESTRICT' | 'NO ACTION' | 'CASCADE' | 'SET NULL' | 'SET DEFAULT';
    /** Action to perform on delete */
    delete: 'RESTRICT' | 'NO ACTION' | 'CASCADE' | 'SET NULL' | 'SET DEFAULT';
  };
  /** Match option for the foreign key (typically 'NONE' or other match types) */
  matchOption: 'NONE' | string;
  /** Whether the foreign key constraint is deferrable */
  isDeferrable: boolean;
  /** Whether the foreign key constraint is initially deferred */
  isDeferred: boolean;
}

/**
 * Interface representing geographic/geometry column types.
 */
export interface TableGeoType {
  /** Column name */
  readonly columnName: string;
  /** User-defined type name */
  readonly udtName: string;
  /** SRID value */
  readonly dataType: string;
  /** Coordinate dimension */
  readonly elementType: string;
}

/**
 * Interface representing exclusive table information, including column details, element types, and additional info.
 */
export interface ExclusiveColumnInfo {
  /** Name of the table. */
  name: string;
  /** Detailed information about the column. */
  column: TableColumnType;
  /** Element type information for the column. */
  element: TableElementType;
  /** Additional information about the column, such as constraints or comments. */
  info: TableColumnInfo;
}

/**
 * Interface representing composite type data for a table column.
 */
export interface CompositeTypeData {
  /** Name of the composite type */
  typeName: string;
  /** Array of attribute names in the composite type */
  attributeNames: string;
  /** Array of attribute types in the composite type */
  attributeTypes: string;
}

/**
 * Interface representing domain type data for a table column.
 */
export interface DomainTypeData {
  /** Name of the domain type */
  domainName: string;
  /** Base type of the domain */
  baseType: string;
  /** Array of constraints applied to the domain */
  constraints: Array<{
    /** Name of the constraint */
    name: string;
    /** Check expression for the constraint */
    checkExpression?: string;
    /** Whether the constraint enforces not null */
    notNull?: boolean;
    /** Default value for the constraint */
    default?: string;
  }>;
}
