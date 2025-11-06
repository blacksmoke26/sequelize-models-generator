/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 *
 * @fileoverview This script generates TypeScript models, repositories, and associated files
 * based on database schema information. It connects to a database using Knex, fetches
 * schema details, and generates corresponding TypeScript files with proper types,
 * relationships, and configurations.
 */

import 'dotenv/config';

import path from 'node:path';
import figlet from 'figlet';
import fsx from 'fs-extra';
import { pascal } from 'case';

// classes
import DbUtils from '~/classes/DbUtils';
import KnexClient from '~/classes/KnexClient';
import TableColumns from '~/classes/TableColumns';

// helpers
import FileHelper from '~/helpers/FileHelper';
import StringHelper from '~/helpers/StringHelper';

// utils
import {
  generateAttributes,
  generateEnums,
  generateFields,
  generateIndexes,
  generateInterfaces,
  generateOptions,
  generateRelationsImports,
  getInitializerTemplateVars,
  getModelTemplateVars,
  sp,
} from './utils';
import { renderOut, writeBaseFiles, writeDiagrams, writeRepoFile } from './writer';
import generateMigrations from './migration';
import { generateAssociations, generateInitializer } from './associations';


/**
 * Main function to orchestrate the scaffold generation process.
 * Connects to the database, fetches schema information, and generates
 * models, repositories, and configuration files.
 */
async function run(): Promise<void> {
  console.log(await figlet.text('Sequelize Scaffold App', { font: 'Slant' }));
  // 1️⃣ Configure Knex
  const knex = KnexClient.create();

  const DIR_NAME: string = 'database';

  const baseDir = FileHelper.rootPath(`dist/custom-scaffold/src/${DIR_NAME}`);
  const outputDir = path.normalize(`${baseDir}/models`);

  console.log('Cleaning up target directory...');
  fsx.emptydirSync(baseDir);
  fsx.emptydirSync(outputDir);
  fsx.emptydirSync(FileHelper.join(baseDir, 'base'));
  fsx.emptydirSync(FileHelper.join(baseDir, 'config'));
  fsx.emptydirSync(FileHelper.join(baseDir, 'diagrams'));
  fsx.emptydirSync(FileHelper.join(baseDir, 'repositories'));
  fsx.emptydirSync(FileHelper.join(baseDir, 'migrations'));
  fsx.emptydirSync(FileHelper.join(baseDir, 'seeders'));
  console.log('Target directories cleaned!');

  console.log('Fetching database information...');
  const schemas = await DbUtils.getSchemas(knex);
  const indexes = await DbUtils.getIndexes(knex);
  const relationships = await DbUtils.getRelationships(knex);
  const foreignKeys = await DbUtils.getForeignKeys(knex);

  writeBaseFiles(baseDir, DIR_NAME);

  const initTplVars = getInitializerTemplateVars();

  // Iterate through all database schemas
  for (const schemaName of schemas) {
    // Get all tables for the current schema
    const schemaTables = await DbUtils.getTables(knex, schemaName);

    // Process each table asynchronously
    for await (const tableName of schemaTables) {
      // Filter relationships for the current table
      const tableRelations = relationships.filter((x) => x.source.table === tableName) ?? [];

      // Convert table name to PascalCase model name
      const modelName = pascal(StringHelper.normalizeSingular(tableName));
      // Filter indexes for the current table
      const tableIndexes = indexes.filter((x) => x.table === tableName && x.schema === schemaName);
      // Filter foreign keys for the current table
      const tableForeignKeys = foreignKeys.filter((x) => x.tableName === tableName && x.schema === schemaName);

      // Add model imports to the initializer template variables
      initTplVars.importClasses += sp(0, `import %s from './%s';\n`, modelName, modelName);
      initTplVars.importTypes += sp(0, `export * from './%s';\n`, modelName);
      initTplVars.exportClasses += sp(2, `%s,\n`, modelName);

      // Get model template variables
      const modTplVars = getModelTemplateVars({
        schemaName,
        modelName,
        tableName,
      });

      // Get column information for the table
      const columnsInfo = await TableColumns.list(knex, tableName, schemaName);

      // Check if table has timestamp columns
      const hasCreatedAt: boolean = columnsInfo.findIndex((x) => /^created(_a|A)t$/.test(x.name)) !== -1;
      const hasUpdatedAt: boolean = columnsInfo.findIndex((x) => /^updated(_a|A)t$/.test(x.name)) !== -1;

      // Process each column
      for (const columnInfo of columnsInfo) {
        // Find relation for the current column
        const relation = tableRelations.find((x) => x.source.column === columnInfo.name) ?? null;

        // Generate various model components
        generateEnums(columnInfo, modTplVars, modelName);
        generateInterfaces(columnInfo, modTplVars);
        generateFields(columnInfo, modTplVars, modelName, {
          targetTable: relation?.target?.table ?? null,
          targetColumn: relation?.target?.column ?? null,
          isFK: relation !== null,
        });

        generateAttributes({ columnInfo, modTplVars, tableForeignKeys });
      }

      // Generate additional model components
      generateRelationsImports(tableRelations, modTplVars);
      generateOptions(modTplVars, { schemaName, tableName, hasCreatedAt, hasUpdatedAt });
      generateIndexes(tableIndexes, modTplVars);
      generateAssociations(tableRelations, modTplVars, tableName);

      // Clean up template variables
      modTplVars.modelsImport = modTplVars.modelsImport.trimEnd();
      modTplVars.fields = modTplVars.fields.trimEnd();
      modTplVars.options = modTplVars.options.trimEnd();
      modTplVars.attributes = modTplVars.attributes.trimEnd();

      // Render and save the model file
      const fileName = FileHelper.join(outputDir, `${modelName}.ts`);
      renderOut('model-template', fileName, modTplVars);
      console.log('Model generated:', fileName);

      // Generate repository file for the model
      writeRepoFile(baseDir, StringHelper.tableToModel(tableName));
    }
  }

  generateInitializer(relationships, initTplVars);

  const fileName = FileHelper.join(outputDir, 'index.ts');
  renderOut('models-initializer', fileName, initTplVars);
  console.log('Models Initializer generated:', fileName);

  // generate migration files
  await generateMigrations({ knex, schemas, indexes, foreignKeys, outputDir: FileHelper.join(baseDir, 'migrations') });

  // generate ERD diagrams
  await writeDiagrams(path.normalize(`${baseDir}/diagrams`));

  process.exit();
}

run();
