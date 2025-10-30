/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

// types
import type { Knex } from 'knex';
import type { TableColumnInfo } from '~/typings/knex';
import type {
  TableIndex,
  ForeignKey,
  TableGeoType,
  TableElementType,
  TableColumnType,
  CompositeTypeData,
  DomainTypeData,
  ExclusiveColumnInfo,
  Relationship,
} from '~/typings/utils';

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
 * Utility class for database operations providing static methods to query table information.
 */
export default abstract class DbUtils {
  /**
   * Retrieves a list of system schema names from the database.
   * @param knex - Knex instance for database connection
   * @returns Promise resolving to array of system schema names
   */
  public static async getSystemSchemas(knex: Knex): Promise<string[]> {
    const predefined: Awaited<{ nspname: string }[]> = await knex
      .select('nspname')
      .from('pg_namespace')
      .whereRaw('nspowner = CURRENT_USER::REGROLE');

    return predefined.map((x) => x.nspname);
  }

  /**
   * Retrieves a list of schema names (except system schemas) from the database.
   * @param knex - Knex instance for database connection
   * @returns Promise resolving to array of schema names
   */
  public static async getSchemas(knex: Knex): Promise<Readonly<string[]>> {
    const systemSchemas = await this.getSystemSchemas(knex);

    const list: Awaited<{ schema_name: string }[]> = await knex
      .select('schema_name')
      .from('information_schema.schemata')
      .whereNotIn('schema_name', systemSchemas)
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
   * Retrieves foreign key information for database tables.
   * @param knex - Knex instance for database connection
   * @param tableName - Optional table name to filter foreign keys (defaults to null)
   * @param schemaName - Optional schema name to filter foreign keys (defaults to null)
   * @returns Promise resolving to array of foreign key information
   */
  public static async getForeignKeys(knex: Knex, tableName: string = null, schemaName: string | null = null): Promise<ForeignKey[]> {
    const query = FileHelper.readSqlFile('database-foreign-keys.sql');

    try {
      const { rows = [] } = await knex.raw<{
        rows: {
          fk_schema: string;
          fk_constraint_name: string;
          table_schema: string;
          table_name: string;
          column_name: string;
          column_default: string | null;
          referenced_schema: string;
          referenced_table: string;
          referenced_column: string;
          constraint_type: 'FOREIGN KEY';
          update_rule: ForeignKey['rule']['update'];
          delete_rule: ForeignKey['rule']['delete'];
          match_option: ForeignKey['matchOption'];
          is_deferrable: boolean;
          is_deferred: boolean;
          constraint_comment: string | null;
          source_column_comment: string | null;
          referenced_column_comment: string | null;
          source_table_comment: string | null;
          referenced_table_comment: string | null;
        }[];
      }>(query);

      return rows
        .filter((x) => {
          let isSchema: boolean = true;
          let isTable: boolean = true;

          if (schemaName) {
            isSchema = x.table_schema === schemaName;
          }
          if (tableName) {
            isTable = x.table_name === tableName;
          }

          return isSchema && isTable;
        })
        .map(
          (x) =>
            ({
              schema: x.fk_schema,
              constraintName: x.fk_constraint_name,
              comment: x.constraint_comment,
              tableSchema: x.table_schema,
              tableName: x.table_name,
              columnName: x.column_name,
              defaultValue: x.column_default,
              referenced: {
                schema: x.referenced_schema,
                table: x.referenced_table,
                column: x.referenced_column,
                tableComment: x.referenced_table_comment,
                columnComment: x.referenced_column_comment,
              },
              source: {
                tableComment: x.source_table_comment,
                columnComment: x.source_column_comment,
              },
              rule: {
                update: x.update_rule,
                delete: x.delete_rule,
              },
              matchOption: x.match_option,
              isDeferrable: x.is_deferrable,
              isDeferred: x.is_deferred,
            }) satisfies ForeignKey,
        );
    } catch {
      return [];
    }
  }

  /**
   * Retrieves index information for database tables.
   * @param knex - Knex instance for database connection
   * @param tableName - Optional table name to filter indexes (defaults to null)
   * @param schemaName - Optional schema name to filter indexes (defaults to null)
   * @returns Promise resolving to array of table index information
   */
  public static async getIndexes(knex: Knex, tableName: string = null, schemaName: string | null = null): Promise<TableIndex[]> {
    const query = FileHelper.readSqlFile('database-indexes.sql');

    try {
      const { rows = [] } = await knex.raw<{
        rows: {
          schema_name: string;
          table_name: string;
          index_name: string;
          index_type: string;
          constraint_type: string;
          columns: string;
          index_comment: string | null;
        }[];
      }>(query);

      return rows
        .filter((x) => {
          let isSchema: boolean = true;
          let isTable: boolean = true;

          if (schemaName) {
            isSchema = x.schema_name === schemaName;
          }
          if (tableName) {
            isTable = x.table_name === tableName;
          }

          return isSchema && isTable;
        })
        .map(
          (x) =>
            ({
              schema: x.schema_name,
              table: x.table_name,
              name: x.index_name,
              type: x.index_type as TableIndex['type'],
              constraint: x.constraint_type as TableIndex['constraint'],
              columns: x.columns.split(','),
              comment: x.index_comment,
            }) satisfies TableIndex,
        );
    } catch {
      return [];
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
