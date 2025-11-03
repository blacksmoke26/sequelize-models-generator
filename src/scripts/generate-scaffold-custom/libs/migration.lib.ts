/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 * @fileoverview Utilities for generating database migration files
 */

import path from 'node:path';
import moment from 'moment';
import { format } from 'sql-formatter';
import { snakeCase } from 'change-case';

// classes
import DbMigrator from '~/classes/DbMigrator';
import TypeUtils from '~/classes/TypeUtils';

// helpers
import NunjucksHelper from '~/helpers/NunjucksHelper';
import FileHelper from '~/helpers/FileHelper';

// utils
import { sp } from '../utils';

// types
import type { Knex } from 'knex';
import type { ForeignKey, TableIndex } from '~/typings/utils';
import type { ColumnInfo } from '~/classes/TableColumns';

/**
 * Creates a promise that resolves after a specified delay
 * @param ms - Delay in milliseconds
 * @returns Promise that resolves after the delay
 */
export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Escapes single quotes in a string
 * @param str - String to escape
 * @returns String with escaped single quotes
 */
export const escape = (str: string) => str.replaceAll(`'`, `\\'`);

/**
 * Formats SQL string with proper indentation
 * @param sql - SQL string to format
 * @returns Formatted SQL string
 */
export const formatSQL = (sql: string): string => {
  return format(sql, {
    language: 'postgresql',
    tabWidth: 2,
    keywordCase: 'upper',
    linesBetweenQueries: 2,
    useTabs: false,
  }).replace(/^./gim, (s) => {
    return sp(6) + s;
  });
};

/**
 * Initializes migration variables object
 * @returns Object with empty up and down migration strings
 */
export const initVariables = (): { up: string; down: string } => {
  return {
    up: '',
    down: '',
  };
};

/**
 * Creates a migration filename with timestamp
 * @param outDir - Output directory path
 * @param fileName - Base filename
 * @returns Normalized migration filename with timestamp
 */
export const createFilename = (outDir: string, fileName: string) => {
  return path.normalize(`${outDir}/${moment().format('YYYYMMDDHHmmss')}-${snakeCase(fileName)}.js`);
};

/**
 * Creates a migration file with given content
 * @param fileName - Full path to the file to create
 * @param variables - Object containing up and down migration strings
 */
export const createFile = (fileName: string, variables: { up: string; down: string }): void => {
  const context = {
    up: variables.up?.trimEnd(),
    down: variables.down?.trimEnd(),
  };

  const text = NunjucksHelper.renderFile(path.normalize(`${__dirname}/../templates/migration-template.njk`), context, { autoescape: false });

  const filePath = path.normalize(fileName);
  FileHelper.saveTextToFile(filePath, text);
};

/**
 * Generates migration files for database functions
 * @param knex - Knex instance
 * @param schemas - Array of schema names to process
 * @param outputDir - Directory to output migration files
 */
export const generateFunctions = async (knex: Knex, schemas: readonly string[], outputDir: string): Promise<void> => {
  const list = await DbMigrator.getFunctions(knex);

  for (const data of list) {
    let sql = data.definition.trim();
    schemas.forEach((x) => {
      sql = sql.replaceAll(`${x}.`, '');
    });

    const vars = initVariables();
    vars.up += sp(4, `await queryInterface.sequelize.query(\`\n`);
    vars.up += sp(0, formatSQL(sql) + `\n`);
    vars.up += sp(4, '`);');

    vars.down += sp(4, `await queryInterface.sequelize.query(\`\n`);
    vars.down += sp(6, `DROP FUNCTION %s\n`, data.name);
    vars.down += sp(4, `\`);`);

    const fileName = createFilename(outputDir, `create_${data.schema}_${data.name}_function`);
    createFile(fileName, vars);
    console.log('Generated function migration:', fileName);
  }
  await sleep(1000);
};

/**
 * Generates migration files for database domains
 * @param knex - Knex instance
 * @param schemas - Array of schema names to process
 * @param outputDir - Directory to output migration files
 */
