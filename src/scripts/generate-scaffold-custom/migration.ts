/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import fsx from 'fs-extra';

// classes
import DbUtils from '~/classes/DbUtils';
import TableColumns from '~/classes/TableColumns';

// utils
import {
  createFile,
  createFilename,
  generateCreateIndexes,
  generateDomains,
  generateForeignKeys,
  generateFunctions,
  generateRemoveIndexes,
  generateTableInfo,
  generateTriggers,
  generateViews,
  initVariables,
  sleep,
} from './libs/migration.lib';

// types
import type { Knex } from 'knex';
import type { ForeignKey, TableIndex } from '~/typings/utils';

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
  outputDir,
}: {
  knex: Knex;
  schemas: readonly string[];
  indexes: TableIndex[];
  foreignKeys: ForeignKey[];
  outputDir: string;
}): Promise<void> {
  console.log('Cleaning up migrations directory...');
  fsx.emptydirSync(outputDir);

  await generateFunctions(knex, schemas, outputDir);
  await generateDomains(knex, schemas, outputDir);
  await generateTriggers(knex, schemas, outputDir);

  for await (const schemaName of schemas) {
    const schemaTables = await DbUtils.getTables(knex, schemaName);

    for await (const tableName of schemaTables) {
      const tableIndexes = indexes.filter((x) => x.table === tableName && x.schema === schemaName);
      const tableForeignKeys = foreignKeys.filter((x) => x.tableName === tableName && x.schema === schemaName);

      const columnsInfo = await TableColumns.list(knex, tableName, schemaName);
      const variables = initVariables();

      await generateTableInfo({ tableName, columnsInfo, schemaName, tableForeignKeys }, variables);
      generateCreateIndexes(tableIndexes, tableName, schemaName, variables);
      generateRemoveIndexes(tableIndexes, variables);

      const fileName = createFilename(outputDir, `create_${schemaName}_${tableName}_table`);
      console.log('Generated table migration:', fileName);
      createFile(fileName, variables);
    }
  }

  sleep(1000);

  await generateViews(knex, schemas, outputDir);

  const fkVars = initVariables();
  generateForeignKeys(foreignKeys, fkVars);
  const fileName = createFilename(outputDir, `create_create-foreign-keys`);
  console.log('Generated FK migration:', fileName);
  createFile(fileName, fkVars);
}
