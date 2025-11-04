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
import KnexClient from '~/classes/KnexClient';
import TableColumns from '~/classes/TableColumns';

// helpers
import FileHelper from '~/helpers/FileHelper';
import StringHelper from '~/helpers/StringHelper';
import NunjucksHelper from '~/helpers/NunjucksHelper';

// utils
import DbUtils from '~/classes/DbUtils';
import {
  generateAssociations,
  generateAttributes,
  generateEnums,
  generateFields,
  generateIndexes,
  generateInitializer,
  generateInterfaces,
  generateOptions,
  generateRelationsImports,
  getInitializerTemplateVars,
  getModelTemplateVars,
  sp,
} from './utils';
import generateMigrations from '~/scripts/generate-scaffold-custom/migration';
import EnvHelper from '~/helpers/EnvHelper';
import exportDbmlDiagram from '~/scripts/generate-scaffold-custom/dbml';

/**
 * Main function to orchestrate the scaffold generation process.
 * Connects to the database, fetches schema information, and generates
 * models, repositories, and configuration files.
 */
async function run(): Promise<void> {
  console.log(await figlet.text('Generate Scaffold App', { font: 'Slant' }));
  // 1️⃣ Configure Knex
  const knex = KnexClient.create();

  const baseDir = FileHelper.rootPath('dist/custom-scaffold');
  const outputDir = path.normalize(`${baseDir}/models`);

  console.log('Cleaning up target directory...');
  fsx.emptydirSync(outputDir);
  fsx.emptydirSync(path.normalize(`${baseDir}/base`));
  fsx.emptydirSync(path.normalize(`${baseDir}/diagrams`));
  fsx.emptydirSync(path.normalize(`${baseDir}/repositories`));
  fsx.emptydirSync(path.normalize(`${baseDir}/migrations`));
  console.log('Target directories cleaned!');

  console.log('Fetching database information...');
  const schemas = await DbUtils.getSchemas(knex);
  const indexes = await DbUtils.getIndexes(knex);
  const relationships = await DbUtils.getRelationships(knex);
  const foreignKeys = await DbUtils.getForeignKeys(knex);

  writeBaseFiles();

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
      const text = NunjucksHelper.renderFile(__dirname + '/templates/model-template.njk', modTplVars, { autoescape: false });
      const fileName = path.normalize(`${outputDir}/${modelName}.ts`);
      console.log('Model generated:', fileName);
      FileHelper.saveTextToFile(fileName, text);

      // Generate repository file for the model
      writeRepoFile(StringHelper.tableToModel(tableName));
    }
  }

  generateInitializer(relationships, initTplVars);

  const text = NunjucksHelper.renderFile(__dirname + '/templates/models-initializer.njk', initTplVars, { autoescape: false });
  const fileName = path.normalize(`${outputDir}/index.ts`);
  console.log('Models Initializer generated:', fileName);
  FileHelper.saveTextToFile(fileName, text);

  // generate migration files
  await generateMigrations({ knex, schemas, indexes, foreignKeys, outputDir: path.normalize(`${baseDir}/migrations`) });

  // generate ERD diagrams
  await writeDiagrams(path.normalize(`${baseDir}/diagrams`));

  process.exit();
}

/**
 * Writes database diagrams in DBML format and generates a README file.
 * Connects to the database using the connection string from environment variables,
 * exports the schema as a DBML file, and creates a README with documentation.
 *
 * @param {string} outputDir - The directory path where the diagram files will be written.
 * @returns {Promise<void>}
 */
 const writeDiagrams = async (outputDir: string): Promise<void> => {
   // Get database connection string from environment
   const connectionString: string = EnvHelper.getConnectionString();
   // Define output path for DBML diagram file
   const filePath = path.normalize(`${outputDir}/database.dbml`);

   // Export database schema to DBML format
   await exportDbmlDiagram(connectionString, filePath);

   // Generate README content for the diagram
   const text = NunjucksHelper.renderFile(__dirname + '/templates/dbml-readme.njk', {filename: path.basename(filePath)}, { autoescape: false });
   // Save README file alongside the diagram
   FileHelper.saveTextToFile(`${outputDir}/README.md`, text);
 };

/**
 * Writes base files required for the scaffold generation.
 * This includes ModelBase, RepositoryBase, configuration, and instance files.
 *
 * @returns {void}
 */
 const writeBaseFiles = (): void => {
   // Generate ModelBase.ts from template
   const fileName = FileHelper.rootPath('dist/custom-scaffold/base/ModelBase.ts');
   const text = NunjucksHelper.renderFile(`${__dirname}/templates/model-base.njk`, {}, { autoescape: false });
   FileHelper.saveTextToFile(fileName, text);
   console.log('Generated ModelBase:', fileName);

   // Generate RepositoryBase.ts from template
   const rbFileName = FileHelper.rootPath('dist/custom-scaffold/base/RepositoryBase.ts');
   const rbText = NunjucksHelper.renderFile(`${__dirname}/templates/repo-base.njk`, {}, { autoescape: false });
   FileHelper.saveTextToFile(rbFileName, rbText);
   console.log('Generated RepositoryBase:', rbFileName);

   // Generate configuration.ts from template
   const cfgFileName = FileHelper.rootPath('dist/custom-scaffold/configuration.ts');
   const cfgText = NunjucksHelper.renderFile(`${__dirname}/templates/config-template.njk`, {}, { autoescape: false });
   FileHelper.saveTextToFile(cfgFileName, cfgText);
   console.log('Generated configuration file:', cfgFileName);

   // Generate instance.ts from template
   const insFileName = FileHelper.rootPath('dist/custom-scaffold/instance.ts');
   const insText = NunjucksHelper.renderFile(`${__dirname}/templates/instance-template.njk`, {}, { autoescape: false });
   FileHelper.saveTextToFile(insFileName, insText);
   console.log('Generated instance file:', insFileName);
 };

/**
 * Generates and writes a repository file for the given model name.
 *
 * @param {string} modelName - The name of the model to generate the repository for.
 * @returns {void}
 */
export const writeRepoFile = (modelName: string) => {
  const text = NunjucksHelper.renderFile(__dirname + '/templates/repo-template.njk', { modelName }, { autoescape: false });
  const fileName = FileHelper.rootPath(`dist/custom-scaffold/repositories/${modelName}Repository.ts`);
  console.log('Repository generated:', fileName);
  FileHelper.saveTextToFile(fileName, text);
};

run();
