/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 * @description Script to generate Sequelize migrations from database schema
 */

import 'dotenv/config';

import path from 'node:path';
import figlet from 'figlet';
import moment from 'moment';
import fsx from 'fs-extra';
import { snake } from 'case';
import { sprintf } from 'sprintf-js';

// classes
import KnexClient from '../classes/KnexClient';
import TableColumns, { ColumnInfo } from '~/classes/TableColumns';

// helpers
import NunjucksHelper from '~/helpers/NunjucksHelper';
import FileHelper from '~/helpers/FileHelper';

// utils
import DbUtils from '~/classes/DbUtils';
import TypeUtils from '~/classes/TypeUtils';

// types
import type { TableIndex } from '~/typings/utils';

/**
 * Adds spacing and formats a string using sprintf
 * @param count - Number of spaces to prepend
 * @param str - String to format (optional)
 * @param args - Arguments for sprintf (optional)
 * @returns Formatted string with leading spaces
 */
const space = (count: number, str: string = '', ...args: any[]) => ' '.repeat(count) + sprintf(str, ...args);

/**
 * Escapes single quotes in a string
 * @param str - String to escape
 * @returns String with escaped single quotes
 */
const escape = (str: string) => str.replaceAll(`'`, `\\'`);

/**
 * Creates a promise that resolves after a specified delay
 * @param ms - Delay in milliseconds
 * @returns Promise that resolves after the delay
 */
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generates migration code for creating table indexes
 * @param tableIndexes - Array of table index information
 * @param upText - Existing up migration text
 * @param tableName - Name of the table
 * @param schemaName - Name of the schema
 * @returns Updated up migration text with index creation code
 */
const generateCreateIndexes = (tableIndexes: TableIndex[], upText: string, tableName: string, schemaName: string) => {
  if (tableIndexes.length) {
    upText += `\n`;
    upText += space(4, `// create table indexes\n`);
    for (const tableIndex of tableIndexes) {
      let indexedTextBytes = '';

      if (tableIndex.comment) {
        indexedTextBytes += space(4, `// ${tableIndex.comment}\n`);
      }

      indexedTextBytes += space(
        4,
        `await queryInterface.addIndex({ schema: '%s', tableName: '%s' }, [%s], {\n`,
        schemaName,
        tableName,
        tableIndex.columns.map((x) => `'${x}'`).join(', '),
      );

      indexedTextBytes += space(6, `name: '%s',\n`, escape(tableIndex.name));

      if (tableIndex.constraint === 'UNIQUE') {
        indexedTextBytes += space(6, `unique: true,\n`);
      }

      if (tableIndex.type) {
        indexedTextBytes += space(6, `using: '%s',\n`, tableIndex.type);
      }

      indexedTextBytes += space(4, `});\n`);

      upText += indexedTextBytes;
    }
  }
  return upText;
};

/**
 * Generates migration code for creating a table and its columns
 * @param params - Object containing table information and migration text
 * @returns Object with updated up and down migration text
 */
const generateTableInfo = async (params: { upText: string; tableName: string; downText: string; schemaName: string; columnsInfo: ColumnInfo[] }) => {
  const { tableName, columnsInfo, schemaName } = params;
  let { upText, downText } = params;

  upText += space(4, `await queryInterface.createTable({ schema: '%s', tableName: '%s' }, {\n`, schemaName, tableName);
  downText += space(4, `// drop '%s' table\n`, tableName);
  downText += space(4, `await queryInterface.dropTable({ schema: '%s', tableName: '%s' });\n`, schemaName, tableName);

  for await (const column of columnsInfo) {
    upText += space(6, `%s: {\n`, column.propertyName);

    if (column.propertyName !== column.name) {
      upText += space(8, `field: '%s',\n`, column.name);
    }

    let sequelizeType = column.sequelizeTypeParams;
    if (TypeUtils.isArray(column.type) || TypeUtils.isRange(column.type)) {
      sequelizeType = sequelizeType.replace('(', '(Sequelize.');
    }

    upText += space(8, `type: Sequelize.%s,\n`, sequelizeType);

    if (column.flags.primary) {
      upText += space(8, `primaryKey: true,\n`);
    }

    if (column.flags.autoIncrement) {
      upText += space(8, `autoIncrement: true,\n`);
    }

    if (column.comment) {
      upText += space(8, `comment: '%s',\n`, escape(column.comment));
    }

    if (column.defaultValue) {
      if (!TypeUtils.isDate(column.type)) {
        upText += space(8, `defaultValue: %s,\n`, column.defaultValue);
      } else {
        if (column.defaultValueRaw?.startsWith?.('CURRENT_')) upText += space(8, `defaultValue: Sequelize.literal('%s'),\n`, column.defaultValueRaw);
      }
    }

    upText += space(8, `allowNull: %s,\n`, String(column.flags.nullable));
    upText += space(6, `},\n`);
  }

  upText += space(4, `});\n`);
  return { upText, downText };
};

