/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import type { Knex } from 'knex';
import type { TableColumnInfo } from '~/typings/knex';

/** Types of constraints that can be applied to a table */
export enum ConstraintType {
  PrimaryKey = 'PRIMARY KEY',
  ForeignKey = 'FOREIGN KEY',
  Unique = 'UNIQUE',
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
 * Interface representing index information for a table.
 */
export interface TableIndexInfo {
  /** Index name */
  readonly name: string;
  /** Whether this is a primary key index */
  readonly primary: boolean;
  /** Whether this is a unique index */
  readonly unique: boolean;
  /** Index key string */
  readonly indKey: string;
  /** Array of column indexes */
  readonly columnIndexes: number[];
  /** Array of column names */
  readonly columnNames: string;
  /** Index definition */
  readonly definition: string;
}

/**
 * Interface representing foreign key information.
 */
export interface TableForeignKey {
  /** Name of the constraint */
  readonly constraintName: string | null;
  /** Type of constraint */
  readonly constraintType: ConstraintType;
  /** Source schema name */
  readonly sourceSchema: string | null;
  /** Source table name */
  readonly sourceTable: string | null;
  /** Source column name */
  readonly sourceColumn: string | null;
  /** Target schema name */
  readonly targetSchema: string | null;
  /** Target table name */
  readonly targetTable: string | null;
  /** Target column name */
  readonly targetColumn: string | null;
  /** Extra column information */
  readonly extra: string | null;
  /** Identity generation */
  readonly generation: string | null;
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
  /**
   * Name of the table.
   */
  name: string;
  /**
   * Detailed information about the column.
   */
  column: TableColumnType;
  /**
   * Element type information for the column.
   */
  element: TableElementType;
  /**
   * Additional information about the column, such as constraints or comments.
   */
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

/**
 * Utility class for database operations providing static methods to query table information.
 */
export default abstract class DbUtils {
  /**
   * Retrieves a list of schema names from the database.
   * @param knex - Knex instance for database connection
   * @returns Promise resolving to array of schema names
   */
  public static async getSchemas(knex: Knex): Promise<Readonly<string[]>> {
    const predefined: Awaited<{ nspname: string }[]> = await knex
      .select('nspname')
      .from('pg_namespace')
      .whereRaw('nspowner = CURRENT_USER::REGROLE');

    const list: Awaited<{ schema_name: string }[]> = await knex
      .select('schema_name')
      .from('information_schema.schemata')
      .whereNotIn(
        'schema_name',
        predefined.map((x) => x.nspname),
      )
      .orderBy('schema_name');

    return list.map((x) => x.schema_name);
  }

  /**
   * Retrieves a list of table names from the database.
   * @param knex - Knex instance for database connection
   * @param schemaName - Schema name (defaults to 'public')
   * @returns Promise resolving to array of table names
   */
  public static async getTables(
    knex: Knex,
    schemaName: string = 'public',
  ): Promise<Readonly<string[]>> {
    const query = `
    SELECT name
    FROM
      information_schema.TABLES
    WHERE
      table_type = 'BASE TABLE'
      AND table_schema NOT IN ('pg_catalog', 'information_schema')
      AND TABLE_NAME != 'spatial_ref_sys'
      AND table_schema = ?`;

    const { rows = [] } = await knex.raw<{
      rows: { name: string }[];
    }>(query, [schemaName]);

    return rows.map((x) => x.name);
  }

  /**
   * Retrieves composite type information for a table column.
   * @param knex - Knex instance for database connection
   * @param tableName - Name of the table
   * @param columnName - Name of the column
   * @param schemaName - Schema name (defaults to 'public')
   * @returns Promise resolving to composite type information or null if not found
   */
  public static async getCompositeTypeData(
    knex: Knex,
    tableName: string,
    columnName: string,
    schemaName: string = 'public',
  ): Promise<Readonly<CompositeTypeData | null>> {
    const query = `
      SELECT
        t.typname as "typeName",
        array_agg(a.attname ORDER BY a.attnum) as "attributeNames",
        array_agg(format_type(a.atttypid, a.atttypmod) ORDER BY a.attnum) as "attributeTypes"
      FROM pg_type t
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      JOIN pg_attribute a ON a.attrelid = t.typrelid
      JOIN pg_class c ON c.relname = ?
      JOIN pg_attribute ca ON ca.attrelid = c.oid AND ca.attname = ?
      WHERE t.typtype = 'c'
        AND n.nspname = ?
        AND t.oid = ca.atttypid
      GROUP BY t.typname
    `;

    const { rows = [] } = (await knex.raw(query, [
      tableName,
      columnName,
      schemaName,
    ])) as Awaited<{
      rows: CompositeTypeData[];
    }>;

    return rows?.[0] ?? null;
  }

