/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

// types
import type { Knex } from 'knex';
import type { TableColumnInfo } from '~/typings/knex';

// helpers
import FileHelper from '~/helpers/FileHelper';

/**
 * Enum representing the types of constraints that can be applied to a database table.
 */
export enum ConstraintType {
  /** Primary key constraint */
  PrimaryKey = 'PRIMARY KEY',
  /** Foreign key constraint */
  ForeignKey = 'FOREIGN KEY',
  /** Unique constraint */
  Unique = 'UNIQUE',
}

/**
 * Enum representing the types of relationships that can exist between database tables.
 */
export enum RelationshipType {
  /** BelongsTo relationship (many-to-one) */
  BelongsTo = 'BelongsTo',
  /** HasOne relationship (one-to-one) */
  HasOne = 'HasOne',
  /** HasMany relationship (one-to-many) */
  HasMany = 'HasMany',
  /** ManyToMany relationship (many-to-many) */
  ManyToMany = 'ManyToMany',
}

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
    SELECT table_name
    FROM
      information_schema.TABLES
    WHERE
      table_type = 'BASE TABLE'
      AND table_schema = ?`;

    const { rows = [] } = await knex.raw<{
      rows: { table_name: string }[];
    }>(query, [schemaName]);

    return rows.map((x) => x.table_name);
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
    const query = FileHelper.readSqlFile('composite-type-data.sql');

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
    const query = FileHelper.readSqlFile('domain-type-data.sql');

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
    const query = FileHelper.readSqlFile('table-column-types.sql');

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
    const query = FileHelper.readSqlFile('table-element-types.sql');

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
    const query = FileHelper.readSqlFile('table-indexes.sql');

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
    const query = FileHelper.readSqlFile('triggers-count.sql');
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
    let query = FileHelper.readSqlFile('table-constraints.sql');

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
   * Retrieves relationship information between database tables.
   * @param knex - Knex instance for database connection
   * @returns Promise resolving to an array of relationship information
   */
  public static async getRelationships(knex: Knex): Promise<Relationship[]> {
    const query = FileHelper.readSqlFile('database-relationships.sql');

    const relations: Relationship[] = [];

    try {
      const { rows = [] } = await knex.raw<{
        rows: {
          source_schema: string;
          source_table: string;
          source_column: string;
          target_schema: string;
          target_table: string;
          target_column: string;
          relationship_type: string;
          junction_schema: string | null;
          junction_table: string | null;
        }[];
      }>(query);

      for (const row of rows) {
        relations.push({
          type: RelationshipType[row.relationship_type],
          source: {
            schema: row.source_schema,
            table: row.source_table,
            column: row.source_column,
          },
          target: {
            schema: row.target_schema,
            table: row.target_table,
            column: row.target_column,
          },
          junction: { schema: row.junction_schema, table: row.junction_table },
        });
      }

      return relations;
    } catch {
      return [];
    }
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
    const query = FileHelper.readSqlFile('table-geography-types.sql');

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
      const query = FileHelper.readSqlFile('table-geometry-types.sql');

      const { rows = [] } = await knex.raw<{
        rows: TableGeoType[];
      }>(query, [tableName, schemaName]);

      return rows;
    } catch {
      return [];
    }
  }
}