export const generateDomains = async (knex: Knex, schemas: readonly string[], outputDir: string): Promise<void> => {
  const list = await DbMigrator.getDomains(knex);

  for (const data of list) {
    let sql = data.definition.trim();
    schemas.forEach((x) => {
      sql = sql.replaceAll(`${x}.`, '');
    });

    const vars = initVariables();
    vars.up += sp(4, `await queryInterface.sequelize.query(\`\n`);
    vars.up += sp(0, formatSQL(sql) + `\n`);
    vars.up += sp(4, '`);');

    vars.down += sp(4, `await queryInterface.sequelize.query(\`\n`);
    vars.down += sp(6, `DROP DOMAIN %s\n`, data.name);
    vars.down += sp(4, `\`);`);

    const fileName = createFilename(outputDir, `create_${data.schema}_${data.name}_domain`);
    createFile(fileName, vars);
    console.log('Generated domain migration:', fileName);
  }

  await sleep(1000);
};

/**
 * Generates migration files for database triggers
 * @param knex - Knex instance
 * @param schemas - Array of schema names to process
 * @param outputDir - Directory to output migration files
 */
export const generateTriggers = async (knex: Knex, schemas: readonly string[], outputDir: string): Promise<void> => {
  const list = await DbMigrator.getTriggers(knex);

  for (const data of list) {
    let sql = data.definition.trim();
    schemas.forEach((x) => {
      sql = sql.replaceAll(`${x}.`, '');
    });

    const vars = initVariables();
    vars.up += sp(4, `await queryInterface.sequelize.query(\`\n`);
    vars.up += sp(0, formatSQL(sql) + `\n`);
    vars.up += sp(4, '`);');

    vars.down += sp(4, `await queryInterface.sequelize.query(\`\n`);
    vars.down += sp(6, `DROP TRIGGER %s\n`, data.name);
    vars.down += sp(4, `\`);`);

    const fileName = createFilename(outputDir, `create_${data.schema}_${data.name}_trigger`);
    createFile(fileName, vars);
    console.log('Generated trigger migration:', fileName);
  }

  await sleep(1000);
};

/**
 * Generates migration files for database views
 * @param knex - Knex instance
 * @param schemas - Array of schema names to process
 * @param outputDir - Directory to output migration files
 */
export const generateViews = async (knex: Knex, schemas: readonly string[], outputDir: string): Promise<void> => {
  const list = await DbMigrator.getViews(knex);

  for (const data of list) {
    let sql = data.definition.trim();
    schemas.forEach((x) => {
      sql = sql.replaceAll(`${x}.`, '');
    });

    const vars = initVariables();
    vars.up += sp(4, `await queryInterface.sequelize.query(\`\n`);
    vars.up += sp(0, formatSQL('CREATE OR REPLACE VIEW ' + sql) + `\n`);
    vars.up += sp(4, '`);');

    vars.down += sp(4, `await queryInterface.sequelize.query(\`\n`);
    vars.down += sp(6, `DROP VIEW %s\n`, data.name);
    vars.down += sp(4, `\`);`);

    const fileName = createFilename(outputDir, `create_${data.schema}_${data.name}_view`);
    createFile(fileName, vars);
    console.log('Generated view migration:', fileName);
  }

  await sleep(1000);
};

/**
 * Generates migration code for creating a table and its columns
 * @param params - Object containing table information and migration text
 * @param vars - Migration variables object to update
 * @returns Object with updated up and down migration text
 */
