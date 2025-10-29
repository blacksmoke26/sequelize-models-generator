/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import pgStructure, { Action, Db, Options, RelationType } from 'pg-structure';

// helpers
import EnvHelper from '~/helpers/EnvHelper';

/**
 * Interface representing the structure information of a database relation.
 */
export interface RelationInfo {
  /** The type of relation (e.g., one-to-one, one-to-many) */
  type: RelationType;
  /** Whether the relation is to many records */
  toMany: boolean;
  /** Whether the parent record is mandatory */
  mandatoryParent: boolean;
  /** The target table's full name (schema.table) */
  targetTable: string;
  /** The name of the foreign key constraint */
  name: string;
  /** Optional comment for the relation */
  comment: string | null;
  /** The column name involved in the relation */
  column: string;
  /** Action to perform on parent update */
  onUpdate: Action;
  /** Action to perform on parent delete */
  onDelete: Action;
}

/**
 * Abstract class for database structure operations.
 * Provides methods to create a database client and retrieve table relations.
 */
export default abstract class StructureUtils {
  private static client: Db;

  /**
   * Creates a database client using pg-structure.
   * @param [options] - Additional options for pg-structure.
   * @returns Promise<Db> - A promise that resolves to a Db instance.
   */
  public static async getClient(options: Options = {}): Promise<Db> {
    if (this.client) {
      return this.client;
    }

    const { host, username: user, password, name: database } = EnvHelper.getDbConfig();
    return pgStructure(
      { host, database, user, password },
      {
        includeSystemSchemas: true,
        ...options,
      },
    );
  }

  /**
   * Retrieves all relations for a given table name.
   * @param tableName - The name of the table to get relations for
   * @returns Promise<RelationInfo[]> - Array of relation information objects
   */
  public static async getTableRelations(tableName: string): Promise<RelationInfo[]> {
    const client = await this.getClient();
    const relations: RelationInfo[] = [];

    // Iterate through all schemas in the database client
    for (const schema of client.schemas) {
      // Iterate through all tables in each schema
      for (const table of schema.tables) {
        // Skip tables that don't match the requested table name
        if (tableName !== table.name) continue;

        // Process all relations for the matching table
        for (const relation of table.relations) {
          // Extract relation properties and foreign key information
          const { type, toMany, foreignKey } = relation;
          // Get the names of all columns involved in the foreign key
          const columns = foreignKey.columns.map((x) => x.name);

          // Add the relation information to our results array
          relations.push({
            type,
            toMany,
            name: foreignKey.name,
            mandatoryParent: foreignKey.mandatoryParent,
            targetTable: foreignKey.table.fullName,
            column: columns[0],
            comment: foreignKey?.comment ?? null,
            onUpdate: foreignKey.onUpdate,
            onDelete: foreignKey.onDelete,
          });
        }
      }
    }

    return relations;
  }
}
