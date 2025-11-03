/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import { pascalCase } from 'change-case';

// helpers
import FileHelper from '~/helpers/FileHelper';

// types
import type { Knex } from 'knex';
import type { DbDomain, DbFunction, DbTrigger, DbView } from '~/typings/migrator';

/**
 * Enum representing the types of database views.
 */
export enum ViewType {
  /** Materialized view type */
  MaterializedView = 'MATERIALIZED VIEW',
  /** Standard view type */
  View = 'VIEW',
}

/**
 * Enum representing the volatility types of database functions.
 * Determines how a function's behavior is affected by the database state and transactions.
 */
export enum VolatilityType {
  /** Function cannot modify database state and returns same result for same arguments */
  Immutable = 'IMMUTABLE',
  /** Function cannot modify database state but may return different results for same arguments within a single statement */
  Stable = 'STABLE',
  /** Function can modify database state and may return different results for same arguments */
  Volatile = 'VOLATILE',
}

/**
 * Enum representing the timing of database triggers.
 * Specifies when a trigger should execute in relation to the event that fired it.
 */
export enum TriggerTiming {
  /** Trigger executes before the event occurs */
  Before = 'BEFORE',
  /** Trigger executes after the event occurs */
  After = 'AFTER',
  /** Trigger executes instead of the event */
  InsteadOf = 'INSTEAD OF',
}

/**
 * Enum representing the events that can activate database triggers.
 * Defines the type of operation that will cause a trigger to execute.
 */
export enum TriggerEvent {
  /** Trigger activates on an UPDATE operation */
  Update = 'UPDATE',
  /** Trigger activates on a DELETE operation */
  Delete = 'DELETE',
  /** Trigger activates on a TRUNCATE operation */
  Truncate = 'TRUNCATE',
  /** Trigger activates on an INSERT operation */
  Insert = 'INSERT',
}

/**
 * Utility class for migrating and retrieving database schema information.
 * Provides static methods to fetch views, domains, functions, and triggers from the database.
 * @example
 * ```typescript
 * // Example usage of DbMigrator
 * import DbMigrator from './DbMigrator';
 * import knex from 'knex';
 *
 * const db = knex({ client: 'pg', connection: {...} });
 *
 * // Get all views in the public schema
 * const views = await DbMigrator.getViews(db, 'public');
 *
 * // Get all domains across all schemas
 * const domains = await DbMigrator.getDomains(db);
 *
 * // Get all functions in the public schema
 * const functions = await DbMigrator.getFunctions(db, 'public');
 *
 * // Get all triggers across all schemas
 * const triggers = await DbMigrator.getTriggers(db);
 * ```
 */
export default abstract class DbMigrator {
  /**
   * Retrieves a list of database views from the database.
   * @param knex - Knex instance for database connection
   * @param schemaName - Optional schema name to filter views (defaults to null)
   * @returns Promise resolving to an array of database view information
   * @example
   * ```typescript
   * // Get all views in the public schema
   * const views = await DbUtils.getViews(knex, 'public');
   * console.log(views);
   *
   * // Get all views across all schemas
   * const allViews = await DbUtils.getViews(knex);
   * console.log(allViews);
   * ```
   */
  public static async getViews(knex: Knex, schemaName: string | null = null): Promise<DbView[]> {
    const query = FileHelper.readSqlFile('migrator/database-views.sql');

    try {
      const { rows = [] } = await knex.raw<{
        rows: {
          schema_name: string;
          object_name: string;
          object_type: string;
          owner: string;
          definition: string;
          comment: string | null;
          creation_time_note: string;
          estimated_access_count: number;
          matview_size: string | null;
          last_vacuum_or_analyze: string | null;
        }[];
      }>(query);

      return rows
        .filter((x) => {
          let isSchema: boolean = true;

          if (schemaName) {
            isSchema = x.schema_name === schemaName;
          }

          return isSchema;
        })
        .map(
          (x) =>
            ({
              schema: x.schema_name,
              name: x.object_name,
              type: ViewType[x.object_type] ?? null,
              definition: x.definition.trim(),
              viewSize: x.matview_size,
              comment: x.comment,
              owner: x.owner,
              creationTimeNote: x.creation_time_note,
              estimatedAccessCount: +x.estimated_access_count,
              lastVacuumOrAnalyze: x.last_vacuum_or_analyze,
            }) satisfies DbView,
        );
    } catch {
      return [];
    }
  }

