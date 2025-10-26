import knex from 'knex';

// types
import type { TableColumnInfo, TableInfo } from '~/typings/knex';

/**
 * Interface for Knex table columns information
 */
export interface KnexTableColumnsInfo {
  [p: string]: {
    type: string;
    maxLength: number | null;
    nullable: boolean;
    defaultValue: string | null;
  };
}

/**
 * Interface for table index information
 */
export interface TableIndex {
  /** The name of the index */
  indexName: string;
  /** The name of the column the index is on */
  columnName: string;
  /** The raw definition of the index from PostgreSQL */
  indexDefinition: string;
  /** Parsed metadata about the index */
  meta: {
    /** The name of the index */
    name: string;
    /** The type of the index (e.g., btree, hash) */
    type: string;
    /** The columns the index is defined on */
    columns: string[];
    /** Whether the index is unique */
    isUnique: boolean;
    /** Whether the index is a primary key index */
    isPrimary: boolean;
  };
}

/**
 * Utility class for database operations specific to PostgreSQL
 */
export default abstract class DatabaseUtils {
  /**
   * Parses a PostgreSQL index definition into a structured record
   * @param indexDefinition - The raw index definition from PostgreSQL
   * @returns Parsed index information
   */
  public static parseIndexDefinition(indexDefinition: string): {
    name: string;
    type: string;
    columns: string[];
    isUnique: boolean;
    isPrimary: boolean;
  } {
    // Extract index name
    const nameMatch = indexDefinition.match(/ON\s+(\w+)\s+USING\s+(\w+)/i);
    const name = nameMatch ? nameMatch[1] : '';

    // Extract index type
    const typeMatch = indexDefinition.match(/USING\s+(\w+)/i);
    const type = typeMatch ? typeMatch[1] : 'btree';

    // Extract columns
    const columnsMatch = indexDefinition.match(/\(([^)]+)\)/);
    const columns = columnsMatch
      ? columnsMatch[1].split(',').map((col) => col.trim().replace(/"/g, ''))
      : [];

    // Check if it's unique
    const isUnique = indexDefinition.includes('UNIQUE');

    // Check if it's primary
    const isPrimary = indexDefinition.includes('PRIMARY KEY');

    return {
      name,
      type,
      columns,
      isUnique,
      isPrimary,
    };
  }

  /**
   * Retrieves all indexes for a specific table in PostgreSQL
   * @param knex - The knex instance
   * @param tableName - The name of the table to get indexes for
   * @returns Promise resolving to an array of index objects
   */
  public static async getTableIndexes(
    knex: knex.Knex,
    tableName: string,
  ): Promise<Array<TableIndex>> {
    const query = `
      SELECT
        i.relname AS index_name,
        a.attname AS column_name,
        pg_get_indexdef(i.oid) AS index_definition
      FROM
        pg_index idx
        JOIN pg_class i ON i.oid = idx.indexrelid
        JOIN pg_class t ON t.oid = idx.indrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(idx.indkey)
      WHERE
        t.relname = ?
        AND n.nspname = current_schema()
      ORDER BY
        i.relname, a.attnum
    `;

    const indexRows: TableIndex[] = [];

    try {
      const { rows = [] } = (await knex.raw(query, [tableName])) as Awaited<{
        rows: Array<{
          index_name: string;
          column_name: string;
          index_definition: string;
        }>;
      }>;

      for (const row of rows) {
        indexRows.push({
          indexName: row.index_name,
          columnName: row.column_name,
          indexDefinition: row.index_definition,
          meta: this.parseIndexDefinition(row.index_definition),
        });
      }

      return indexRows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves the comment for a specific column
   * @param knex - The knex instance
   * @param tableName - The name of the table
   * @param columnName - The name of the column
   * @returns Promise resolving to the column comment or null if not found
   */
  public static async getColumnComment(
    knex: knex.Knex,
    tableName: string,
    columnName: string,
  ): Promise<string | null> {
    const result = await knex.raw(
      `
    SELECT
      col_description(
        (SELECT c.oid
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE c.relname = ? AND n.nspname = current_schema()
        ),
        (SELECT attnum
         FROM pg_attribute
         WHERE attrelid = (
           SELECT c.oid
           FROM pg_class c
           JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE c.relname = ? AND n.nspname = current_schema()
         ) AND attname = ?
        )
      ) as comment
    `,
      [tableName, tableName, columnName],
    );

    return result.rows?.[0]?.comment || null;
  }

  /**
   * Get foreign key relationships for a specific table in PostgreSQL
   * @param knex - The knex instance
   * @param tableName - The name of the table to get associations for
   * @returns Promise resolving to an array of association objects
   */
  public static async getTableAssociations(
    knex: knex.Knex,
    tableName: string,
  ): Promise<
    Array<{
      table_name: string;
      column_name: string;
      foreign_table_name: string;
      foreign_column_name: string;
      constraint_name: string;
    }>
  > {
    const query = `
          SELECT
              kcu.column_name,
              ccu.table_name AS foreign_table_name,
              ccu.column_name AS foreign_column_name,
              tc.constraint_name
          FROM
              information_schema.table_constraints AS tc
              JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
              JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
          WHERE
              tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_name = ?
      `;

    return knex
      .raw(query, [tableName])
      .then((result: { rows: any[] }) => result.rows);
  }

  /**
   * Checks if a column is auto-increment in PostgreSQL
   * @param knex - The knex instance
   * @param tableName - The name of the table
   * @param columnName - The name of the column to check
   * @returns Promise resolving to a boolean indicating if the column is auto-increment
   */
  public static async isAutoIncrementColumn(
    knex: knex.Knex,
    tableName: string,
    columnName: string,
  ): Promise<boolean> {
    try {
      const result = await knex.raw(
        `
      SELECT
        CASE WHEN pg_get_serial_sequence(?, ?) IS NOT NULL THEN true ELSE false END as is_auto_increment
      `,
        [tableName, columnName],
      );

      return result.rows?.[0]?.is_auto_increment === true;
    } catch {
    	return false;
    }
  }

  /**
   * Retrieves all schemas from the database
   * @param knex - The knex instance
   * @returns Promise resolving to an array of schema names
   */
  public static async getSchemas(knex: knex.Knex): Promise<string[]> {
    const query = `
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `;

    const result = (await knex.raw(query)) as Awaited<{
      rows: { schema_name: string }[];
    }>;
    return result.rows
      .map((row: { schema_name: string }) => String(row.schema_name))
      .filter((x) => {
        // return true to remove item from collection
        return !x.includes('_temp');
      });
  }

  /**
   * Retrieves table information from the database
   * @param knex - The knex instance
   * @param columns - Array of column names to retrieve (defaults to empty)
   * @param [schema] - The schema name
   * @returns Promise resolving to an array of TableInfo objects
   */
  public static async getTables(
    knex: knex.Knex,
    columns: (keyof TableInfo | '*')[] = [],
    schema: string = 'public',
  ): Promise<TableInfo[]> {
    columns.push('table_name');

    if (columns.includes('*')) {
      columns = ['*'];
    }
    return knex
      .select(...new Set(columns))
      .from('information_schema.tables')
      .where({ table_schema: schema, table_type: 'BASE TABLE' });
  }

  /**
   * Retrieves column information for a specific table
   * @param knex - The knex instance
   * @param tableName - The name of the table
   * @param columns - Array of column names to retrieve (defaults to empty)
   * @returns Promise resolving to an array of ColumnInfo objects
   */
  public static async getTableColumns(
    knex: knex.Knex,
    tableName: string,
    columns: (keyof TableColumnInfo | '*')[] = [],
  ): Promise<TableColumnInfo[]> {
    columns.push(
      'table_name',
      'column_name',
      'data_type',
      'is_nullable',
      'column_default',
    );

    if (columns.includes('*')) {
      columns = ['*'];
    }

    return knex
      .select(...new Set(columns))
      .from('information_schema.columns')
      .where({ table_name: tableName });
  }

  /**
   * Retrieves the UDT (User-Defined Type) name for a specific column
   * @param knex - The knex instance
   * @param tableName - The name of the table
   * @param columnName - The name of the column
   * @returns Promise resolving to the UDT name or null if not found
   */
  public static async getColumnUdtType(
    knex: knex.Knex,
    tableName: string,
    columnName: string,
  ) {
    const [info]: TableColumnInfo[] = await knex
      .select('udt_name')
      .from('information_schema.columns')
      .where({ table_name: tableName, column_name: columnName });

    if (!info) return null;

    return (
      info?.udt_name
        ?.toString?.()
        ?.trim?.()
        ?.toLowerCase?.()
        ?.replace('_', '') ?? null
    );
  }

  /**
   * Checks if a column is a primary key in a specific table
   * @param knex - The knex instance
   * @param tableName - The name of the table
   * @param columnName - The name of the column to check
   * @returns Promise resolving to a boolean indicating if the column is a primary key
   */
  public static async isPrimaryKeyColumn(
    knex: knex.Knex,
    tableName: string,
    columnName: string,
  ): Promise<boolean> {
    const result = await knex.raw(
      `
      SELECT
        CASE WHEN COUNT(*) > 0 THEN true ELSE false END as is_primary_key
      FROM
        information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name = ccu.constraint_name
      WHERE
        tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_name = ?
        AND ccu.column_name = ?
      `,
      [tableName, columnName],
    );

    return result.rows?.[0]?.is_primary_key === true;
  }

  /**
   * Retrieves column information for a specific table using Knex's columnInfo method
   * @param knex - The knex instance
   * @param tableName - The name of the table
   * @returns Promise resolving to an object containing column information
   */
  public static async getKnexTableColumnsInfo(
    knex: knex.Knex,
    tableName: string,
  ): Promise<KnexTableColumnsInfo> {
    return (await knex
      .table(tableName)
      .columnInfo()) as Awaited<KnexTableColumnsInfo>;
  }

  /**
   * Processes and escapes default values from the database
   * @param value - The raw default value from the database
   * @returns The processed default value
   */
  public static escapeDefaultValue(value: string): string {
    let defaultValueString = String(value);
    if (defaultValueString.includes('::')) {
      defaultValueString = defaultValueString.replace(/::.+$/i, '');
    }

    if (defaultValueString === 'CURRENT_TIMESTAMP') {
      defaultValueString = 'null';
    } else if (defaultValueString.toUpperCase().includes('ARRAY')) {
      defaultValueString = '[]';
    } else if (defaultValueString.toUpperCase().includes('NULL')) {
      defaultValueString = 'null';
    } else if (defaultValueString.startsWith('nextval')) {
      defaultValueString = '';
    }

    return defaultValueString.replace(/^'/, '').replace(/'$/, '');
  }
}
