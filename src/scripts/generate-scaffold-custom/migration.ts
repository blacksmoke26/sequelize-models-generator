/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import fsx from 'fs-extra';

// classes
import DbUtils from '~/classes/DbUtils';
import TableColumns from '~/classes/TableColumns';

// helpers
import FileHelper from '~/helpers/FileHelper';

// utils
import {
  createFile,
  createFilename,
  generateComposites,
  generateDomains,
  generateForeignKeys,
  generateFunctions,
  generateIndexes,
  generateTableInfo,
  generateTriggers,
  generateViews,
  initVariables,
} from './libs/migration.lib';
import { renderOut } from './writer';

// types
import type { Knex } from 'knex';
import type { ForeignKey, TableIndex } from '~/typings/utils';

/**
 * Configuration interface for migration generation.
 */
export interface MigrationConfig {
  /** The directory name where the migration is being processed */
  dirname: string;
  /** The output directory where migration files will be generated */
  outDir: string;
  /** The root directory of the project */
  rootDir: string;
  /** The timestamp for the migration generation */
  timestamp: Date;
  /** Function to get the timestamp as a number */
  getTime(): number;
}

/**
 * Generates migration files for the given database schemas, including tables, indexes, foreign keys,
 * and other schema objects. This function processes each schema and its tables, creating separate
 * migration files for tables, views, functions, triggers, domains, and foreign keys.
 *
 * @param {Object} params - The parameters for generating migrations.
 * @param {Knex} params.knex - The Knex instance used for database operations.
 * @param {readonly string[]} params.schemas - An array of schema names to process.
 * @param {TableIndex[]} params.indexes - An array of table indexes to include in the migrations.
 * @param {ForeignKey[]} params.foreignKeys - An array of foreign key constraints to include in the migrations.
 * @param {string} params.outputDir - The directory where migration files will be generated.
 *
 * @returns {Promise<void>} A promise that resolves when all migration files have been generated.
 *
 * @example
 * ```typescript
 * await generateMigrations({
 *   knex,
 *   schemas: ['public', 'auth'],
 *   indexes: tableIndexes,
 *   foreignKeys: foreignKeyConstraints,
 *   outputDir: './migrations'
 * });
 * ```
 */
export default async function generateMigrations({
  knex,
  schemas,
  indexes,
  foreignKeys,
  config,
}: {
  knex: Knex;
  schemas: readonly string[];
  indexes: TableIndex[];
  foreignKeys: ForeignKey[];
  config: MigrationConfig;
}): Promise<void> {
  // Clean up the migrations directory to ensure a fresh start
  console.log('Cleaning up migrations directory...');
  fsx.emptydirSync(config.outDir);

  // Generate migrations for database-level objects: functions, composites, domains, and triggers
  await generateFunctions(knex, schemas, config);
  await generateComposites(knex, schemas, config);
  await generateDomains(knex, schemas, config);

  // Process each schema and generate migrations for its tables
  for await (const schemaName of schemas) {
    const schemaTables = await DbUtils.getTables(knex, schemaName);

    // For each table in the schema, generate its migration file
    for await (const tableName of schemaTables) {
      // Filter indexes and foreign keys specific to this table
      //const tableIndexes = indexes.filter((x) => x.table === tableName && x.schema === schemaName);
      const tableForeignKeys = foreignKeys.filter((x) => x.tableName === tableName && x.schema === schemaName);

      // Get column information for the table
      const columnsInfo = await TableColumns.list(knex, tableName, schemaName);
      const variables = initVariables();

      // Generate the main table structure, indexes, and related constraints
      await generateTableInfo({ tableName, columnsInfo, schemaName, tableForeignKeys }, variables);

      // Create and save the migration file for this table
      const fileName = createFilename(config.outDir, `create_${schemaName}_${tableName}_table`, config.getTime());
      console.log('Generated table migration:', fileName);
      createFile(fileName, variables);
    }
  }

  // Generate migrations for database views
  await generateIndexes(indexes, config);

  // Generate a separate migration for all foreign key constraints
  const fkVars = initVariables();
  generateForeignKeys(foreignKeys, fkVars);
  const fileName = createFilename(config.outDir, `create_create-foreign-keys`, config.getTime());
  console.log('Generated FK migration:', fileName);
  createFile(fileName, fkVars);

  await generateViews(knex, schemas, config);
  await generateTriggers(knex, schemas, config);

  // seeders init
  const seedFile = createFilename(FileHelper.join(config.outDir, '../seeders'), 'add_init_records', config.getTime())
  renderOut('seeder-init', seedFile);
}