  /**
   * Retrieves a list of database domains from the database.
   * @param knex - Knex instance for database connection
   * @param schemaName - Optional schema name to filter domains (defaults to null)
   * @returns Promise resolving to an array of database domain information
   * @example
   * ```typescript
   * // Get all domains in the public schema
   * const domains = await DbMigrator.getDomains(knex, 'public');
   * console.log(domains);
   *
   * // Get all domains across all schemas
   * const allDomains = await DbMigrator.getDomains(knex);
   * console.log(allDomains);
   * ```
   */
  public static async getDomains(knex: Knex, schemaName: string | null = null): Promise<DbDomain[]> {
    const query = FileHelper.readSqlFile('migrator/database-domains.sql');

    try {
      const { rows = [] } = await knex.raw<{
        rows: {
          domain_schema: string;
          domain_name: string;
          base_type: string;
          domain_definition: string;
        }[];
      }>(query);

      return rows
        .filter((x) => {
          let isSchema: boolean = true;

          if (schemaName) {
            isSchema = x.domain_schema === schemaName;
          }

          return isSchema;
        })
        .map(
          (x) =>
            ({
              schema: x.domain_schema,
              name: x.domain_name,
              baseType: ViewType[x.base_type] ?? null,
              definition: x.domain_definition.trim(),
            }) satisfies DbDomain,
        );
    } catch {
      return [];
    }
  }

  /**
   * Retrieves a list of database functions from the database.
   * @param knex - Knex instance for database connection
   * @param schemaName - Optional schema name to filter functions (defaults to null)
   * @returns Promise resolving to an array of database function information
   * @example
   * ```typescript
   * // Get all functions in the public schema
   * const functions = await DbMigrator.getFunctions(knex, 'public');
   * console.log(functions);
   *
   * // Get all functions across all schemas
   * const allFunctions = await DbMigrator.getFunctions(knex);
   * console.log(allFunctions);
   * ```
   */
  public static async getFunctions(knex: Knex, schemaName: string | null = null): Promise<DbFunction[]> {
    const query = FileHelper.readSqlFile('migrator/database-functions.sql');

    try {
      const { rows = [] } = await knex.raw<{
        rows: DbFunction[];
      }>(query);

      return rows
        .filter((x) => {
          let isSchema: boolean = true;

          if (schemaName) {
            isSchema = x.schema === schemaName;
          }

          return isSchema;
        })
        .map(
          (x) =>
            ({
              schema: x.schema,
              name: x.name,
              arguments: x.arguments,
              returnType: x.returnType,
              language: x.language,
              volatility: VolatilityType[x.volatility],
              isSecurityDefiner: false,
              definition: x.definition.trim(),
            }) satisfies DbFunction,
        );
    } catch {
      return [];
    }
  }

  /**
   * Retrieves a list of database triggers from the database.
   * @param knex - Knex instance for database connection
   * @param schemaName - Optional schema name to filter triggers (defaults to null)
   * @returns Promise resolving to an array of database trigger information
   * @example
   * ```typescript
   * // Get all triggers in the public schema
   * const triggers = await DbMigrator.getTriggers(knex, 'public');
   * console.log(triggers);
   *
   * // Get all triggers across all schemas
   * const allTriggers = await DbMigrator.getTriggers(knex);
   * console.log(allTriggers);
   * ```
   */
  public static async getTriggers(knex: Knex, schemaName: string | null = null): Promise<DbTrigger[]> {
    const query = FileHelper.readSqlFile('migrator/database-triggers.sql');

    try {
      const { rows = [] } = await knex.raw<{
        rows: DbTrigger[];
      }>(query);

      return rows
        .filter((x) => {
          let isSchema: boolean = true;

          if (schemaName) {
            isSchema = x.schema === schemaName;
          }

          return isSchema;
        })
        .map(
          (x) =>
            ({
              schema: x.schema,
              table: x.table,
              name: x.name,
              timing: TriggerTiming[pascalCase(x.timing)],
              event: TriggerEvent[pascalCase(x.event)],
              functionSchema: x.functionSchema,
              functionName: x.functionName,
              enabledStatus: x.enabledStatus,
              isConstraintTrigger: x.isConstraintTrigger,
              definition: x.definition.trim(),
            }) satisfies DbTrigger,
        );
    } catch {
      return [];
    }
  }
}