  /**
   * Retrieves domain type information for a table column.
   * @param knex - Knex instance for database connection
   * @param tableName - Name of the table
   * @param columnName - Name of the column
   * @param schemaName - Schema name (defaults to 'public')
   * @returns Promise resolving to domain type information or null if not found
   */
  public static async getDomainTypeData(
    knex: Knex,
    tableName: string,
    columnName: string,
    schemaName: string = 'public',
  ): Promise<Readonly<DomainTypeData | null>> {
    const query = `
      SELECT
        t.typname AS domain_name,
        bt.typname AS base_type,
        COALESCE(pg_get_expr(conbin, conrelid), '') AS check_expression,
        conname AS constraint_name,
        contype AS constraint_type,
        pg_get_expr(adbin, adrelid) AS default_value
      FROM pg_type t
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      JOIN pg_attribute a ON a.atttypid = t.oid
      JOIN pg_class c ON c.oid = a.attrelid
      LEFT JOIN pg_type bt ON t.typbasetype = bt.oid
      LEFT JOIN pg_constraint co ON co.contypid = t.oid
      LEFT JOIN pg_attrdef ad ON ad.adrelid = c.oid AND ad.adnum = a.attnum
      WHERE c.relname = ?
        AND a.attname = ?
        AND n.nspname = ?
        AND t.typtype = 'd'
    `;

    try {
      const { rows = [] } = await knex.raw(query, [
        tableName,
        columnName,
        schemaName,
      ]);

      if (!rows.length) {
        return null;
      }

      return {
        domainName: rows[0].domain_name,
        baseType: rows[0].base_type,
        constraints: rows.map((row: any) => ({
          name: row.constraint_name,
          checkExpression: row.check_expression || undefined,
          notNull: row.constraint_type === 'n',
          default: row.default_value || undefined,
        })),
      };
    } catch {
      return null;
    }
  }

  /**
   * Retrieves comprehensive information about a table's columns, including types, elements, and additional info.
   * @param knex - The knex instance
   * @param tableName - The name of the table
   * @param schemaName - Schema name (defaults to 'public')
   * @returns Promise resolving to an array of exclusive table information
   */
  public static async getExclusiveTableInfo(
    knex: Knex,
    tableName: string,
    schemaName: string = 'public',
  ): Promise<ExclusiveColumnInfo[]> {
    const [columnTypes, elementTypes, columnsInfo] = await Promise.all([
      this.getTableColumnTypes(knex, tableName, schemaName),
      this.getTableElementTypes(knex, tableName, schemaName),
      this.getTableColumnsInfo(knex, tableName, schemaName),
    ]);

    const list: ExclusiveColumnInfo[] = [];

    for (const column of columnTypes) {
      list.push({
        name: column.name,
        column,
        element: elementTypes.find((x) => x.columnName === column.name)!,
        info: columnsInfo.find((x) => x.column_name === column.name)!,
      });
    }

    return list;
  }

  /**
   * Retrieves detailed columns information for a specific table
   * @param knex - The knex instance
   * @param tableName - The name of the table
   * @param schemaName - Schema name (defaults to 'public')
   * @returns Promise resolving to the column information or null if not found
   */
  public static async getTableColumnsInfo(
    knex: Knex,
    tableName: string,
    schemaName: string = 'public',
  ): Promise<TableColumnInfo[]> {
    return (await knex
      .select('*')
      .from('information_schema.columns')
      .where({ table_name: tableName, table_schema: schemaName })) as Awaited<
      TableColumnInfo[]
    >;
  }

