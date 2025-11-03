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

/**
 * Main function to orchestrate the scaffold generation process.
 * Connects to the database, fetches schema information, and generates
 * models, repositories, and configuration files.
 *
 * @async
 * @returns {Promise<void>}
 */
async function run() {
  console.log(await figlet.text('Generate Scaffold App', { font: 'Slant' }));
  // 1️⃣ Configure Knex
  const knex = KnexClient.create();

  const outputDir = FileHelper.rootPath('dist/custom-scaffold/models');

  console.log('Cleaning up target directory...');
  fsx.emptydirSync(outputDir);
  fsx.emptydirSync(FileHelper.rootPath('dist/custom-scaffold/base'));
  fsx.emptydirSync(FileHelper.rootPath('dist/custom-scaffold/repositories'));
  console.log('Target directories cleaned!');

  console.log('Fetching database information...');
  const schemas = await DbUtils.getSchemas(knex);
  const indexes = await DbUtils.getIndexes(knex);
  const relationships = await DbUtils.getRelationships(knex);
  const foreignKeys = await DbUtils.getForeignKeys(knex);

  writeBaseFiles();

  const initTplVars = getInitializerTemplateVars();

  for (const schemaName of schemas) {
    const schemaTables = await DbUtils.getTables(knex, schemaName);

    for await (const tableName of schemaTables) {
      const tableRelations = relationships.filter((x) => x.source.table === tableName) ?? [];

      const modelName = pascal(StringHelper.normalizeSingular(tableName));
      const tableIndexes = indexes.filter((x) => x.table === tableName && x.schema === schemaName);
      const tableForeignKeys = foreignKeys.filter((x) => x.tableName === tableName && x.schema === schemaName);

      initTplVars.importClasses += sp(0, `import %s from './%s';\n`, modelName, modelName);
      initTplVars.importTypes += sp(0, `export * from './%s';\n`, modelName);
      initTplVars.exportClasses += sp(2, `%s,\n`, modelName);

      const modTplVars = getModelTemplateVars({
        schemaName,
        modelName,
        tableName,
      });

      const columnsInfo = await TableColumns.list(knex, tableName, schemaName);

      const hasCreatedAt: boolean = columnsInfo.findIndex((x) => /^created(_a|A)t$/.test(x.name)) !== -1;
      const hasUpdatedAt: boolean = columnsInfo.findIndex((x) => /^updated(_a|A)t$/.test(x.name)) !== -1;

      for (const columnInfo of columnsInfo) {
        const relation = tableRelations.find((x) => x.source.column === columnInfo.name) ?? null;

        generateEnums(columnInfo, modTplVars, modelName);
        generateInterfaces(columnInfo, modTplVars);
        generateFields(columnInfo, modTplVars, modelName, {
          targetTable: relation?.target?.table ?? null,
          targetColumn: relation?.target?.column ?? null,
          isFK: relation !== null,
        });
        generateAttributes({ columnInfo, modTplVars, tableForeignKeys });
      }

      generateRelationsImports(tableRelations, modTplVars);
      generateOptions(modTplVars, { schemaName, tableName, hasCreatedAt, hasUpdatedAt });
      generateIndexes(tableIndexes, modTplVars);
      generateAssociations(tableRelations, modTplVars, tableName);

      modTplVars.modelsImport = modTplVars.modelsImport.trimEnd();
      modTplVars.fields = modTplVars.fields.trimEnd();
      modTplVars.options = modTplVars.options.trimEnd();
      modTplVars.attributes = modTplVars.attributes.trimEnd();

      const text = NunjucksHelper.renderFile(__dirname + '/templates/model-template.njk', modTplVars, { autoescape: false });
      const fileName = path.normalize(`${outputDir}/${modelName}.ts`);
      console.log('Model generated:', fileName);
      FileHelper.saveTextToFile(fileName, text);

      writeRepoFile(StringHelper.tableToModel(tableName));
    }
  }

  generateInitializer(relationships, initTplVars);

  const text = NunjucksHelper.renderFile(__dirname + '/templates/models-initializer.njk', initTplVars, { autoescape: false });
  const fileName = path.normalize(`${outputDir}/index.ts`);
  console.log('Models Initializer generated:', fileName);
  FileHelper.saveTextToFile(fileName, text);

  process.exit();
}

/**
 * Writes base files required for the scaffold generation.
 * This includes ModelBase, RepositoryBase, configuration, and instance files.
 *
 * @returns {void}
 */
const writeBaseFiles = () => {
  const fileName = FileHelper.rootPath('dist/custom-scaffold/base/ModelBase.ts');
  const text = NunjucksHelper.renderFile(`${__dirname}/templates/model-base.njk`, {}, { autoescape: false });
  FileHelper.saveTextToFile(fileName, text);
  console.log('Generated ModelBase:', fileName);

  const rbFileName = FileHelper.rootPath('dist/custom-scaffold/base/RepositoryBase.ts');
  const rbText = NunjucksHelper.renderFile(`${__dirname}/templates/repo-base.njk`, {}, { autoescape: false });
  FileHelper.saveTextToFile(rbFileName, rbText);
  console.log('Generated RepositoryBase:', rbFileName);

  const cfgFileName = FileHelper.rootPath('dist/custom-scaffold/configuration.ts');
  const cfgText = NunjucksHelper.renderFile(`${__dirname}/templates/config-template.njk`, {}, { autoescape: false });
  FileHelper.saveTextToFile(cfgFileName, cfgText);
  console.log('Generated configuration file:', cfgFileName);

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