/**
 * Generates migration code for removing table indexes
 * @param tableIndexes - Array of table index information
 * @param downText - Existing down migration text
 * @returns Updated down migration text with index removal code
 */
function generateRemoveIndexes(tableIndexes: TableIndex[], downText: string) {
  if (tableIndexes.length) {
    let indexedTextBytes = space(4, `//  drop %s table indexes\n`, tableIndexes.length);

    for (const tableIndex of tableIndexes) {
      indexedTextBytes += space(4, `await queryInterface.removeIndex({ schema: '%s', tableName: '%s' }, '%s');\n`, tableIndex.schema, tableIndex.table, tableIndex.name);
    }

    downText = indexedTextBytes + `\n` + downText;
  }
  return downText;
}

/**
 * Main function to generate Sequelize migrations from database schema
 */
async function run() {
  console.log(await figlet.text('Sequelize Migrations', { font: 'Slant' }));
  console.log(`--------------- START OF SCRIPT --------------\n\n`);

  // 1️⃣ Configure Knex
  const knex = KnexClient.create();

  const outputDir = FileHelper.rootPath('dist/migrations');

  console.log('Cleaning up target directory...');
  fsx.emptydirSync(outputDir);
  console.log('Target directory cleaned!');

  console.log('Fetching database information...');
  const schemas = await DbUtils.getSchemas(knex);
  const indexes = await DbUtils.getIndexes(knex);
  const foreignKeys = await DbUtils.getForeignKeys(knex);

  for (const schemaName of schemas) {
    const schemaTables = await DbUtils.getTables(knex, schemaName);

    for await (const tableName of schemaTables) {
      const tableIndexes = indexes.filter((x) => x.table === tableName && x.schema === schemaName);

      const columnsInfo = await TableColumns.list(knex, tableName, schemaName);

      let upText: string = '';
      let downText: string = '';

      const __ret = await generateTableInfo({ upText, tableName, downText, columnsInfo, schemaName });
      upText = __ret.upText;
      downText = __ret.downText;

      upText = generateCreateIndexes(tableIndexes, upText, tableName, schemaName);

      downText = generateRemoveIndexes(tableIndexes, downText);

      const text = NunjucksHelper.renderTemplate('sequelize-table-migration.njk', { upText: upText.trimEnd(), downText: downText.trimEnd() }, { autoescape: false });

      //await sleep(1000);
      const fileName = path.normalize(`${outputDir}/${moment().format('YYYYMMDDHHmmss')}-create_${snake(schemaName)}_${snake(tableName)}_table.js`);
      console.log('Migration generated:', fileName);
      FileHelper.saveTextToFile(fileName, text);
    }
  }

  console.log('Writing changes...');
  await sleep(1100);
  console.log('Generating foreign keys...');

  let fkUpText = '';
  let fkDownText = '';

  for (const foreignKey of foreignKeys) {
    if (foreignKey.comment) {
      fkUpText += space(4, `// %s\n`, foreignKey.comment);
    }

    fkUpText += space(4, `await queryInterface.addConstraint({ schema: '%s', tableName: '%s' }, {\n`, foreignKey.schema, foreignKey.tableName);
    fkUpText += space(6, `field: ['%s'],\n`, foreignKey.columnName);
    fkUpText += space(6, `type: 'foreign key',\n`);
    fkUpText += space(6, `name: '%s',\n`, foreignKey.constraintName);

    if (foreignKey.defaultValue) {
      fkUpText += space(6, `defaultValue: '%s',\n`, foreignKey.defaultValue);
    }
    fkUpText += space(6, `references: {\n`);
    fkUpText += space(8, `table: '%s',\n`, foreignKey.referenced.table);
    fkUpText += space(8, `field: '%s',\n`, foreignKey.referenced.column);
    fkUpText += space(6, `},\n`);

    if (foreignKey.rule.update) {
      fkUpText += space(6, `onUpdate: '%s',\n`, foreignKey.rule.update);
    }

    if (foreignKey.rule.delete) {
      fkUpText += space(6, `onDelete: '%s',\n`, foreignKey.rule.delete);
    }

    if (foreignKey.isDeferrable) {
      fkUpText += space(6, `deferrable: true',\n`);
    }

    fkUpText += space(4, `});\n`);

    fkDownText += space(
      4,
      `await queryInterface.removeConstraint({ schema: '%s', tableName: '%s' }, '%s');\n`,
      foreignKey.schema,
      foreignKey.tableName,
      foreignKey.constraintName
    );
  }

  const rendered = NunjucksHelper.renderTemplate('sequelize-table-migration.njk', { upText: fkUpText.trimEnd(), downText: fkDownText.trimEnd() }, { autoescape: false });

  const fileName = path.normalize(`${outputDir}/${moment().format('YYYYMMDDHHmmss')}-create-foreign-keys.js`);

  FileHelper.saveTextToFile(`${outputDir}/${moment().format('YYYYMMDDHHmmss')}-create-foreign-keys.js`, rendered);
  console.log('Migration generated:', fileName);

  console.log(`\n\n--------------- END OF SCRIPT ----------------`);
  process.exit();
}

run();