  /**
   * Retrieves detailed column information for a specified table.
   * @param knex - Knex instance for database connection
   * @param tableName - Name of the table to query
   * @param schemaName - Schema name (defaults to 'public')
   * @returns Promise resolving to array of table column details
   */
  public static async getTableColumnTypes(
    knex: Knex,
    tableName: string,
    schemaName: string = 'public',
  ): Promise<Readonly<TableColumnType[]>> {
    const query = `SELECT
  pk.constraint_type AS "constraint",
  c.COLUMN_NAME AS "name",
  c.column_default AS "defaultValue",
  c.is_nullable::BOOL AS "nullable",
  (CASE WHEN c.udt_name = 'hstore' THEN c.udt_name ELSE c.data_type END) || (CASE WHEN c.character_maximum_length IS NOT NULL THEN '(' || c.character_maximum_length || ')' ELSE'' END) AS "type",
  (
    SELECT
      ARRAY_AGG(e.enumlabel)
    FROM
      pg_catalog.pg_type t
      JOIN pg_catalog.pg_enum e ON t.OID = e.enumtypid
    WHERE
      t.typname = c.udt_name
  ) AS "special",
  (
    SELECT
      pgd.description
    FROM
      pg_catalog.pg_statio_all_tables AS st
      INNER JOIN pg_catalog.pg_description pgd ON (pgd.objoid = st.relid)
    WHERE
      c.ordinal_position = pgd.objsubid
      AND c.TABLE_NAME = st.relname
  ) AS "comment"
FROM
  information_schema.COLUMNS c
  LEFT JOIN (
    SELECT
      tc.table_schema,
      tc.TABLE_NAME,
      cu.COLUMN_NAME,
      tc.constraint_type
    FROM
      information_schema.TABLE_CONSTRAINTS tc
      JOIN information_schema.KEY_COLUMN_USAGE cu ON tc.table_schema = cu.table_schema
      AND tc.TABLE_NAME = cu.TABLE_NAME
      AND tc.CONSTRAINT_NAME = cu.CONSTRAINT_NAME
      AND tc.constraint_type = 'PRIMARY KEY'
  ) pk ON pk.table_schema = c.table_schema
  AND pk.TABLE_NAME = c.TABLE_NAME
  AND pk.COLUMN_NAME = c.COLUMN_NAME
WHERE
  c.TABLE_NAME = ?
  AND c.table_schema = ?;`;

    const { rows = [] } = await knex.raw<{
      rows: TableColumnType[];
    }>(query, [tableName, schemaName]);

    return rows;
  }

  /**
   * Retrieves element type information for columns in a specified table.
   * @param knex - Knex instance for database connection
   * @param tableName - Name of the table to query
   * @param schemaName - Schema name (defaults to 'public')
   * @returns Promise resolving to array of table element types
   */
  public static async getTableElementTypes(
    knex: Knex,
    tableName: string,
    schemaName: string = 'public',
  ): Promise<Readonly<TableElementType[]>> {
    const query = `SELECT
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
      AND c.table_schema = ?;`;

    const { rows = [] } = (await knex.raw(query, [
      tableName,
      schemaName,
    ])) as Awaited<{
      rows: TableElementType[];
    }>;

    const finalRows: TableElementType[] = [];

    for await (const row of rows) {
      const [compositeData, domainData] = await Promise.all([
        this.getCompositeTypeData(knex, tableName, row.columnName),
        this.getDomainTypeData(knex, tableName, row.columnName),
      ]);

      const isEnum = row.enumData !== null;

      finalRows.push({
        columnName: row.columnName,
        dataType: row.dataType,
        elementType: row.elementType,
        udtName: row.udtName,
        isEnum,
        enumData: isEnum
          ? String(row.enumData).replace(/[{}]+/g, '').split(',')
          : null,
        isComposite: compositeData !== null,
        compositeData,
        isDomain: domainData !== null,
        domainData,
      });
    }

    return finalRows;
  }

