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
import fsx from 'fs-extra';
import moment from 'moment';
import figlet from 'figlet';
import { pascal } from 'case';
import { rimraf } from 'rimraf';

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
import { renderOut, writeBaseFiles, writeDiagrams, writeRepoFile, writeServerFile } from './writer';
import generateMigrations, { type MigrationConfig } from './migration';
import { generateAssociations, generateInitializer } from './associations';

/**
 * Main function to orchestrate the scaffold generation process.
 * Connects to the database, fetches schema information, and generates
 * models, repositories, and configuration files.
 */
async function run(): Promise<void> {
  console.log(await figlet.text('Posquelize Generator', { font: 'Slant' }));
  // 1️⃣ Configure Knex
  const knex = KnexClient.create();

  const DIR_NAME: string = 'database';

  console.log('Removing leftovers...');
  const ROOT_DIR = FileHelper.rootPath(`dist/custom-scaffold`);
  await rimraf(ROOT_DIR);

  const baseDir = FileHelper.join(ROOT_DIR, `src/${DIR_NAME}`);
  const outputDir = path.normalize(`${baseDir}/models`);

  console.log('Creating directories...');
  fsx.mkdirSync(baseDir, { recursive: true });
  fsx.mkdirSync(outputDir);
  fsx.mkdirSync(FileHelper.join(baseDir, 'base'));
  fsx.mkdirSync(FileHelper.join(baseDir, 'config'));
  fsx.mkdirSync(FileHelper.join(baseDir, 'typings'));
  fsx.mkdirSync(FileHelper.join(baseDir, 'diagrams'));
  fsx.mkdirSync(FileHelper.join(baseDir, 'repositories'));
  fsx.mkdirSync(FileHelper.join(baseDir, 'migrations'));
  fsx.mkdirSync(FileHelper.join(baseDir, 'seeders'));

  const migrationConfig: MigrationConfig = {
    timestamp: moment().toDate(),
    getTime(): number {
      this.timestamp = moment(this.timestamp).add(30, 'seconds').toDate();
      return +moment(this.timestamp).format('YYYYMMDDHHmmss');
    },
    dirname: DIR_NAME,
    outDir: FileHelper.join(baseDir, 'migrations'),
    rootDir: ROOT_DIR,
  };

  console.log('Fetching database information...');
  const [schemas, indexes, relationships, foreignKeys] = await Promise.all([
    DbUtils.getSchemas(knex),
    DbUtils.getIndexes(knex),
    DbUtils.getRelationships(knex),
    DbUtils.getForeignKeys(knex),
  ]);

  let anyModelName: string = undefined;

  writeBaseFiles(baseDir, DIR_NAME);

  const initTplVars = getInitializerTemplateVars();
  const interfacesVar: { text: string } = {
    text: '',
  };

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
        generateInterfaces(columnInfo, modTplVars, interfacesVar, DIR_NAME);
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

      if (modTplVars.typesImport.trim()) {
        modTplVars.typesImport =  sp(0, `import type { %s } from '~/%s/typings/models';\n`, modTplVars.typesImport.replace(/^, /, ''), DIR_NAME);
        modTplVars.typesImport = `\n// types\n` + modTplVars.typesImport;
      }

      // Render and save the model file
      const fileName = FileHelper.join(outputDir, `${modelName}.ts`);
      renderOut('model-template', fileName, { ...modTplVars, dirname: DIR_NAME });
      console.log('Model generated:', fileName);

      if (!anyModelName) {
        anyModelName = modelName;
      }

      // Generate repository file for the model
      writeRepoFile(baseDir, StringHelper.tableToModel(tableName), DIR_NAME);
    }
  }

  renderOut('types/models.d', FileHelper.join(baseDir, 'typings/models.d.ts'), {
    text: interfacesVar.text.replaceAll(`\n\n\n`, `\n\n`),
  });

  writeServerFile(FileHelper.dirname(baseDir), anyModelName, DIR_NAME);
  generateInitializer(relationships, initTplVars);

  const fileName = FileHelper.join(outputDir, 'index.ts');
  renderOut('models-initializer', fileName, initTplVars);
  console.log('Models Initializer generated:', fileName);

  // generate migration files
  await generateMigrations({ knex, schemas, indexes, foreignKeys, config: migrationConfig });

  // generate ERD diagrams
  await writeDiagrams(path.normalize(`${baseDir}/diagrams`));

  process.exit();
}

run();