export const generateTableInfo = async (
  params: { tableName: string; schemaName: string; columnsInfo: ColumnInfo[]; tableForeignKeys: ForeignKey[] },
  vars: { up: string; down: string },
) => {
  const { tableName, columnsInfo, schemaName, tableForeignKeys } = params;

  vars.up += sp(4, `await queryInterface.createTable({ schema: '%s', tableName: '%s' }, {\n`, schemaName, tableName);
  vars.down += sp(4, `// drop '%s' table\n`, tableName);
  vars.down += sp(4, `await queryInterface.dropTable({ schema: '%s', tableName: '%s' });\n`, schemaName, tableName);

  for await (const columnInfo of columnsInfo) {
    const foreignKey = tableForeignKeys.find((x) => x.columnName === columnInfo.name) ?? null;

    vars.up += sp(6, `%s: {\n`, columnInfo.propertyName);

    if (columnInfo.propertyName !== columnInfo.name) {
      vars.up += sp(8, `field: '%s',\n`, columnInfo.name);
    }

    if (foreignKey) {
      /*vars.up += sp(8, `references: {\n`);
      vars.up += sp(10, `model: %s,\n`, StringHelper.tableToModel(foreignKey.referenced.table));
      vars.up += sp(10, `key: '%s',\n`, StringHelper.toPropertyName(foreignKey.referenced.column));
      if (foreignKey.isDeferrable) {
        vars.up += sp(10, `deferrable: true,\n`);
      }
      vars.up += sp(8, `},\n`);*/
    }

    let sequelizeType = columnInfo.sequelizeTypeParams;

    if (sequelizeType.startsWith('$QUOTE')) {
      sequelizeType = sequelizeType.replace('$QUOTE.', '');
      vars.up += sp(8, `type: '%s', // PostgreSQL's Domain Type.\n`, sequelizeType);
    } else if (sequelizeType.startsWith('$COMMENT')) {
      const [ty, cm] = sequelizeType.replace('$COMMENT.', '').split('|');
      vars.up += sp(8, `type: DataTypes.%s, // %s\n`, ty, cm);
    } else if (sequelizeType.startsWith('$RAW')) {
      const [x, y] = sequelizeType.replace('$RAW.', '').split('|');
      sequelizeType = x;
      vars.up += sp(8, `type: '%s', // %s\n`, sequelizeType, y || "PostgreSQL's Native Custom (Composite) Type.");
    } else {
      if (TypeUtils.isArray(columnInfo.type) || TypeUtils.isRange(columnInfo.type)) {
        sequelizeType = sequelizeType.replace('(', '(DataTypes.');
      }
      vars.up += sp(8, `type: DataTypes.%s,\n`, sequelizeType);
    }

    if (columnInfo.flags.primary) {
      vars.up += sp(8, `primaryKey: true,\n`);
    }

    if (columnInfo.flags.autoIncrement) {
      vars.up += sp(8, `autoIncrement: true,\n`);
    }

    if (columnInfo.comment) {
      vars.up += sp(8, `comment: '%s',\n`, columnInfo.comment);
    }

    if (columnInfo.defaultValue) {
      if (!TypeUtils.isDate(columnInfo.type)) {
        vars.up += sp(8, `defaultValue: %s,\n`, columnInfo.defaultValue);
      } else {
        if (columnInfo.defaultValueRaw?.startsWith?.('CURRENT_')) {
          vars.up += sp(8, `defaultValue: Sequelize.literal('%s'),\n`, columnInfo.defaultValueRaw);
        }
      }
    }

    vars.up += sp(8, `allowNull: %s,\n`, String(columnInfo.flags.nullable));
    vars.up += sp(6, `},\n`);
  }

  /*for await (const column of columnsInfo) {
    vars.up += sp(6, `%s: {\n`, column.propertyName);

    if (column.propertyName !== column.name) {
      vars.up += sp(8, `field: '%s',\n`, column.name);
    }

    let sequelizeType = column.sequelizeTypeParams;
    if (TypeUtils.isArray(column.type) || TypeUtils.isRange(column.type)) {
      sequelizeType = sequelizeType.replace('(', '(Sequelize.');
    }

    vars.up += sp(8, `type: Sequelize.%s,\n`, sequelizeType);

    if (column.flags.primary) {
      vars.up += sp(8, `primaryKey: true,\n`);
    }

    if (column.flags.autoIncrement) {
      vars.up += sp(8, `autoIncrement: true,\n`);
    }

    if (column.comment) {
      vars.up += sp(8, `comment: '%s',\n`, escape(column.comment));
    }

    if (column.defaultValue) {
      if (!TypeUtils.isDate(column.type)) {
        vars.up += sp(8, `defaultValue: %s,\n`, column.defaultValue);
      } else {
        if (column.defaultValueRaw?.startsWith?.('CURRENT_')) vars.up += sp(8, `defaultValue: Sequelize.literal('%s'),\n`, column.defaultValueRaw);
      }
    }

    vars.up += sp(8, `allowNull: %s,\n`, String(column.flags.nullable));
    vars.up += sp(6, `},\n`);
  }*/

  vars.up += sp(4, `});\n`);
};