  /**
   * Retrieves index information for a specified table.
   * @param knex - Knex instance for database connection
   * @param tableName - Name of the table to query
   * @param schemaName - Schema name (defaults to 'public')
   * @returns Promise resolving to array of table index information
   */
  public static async getTableIndexes(
    knex: Knex,
    tableName: string,
    schemaName: string = 'public',
  ): Promise<Readonly<TableIndexInfo[]>> {
    const query = `SELECT
      i.relname AS "name",
      ix.indisprimary AS "primary",
      ix.indisunique AS "unique",
      ix.indkey AS "indKey",
      ARRAY_AGG(a.attnum) AS "columnIndexes",
      ARRAY_AGG(a.attname) AS "columnNames",
      pg_get_indexdef (ix.indexrelid) AS "definition"
    FROM
      pg_class t,
      pg_class i,
      pg_index ix,
      pg_attribute a,
      pg_namespace s
    WHERE
      t.OID = ix.indrelid
      AND i.OID = ix.indexrelid
      AND a.attrelid = t.OID
      AND t.relkind = 'r'
      AND t.relname = ?
      AND s.OID = t.relnamespace
      AND s.nspname = ?
    GROUP BY
      i.relname,
      ix.indexrelid,
      ix.indisprimary,
      ix.indisunique,
      ix.indkey
    ORDER BY
      i.relname;`;

    const { rows = [] } = await knex.raw<{
      rows: TableIndexInfo[];
    }>(query, [tableName, schemaName]);

    return rows;
  }

  /**
   * Counts the number of triggers on a specified table.
   * @param knex - Knex instance for database connection
   * @param tableName - Name of the table to query
   * @param schemaName - Schema name (defaults to 'public')
   * @returns Promise resolving to the count of triggers
   */
  public static async getTriggersCount(
    knex: Knex,
    tableName: string,
    schemaName: string = 'public',
  ): Promise<number> {
    const query = `SELECT COUNT(0) AS "triggerCount"
              FROM information_schema.triggers AS t
             WHERE t.event_object_table = ?
                   AND t.event_object_schema = ?`;

    const { rows = [] } = await knex.raw<{
      rows: { trigger_count: string }[];
    }>(query, [tableName, schemaName]);

    return Number(rows?.[0]?.trigger_count ?? 0);
  }

  /**
   * Retrieves constraints information for a specified table.
   * @param knex - Knex instance for database connection
   * @param tableName - Name of the table to query
   * @param [constraintType] - Type of constraint to filter (defaults to null)
   * @param schemaName - Schema name (defaults to 'public')
   * @returns Promise resolving to array of foreign key information
   */
  public static async getTableConstraints(
    knex: Knex,
    tableName: string,
    constraintType: ConstraintType | null = null,
    schemaName: string = 'public',
  ): Promise<Readonly<TableForeignKey[]>> {
    let query = `
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
    `;

    const params = [tableName, schemaName];

    if (constraintType !== null) {
      query += 'AND tc.constraint_type = ?';
      params.push(constraintType);
    }

    const { rows = [] } = await knex.raw<{
      rows: TableForeignKey[];
    }>(query, params);

    return rows;
  }

  /**
   * Retrieves geographic column types for a specified table.
   * @param knex - Knex instance for database connection
   * @param tableName - Name of the table to query
   * @param schemaName - Schema name (defaults to 'public')
   * @returns Promise resolving to array of geographic column types
   */
  public static async getTableGeographyTypes(
    knex: Knex,
    tableName: string,
    schemaName: string = 'public',
  ): Promise<Readonly<TableGeoType[]>> {
    const query = `
    SELECT
      f_geography_column AS "columnName",
      TYPE AS "udtName",
      srid AS "dataType",
      coord_dimension AS "elementType"
    FROM
      geography_columns
    WHERE
      f_table_name = ?
      AND f_table_schema = ?`;

    try {
      const { rows = [] } = await knex.raw<{
        rows: TableGeoType[];
      }>(query, [tableName, schemaName]);
      return rows;
    } catch {
      return [];
    }
  }

  /**
   * Retrieves geometry column types for a specified table.
   * @param knex - Knex instance for database connection
   * @param tableName - Name of the table to query
   * @param schemaName - Schema name (defaults to 'public')
   * @returns Promise resolving to array of geometry column types
   */
  public static async getTableGeometryTypes(
    knex: Knex,
    tableName: string,
    schemaName: string = 'public',
  ): Promise<Readonly<TableGeoType[]>> {
    try {
      const query = `
      SELECT
        f_geometry_column AS "columnName",
        TYPE AS "udtName",
        srid AS "dataType",
        coord_dimension AS "elementType"
      FROM
        geometry_columns
      WHERE
        f_table_name = ?
        AND f_table_schema = ?`;

      const { rows = [] } = await knex.raw<{
        rows: TableGeoType[];
      }>(query, [tableName, schemaName]);

      return rows;
    } catch {
      return [];
    }
  }
}