/**
 * Generates migration code for creating table indexes
 * @param tableIndexes - Array of table index definitions
 * @param tableName - Table name
 * @param schemaName - Schema name
 * @param vars - Migration variables object to update
 */
export const generateCreateIndexes = (tableIndexes: TableIndex[], tableName: string, schemaName: string, vars: { up: string; down: string }) => {
  if (!tableIndexes.length) {
    return;
  }

  vars.up += `\n`;
  vars.up += sp(4, `// create table indexes\n`);
  for (const tableIndex of tableIndexes) {
    let indexedTextBytes = '';

    if (tableIndex.comment) {
      indexedTextBytes += sp(4, `// ${tableIndex.comment}\n`);
    }

    indexedTextBytes += sp(
      4,
      `await queryInterface.addIndex({ schema: '%s', tableName: '%s' }, [%s], {\n`,
      schemaName,
      tableName,
      tableIndex.columns.map((x) => `'${x}'`).join(', '),
    );

    indexedTextBytes += sp(6, `name: '%s',\n`, escape(tableIndex.name));

    if (tableIndex.constraint === 'UNIQUE') {
      indexedTextBytes += sp(6, `unique: true,\n`);
    }

    if (tableIndex.type) {
      indexedTextBytes += sp(6, `using: '%s',\n`, tableIndex.type);
    }

    indexedTextBytes += sp(4, `});\n`);

    vars.up += indexedTextBytes;
  }
};

/**
 * Generates migration code for removing table indexes
 * @param tableIndexes - Array of table index definitions
 * @param vars - Migration variables object to update
 */
export const generateRemoveIndexes = (tableIndexes: TableIndex[], vars: { up: string; down: string }) => {
  if (!tableIndexes.length) {
    return;
  }

  let indexedTextBytes = sp(4, `//  drop %s table indexes\n`, tableIndexes.length);
  for (const tableIndex of tableIndexes) {
    indexedTextBytes += sp(4, `await queryInterface.removeIndex({ schema: '%s', tableName: '%s' }, '%s');\n`, tableIndex.schema, tableIndex.table, tableIndex.name);
  }
  vars.down = indexedTextBytes + `\n` + vars.down;
};

/**
 * Generates migration code for adding foreign key constraints
 * @param foreignKeys - Array of foreign key definitions
 * @param vars - Migration variables object to update
 */
export const generateForeignKeys = (foreignKeys: ForeignKey[], vars: { up: string; down: string }) => {
  console.log('Generating foreign keys...');
  if (!foreignKeys.length) return;

  for (const foreignKey of foreignKeys) {
    if (foreignKey.comment) {
      vars.up += sp(4, `// %s\n`, foreignKey.comment);
    }

    vars.up += sp(4, `await queryInterface.addConstraint({ schema: '%s', tableName: '%s' }, {\n`, foreignKey.schema, foreignKey.tableName);
    vars.up += sp(6, `field: ['%s'],\n`, foreignKey.columnName);
    vars.up += sp(6, `type: 'foreign key',\n`);
    vars.up += sp(6, `name: '%s',\n`, foreignKey.constraintName);

    if (foreignKey.defaultValue) {
      vars.up += sp(6, `defaultValue: '%s',\n`, foreignKey.defaultValue);
    }
    vars.up += sp(6, `references: {\n`);
    vars.up += sp(8, `table: '%s',\n`, foreignKey.referenced.table);
    vars.up += sp(8, `field: '%s',\n`, foreignKey.referenced.column);
    vars.up += sp(6, `},\n`);

    if (foreignKey.rule.update) {
      vars.up += sp(6, `onUpdate: '%s',\n`, foreignKey.rule.update);
    }

    if (foreignKey.rule.delete) {
      vars.up += sp(6, `onDelete: '%s',\n`, foreignKey.rule.delete);
    }

    if (foreignKey.isDeferrable) {
      vars.up += sp(6, `deferrable: true',\n`);
    }

    vars.up += sp(4, `});\n`);

    vars.down += sp(
      4,
      `await queryInterface.removeConstraint({ schema: '%s', tableName: '%s' }, '%s');\n`,
      foreignKey.schema,
      foreignKey.tableName,
      foreignKey.constraintName,
    );
  }
};
