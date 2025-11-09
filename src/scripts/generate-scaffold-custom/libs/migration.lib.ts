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

// utils
import { sp } from '../utils';
import { renderOut } from '../writer';

// types
import type { Knex } from 'knex';
import type { ForeignKey, TableIndex } from '~/typings/utils';
import type { ColumnInfo } from '~/classes/TableColumns';
import type { MigrationConfig } from '../MigrationGenerator';

/**
 * Escapes single quotes in a string by replacing them with escaped versions.
 * This is useful when constructing SQL queries where string values need to be properly escaped.
 * @param str - The input string to escape single quotes from
 * @returns The string with all single quotes escaped with backslashes
 * @example
 * ```typescript
 * escape("O'Reilly") // Returns "O\\'Reilly"
 * ```
 */
export const escape = (str: string) => str.replaceAll(`'`, `\\'`);

/**
 * Formats a SQL string with proper indentation and SQL keyword casing.
 * Uses sql-formatter to standardize the SQL appearance with PostgreSQL dialect.
 * @param sql - The raw SQL string to format
 * @returns The formatted SQL string with proper indentation and uppercase keywords
 * @example
 * ```typescript
 * formatSQL("select * from users where id=1")
 * // Returns formatted SQL with proper indentation
 * ```
 */
export const formatSQL = (sql: string): string => {
  return format(sql, {
    language: 'postgresql',
    tabWidth: 2,
    keywordCase: 'upper',
    linesBetweenQueries: 2,
    useTabs: false,
  }).replace(/^./gim, (s) => {
    return sp(4) + s;
  });
};

/**
 * Initializes a migration variables object containing empty strings for up and down migrations.
 * This provides a standardized structure for building migration content.
 * @returns An object with empty `up` and `down` properties ready to be populated with migration code
 * @example
 * ```typescript
 * const vars = initVariables();
 * // vars.up = ""
 * // vars.down = ""
 * ```
 */
export const initVariables = (): { up: string; down: string } => {
  return {
    up: '',
    down: '',
  };
};

/**
 * Creates a standardized migration filename with timestamp prefix.
 * The filename follows the pattern: YYYYMMDDHHmmss-snake_case_name.js
 * @param outDir - The output directory where the migration file will be created
 * @param fileName - The base filename (will be converted to snake_case)
 * @param timestamp - Optional Unix timestamp to use instead of current time
 * @returns The full normalized path to the migration file
 * @example
 * ```typescript
 * createFilename("/migrations", "createUsers", 1234567890)
 * // Returns "/migrations/1234567890-create_users.js"
 * ```
 */
export const createFilename = (outDir: string, fileName: string, timestamp: number = null) => {
  return path.normalize(`${outDir}/${timestamp || moment().format('YYYYMMDDHHmmss')}-${snakeCase(fileName)}.js`);
};

/**
 * Creates a migration file using a template with provided up and down migration content.
 * The migration content is trimmed of trailing whitespace before rendering.
 * @param fileName - Full path to the migration file to create
 * @param variables - Object containing the `up` and `down` migration strings
 * @throws Error if the template cannot be rendered or file cannot be written
 * @example
 * ```typescript
 * createFile("/migrations/1234567890-create_users.js", {
 *   up: "await queryInterface.createTable...",
 *   down: "await queryInterface.dropTable..."
 * });
 * ```
 */
export const createFile = (fileName: string, variables: { up: string; down: string }): void => {
  renderOut('migration-template', fileName, {
    up: variables.up?.trimEnd(),
    down: variables.down?.trimEnd(),
  });
};

/**
 * Processes a SQL definition by removing specified schema prefixes from the SQL string.
 * This is useful when generating schema-agnostic migration files.
 * @param sql - The raw SQL definition string to process
 * @param schemas - Array of schema names to remove from the SQL (e.g., ['public', 'schema1'])
 * @returns The processed SQL string with all schema prefixes removed
 * @example
 * ```typescript
 * processSQLDefinition("CREATE TABLE public.users...", ["public"])
 * // Returns "CREATE TABLE users..."
 * ```
 */
const processSQLDefinition = (sql: string, schemas: readonly string[]): string => {
  let processedSql = sql.trim();
  schemas.forEach((schema) => {
    processedSql = processedSql.replaceAll(`${schema}.`, '');
  });
  return processedSql;
};

/**
 * Generates migration variables (up/down) for creating and dropping a database object.
 * Wraps the SQL statements in proper query interface calls for Sequelize migrations.
 * @param sql - The SQL statement to create the database object
 * @param dropStatement - The SQL statement to drop the database object
 * @returns Object containing formatted `up` and `down` migration strings
 * @example
 * ```typescript
 * generateObjectMigrationVars(
 *   "CREATE TABLE users...",
 *   "DROP TABLE users"
 * )
 * // Returns { up: "...create query...", down: "...drop query..." }
 * ```
 */
const generateObjectMigrationVars = (sql: string, dropStatement: string): { up: string; down: string } => {
  const vars = initVariables();
  vars.up += sp(2, `await queryInterface.sequelize.query(\`\n`);
  vars.up += sp(0, formatSQL(sql) + `\n`);
  vars.up += sp(2, '`);');

  vars.down += sp(2, `await queryInterface.sequelize.query(\`\n`);
  vars.down += sp(4, `${dropStatement}\n`);
  vars.down += sp(2, `\`);`);

  return vars;
};

/**
 * Generates migration files for all database functions in the specified schemas.
 * Each function gets its own migration file with creation and drop statements.
 * @param knex - Active Knex database connection instance
 * @param schemas - Array of schema names to process functions from
 * @param config - Migration configuration including output directory and timestamp generator
 * @returns Promise that resolves when all function migration files have been generated
 * @example
 * ```typescript
 * await generateFunctions(knex, ["public", "auth"], migrationConfig);
 * // Creates migration files like: 1234567890-create_public_calculate_age_function.js
 * ```
 */
export const generateFunctions = async (knex: Knex, schemas: readonly string[], config: MigrationConfig): Promise<void> => {
  const list = await DbMigrator.getFunctions(knex);

  for (const data of list) {
    const sql = processSQLDefinition(data.definition, schemas);
    const vars = generateObjectMigrationVars(sql, `DROP FUNCTION ${data.name}`);

    const fileName = createFilename(config.outDir, `create_${data.schema}_${data.name}_function`, config.getTime());
    createFile(fileName, vars);
    console.log('Generated function migration:', fileName);
  }
};

/**
 * Generates migration files for all database domains in the specified schemas.
 * Domains are user-defined data types in PostgreSQL.
 * @param knex - Active Knex database connection instance
 * @param schemas - Array of schema names to process domains from
 * @param config - Migration configuration including output directory and timestamp generator
 * @returns Promise that resolves when all domain migration files have been generated
 * @example
 * ```typescript
 * await generateDomains(knex, ["public"], migrationConfig);
 * // Creates migration files like: 1234567890-create_public_email_domain.js
 * ```
 */
export const generateDomains = async (knex: Knex, schemas: readonly string[], config: MigrationConfig): Promise<void> => {
  const list = await DbMigrator.getDomains(knex);

  for (const data of list) {
    const sql = processSQLDefinition(data.definition, schemas);
    const vars = generateObjectMigrationVars(sql, `DROP DOMAIN ${data.name}`);

    const fileName = createFilename(config.outDir, `create_${data.schema}_${data.name}_domain`, config.getTime());
    createFile(fileName, vars);
    console.log('Generated domain migration:', fileName);
  }
};

/**
 * Generates a single migration file for all database indexes (except primary keys).
 * Creates both the index creation and removal statements in the same migration.
 * @param indexes - Array of table index definitions to process
 * @param config - Migration configuration including output directory and timestamp generator
 * @returns Promise that resolves when the indexes migration file has been generated
 * @example
 * ```typescript
 * await generateIndexes(tableIndexes, migrationConfig);
 * // Creates migration file: 1234567890-create_indexes.js
 * ```
 */
export const generateIndexes = async (indexes: TableIndex[], config: MigrationConfig): Promise<void> => {
  const filteredIndexes = indexes.filter((x) => x.constraint !== 'PRIMARY KEY');
  const vars = initVariables();
  generateCreateIndexes(filteredIndexes, vars);
  generateRemoveIndexes(filteredIndexes, vars);

  const fileName = createFilename(config.outDir, `create_indexes`, config.getTime());
  createFile(fileName, vars);
  console.log('Generated indexes migration:', fileName);
};

/**
 * Generates migration files for all database triggers in the specified schemas.
 * Each trigger gets its own migration file with creation and drop statements.
 * @param knex - Active Knex database connection instance
 * @param schemas - Array of schema names to process triggers from
 * @param config - Migration configuration including output directory and timestamp generator
 * @returns Promise that resolves when all trigger migration files have been generated
 * @example
 * ```typescript
 * await generateTriggers(knex, ["public"], migrationConfig);
 * // Creates migration files like: 1234567890-create_public_audit_trigger.js
 * ```
 */
export const generateTriggers = async (knex: Knex, schemas: readonly string[], config: MigrationConfig): Promise<void> => {
  const list = await DbMigrator.getTriggers(knex);

  for (const data of list) {
    const sql = processSQLDefinition(data.definition, schemas);
    const vars = generateObjectMigrationVars(sql, `DROP TRIGGER ${data.name}`);

    const fileName = createFilename(config.outDir, `create_${data.schema}_${data.name}_trigger`, config.getTime());
    createFile(fileName, vars);
    console.log('Generated trigger migration:', fileName);
  }
};

/**
 * Generates migration files for all composite types in the specified schemas.
 * Composite types are user-defined data types that can contain multiple fields.
 * @param knex - Active Knex database connection instance
 * @param schemas - Array of schema names to process composite types from
 * @param config - Migration configuration including output directory and timestamp generator
 * @returns Promise that resolves when all composite migration files have been generated
 * @example
 * ```typescript
 * await generateComposites(knex, ["public"], migrationConfig);
 * // Creates migration files like: 1234567890-create_public_address_composite.js
 * ```
 */
export const generateComposites = async (knex: Knex, schemas: readonly string[], config: MigrationConfig): Promise<void> => {
  const list = await DbMigrator.getComposites(knex);

  for (const data of list) {
    const sql = processSQLDefinition(data.definition, schemas);
    const vars = generateObjectMigrationVars(sql, `DROP TYPE ${data.name}`);

    const fileName = createFilename(config.outDir, `create_${data.schema}_${data.name}_composite`, config.getTime());
    createFile(fileName, vars);
    console.log('Generated composite migration:', fileName);
  }
};

/**
 * Generates migration files for all database views in the specified schemas.
 * Uses CREATE OR REPLACE VIEW syntax to allow view modifications.
 * @param knex - Active Knex database connection instance
 * @param schemas - Array of schema names to process views from
 * @param config - Migration configuration including output directory and timestamp generator
 * @returns Promise that resolves when all view migration files have been generated
 * @example
 * ```typescript
 * await generateViews(knex, ["public"], migrationConfig);
 * // Creates migration files like: 1234567890-create_public_user_summary_view.js
 * ```
 */
export const generateViews = async (knex: Knex, schemas: readonly string[], config: MigrationConfig): Promise<void> => {
  const list = await DbMigrator.getViews(knex);

  for (const data of list) {
    const sql = processSQLDefinition(data.definition, schemas);
    const fullViewSql = `CREATE OR REPLACE VIEW ${data.name} AS ${sql}`;
    const vars = generateObjectMigrationVars(fullViewSql, `DROP VIEW ${data.name}`);

    const fileName = createFilename(config.outDir, `create_${data.schema}_${data.name}_view`, config.getTime());
    createFile(fileName, vars);
    console.log('Generated view migration:', fileName);
  }
};

/**
 * Adds the field property to a column definition when the property name differs from the column name.
 * This is necessary when TypeScript/JavaScript property names don't match database column names.
 * @param definition - The current column definition string being built
 * @param columnInfo - Column metadata containing both property and database names
 * @returns The updated definition string with field property added if needed
 * @example
 * ```typescript
 * // If propertyName="userId" but name="user_id"
 * addFieldProperty(definition, columnInfo)
 * // Returns definition with: "field: 'user_id',\n"
 * ```
 */
const addFieldProperty = (definition: string, columnInfo: ColumnInfo): string => {
  if (columnInfo.propertyName !== columnInfo.name) {
    definition += sp(6, `field: '%s',\n`, columnInfo.name);
  }
  return definition;
};

/**
 * Adds the type definition to a column definition based on the column's Sequelize type parameters.
 * Handles special type prefixes including domains, commented types, and raw custom types.
 * Also processes array and range types by prepending Sequelize namespace.
 * @param definition - The current column definition string being built
 * @param columnInfo - Column metadata containing Sequelize type information
 * @returns The updated definition string with type property added
 * @example
 * ```typescript
 * // For a regular INTEGER type
 * addTypeDefinition(definition, columnInfo)
 * // Returns definition with: "type: Sequelize.INTEGER,\n"
 *
 * // For a domain type
 * addTypeDefinition(definition, columnInfo)
 * // Returns definition with: "type: 'email_domain', // PostgreSQL's Domain Type.\n"
 * ```
 */
const addTypeDefinition = (definition: string, columnInfo: ColumnInfo): string => {
  let sequelizeType = columnInfo.sequelizeTypeParams;

  if (sequelizeType.startsWith('$QUOTE')) {
    sequelizeType = sequelizeType.replace('$QUOTE.', '');
    definition += sp(6, `type: '%s', // PostgreSQL' Type.\n`, sequelizeType);
  } else if (sequelizeType.startsWith('$COMMENT')) {
    const [ty, cm] = sequelizeType.replace('$COMMENT.', '').split('|');
    definition += sp(6, `type: Sequelize.%s, // %s\n`, ty, cm);
  } else if (sequelizeType.startsWith('$RAW')) {
    const [x, y] = sequelizeType.replace('$RAW.', '').split('|');
    sequelizeType = x;
    definition += sp(6, `type: '%s', // %s\n`, sequelizeType, y || 'PostgreSQL Type.');
  } else {
    if (TypeUtils.isArray(columnInfo.type) || TypeUtils.isRange(columnInfo.type)) {
      sequelizeType = sequelizeType.replace('(', '(Sequelize.');
    }
    definition += sp(6, `type: Sequelize.%s,\n`, sequelizeType);
  }
  return definition;
};

/**
 * Adds primary key and auto increment properties to a column definition.
 * These properties are essential for defining identity columns in database tables.
 * @param definition - The current column definition string being built
 * @param columnInfo - Column metadata containing primary key and auto increment flags
 * @returns The updated definition string with primary/auto increment properties added if needed
 * @example
 * ```typescript
 * // For a primary key with auto increment
 * addPrimaryAndAutoIncrement(definition, columnInfo)
 * // Returns definition with:
 * // "primaryKey: true,\n"
 * // "autoIncrement: true,\n"
 * ```
 */
const addPrimaryAndAutoIncrement = (definition: string, columnInfo: ColumnInfo): string => {
  if (columnInfo.flags.primary) {
    definition += sp(6, `primaryKey: true,\n`);
  }
  if (columnInfo.flags.autoIncrement) {
    definition += sp(6, `autoIncrement: true,\n`);
  }
  return definition;
};

/**
 * Adds a comment property to the column definition if a comment is present.
 * Database comments are useful for documenting column purposes and constraints.
 * @param definition - The current column definition string being built
 * @param columnInfo - Column metadata containing the comment string
 * @returns The updated definition string with comment property added if present
 * @example
 * ```typescript
 * // For a column with comment
 * addComment(definition, columnInfo)
 * // Returns definition with: "comment: 'User email address',\n"
 * ```
 */
const addComment = (definition: string, columnInfo: ColumnInfo): string => {
  if (columnInfo.comment) {
    definition += sp(6, `comment: '%s',\n`, columnInfo.comment);
  }
  return definition;
};

/**
 * Adds a default value property to the column definition.
 * Handles different default value types including literals, constants, and date/time functions.
 * Special handling for date types to use Sequelize.literal for CURRENT_TIMESTAMP and similar functions.
 * @param definition - The current column definition string being built
 * @param columnInfo - Column metadata containing default value information
 * @returns The updated definition string with default value property added if present
 * @example
 * ```typescript
 * // For a numeric default
 * addDefaultValue(definition, columnInfo)
 * // Returns definition with: "defaultValue: 0,\n"
 *
 * // For a timestamp default
 * addDefaultValue(definition, columnInfo)
 * // Returns definition with: "defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),\n"
 * ```
 */
const addDefaultValue = (definition: string, columnInfo: ColumnInfo): string => {
  if (columnInfo.defaultValue) {
    if (!TypeUtils.isDate(columnInfo.type)) {
      definition += sp(6, `defaultValue: %s,\n`, columnInfo.defaultValue);
    } else {
      if (columnInfo.defaultValueRaw?.startsWith?.('CURRENT_')) {
        definition += sp(6, `defaultValue: Sequelize.literal('%s'),\n`, columnInfo.defaultValueRaw);
      }
    }
  }
  return definition;
};

/**
 * Generates a complete Sequelize column definition string for use in migration files.
 * This function orchestrates the creation of all column properties including type, constraints,
 * comments, and default values to produce a valid queryInterface.createTable column definition.
 * @param columnInfo - Comprehensive column metadata including type, constraints, and properties
 * @returns A fully formatted string defining the column for Sequelize's queryInterface.createTable
 * @example
 * ```typescript
 * generateColumnDefinition(columnInfo)
 * // Returns: "  userId: {\n    type: Sequelize.INTEGER,\n    allowNull: false,\n    primaryKey: true,\n  },\n"
 * ```
 */
const generateColumnDefinition = (columnInfo: ColumnInfo): string => {
  let definition = sp(4, `%s: {\n`, columnInfo.propertyName);

  definition = addFieldProperty(definition, columnInfo);
  definition = addTypeDefinition(definition, columnInfo);
  definition = addPrimaryAndAutoIncrement(definition, columnInfo);
  definition = addComment(definition, columnInfo);
  definition = addDefaultValue(definition, columnInfo);

  definition += sp(6, `allowNull: %s,\n`, String(columnInfo.flags.nullable));
  definition += sp(4, `},\n`);

  return definition;
};

/**
 * Generates migration code for creating a database table with all its columns.
 * Includes the table creation in the up migration and table drop in the down migration.
 * @param params - Object containing table metadata including name, schema, columns, and foreign keys
 * @param vars - Migration variables object to append the generated code to
 * @returns Promise that resolves when the table migration code has been generated
 * @example
 * ```typescript
 * await generateTableInfo({
 *   tableName: "users",
 *   schemaName: "public",
 *   columnsInfo: [...],
 *   tableForeignKeys: [...]
 * }, migrationVars);
 * ```
 */
export const generateTableInfo = async (
  params: { tableName: string; schemaName: string; columnsInfo: ColumnInfo[]; tableForeignKeys: ForeignKey[] },
  vars: { up: string; down: string },
): Promise<void> => {
  const { tableName, columnsInfo, schemaName } = params;

  vars.up += sp(2, `await queryInterface.createTable({ schema: '%s', tableName: '%s' }, {\n`, schemaName, tableName);
  vars.down += sp(2, `// drop '%s' table\n`, tableName);
  vars.down += sp(2, `await queryInterface.dropTable({ schema: '%s', tableName: '%s' });\n`, schemaName, tableName);

  for await (const columnInfo of columnsInfo) {
    vars.up += generateColumnDefinition(columnInfo);
  }

  vars.up += sp(2, `});\n`);
};

/**
 * Generates migration code for creating database table indexes.
 * Handles unique constraints, index types (GIN, GiST, etc.), and comments.
 * @param tableIndexes - Array of table index definitions to generate create statements for
 * @param vars - Migration variables object to append the generated code to
 * @example
 * ```typescript
 * generateCreateIndexes(indexDefinitions, migrationVars);
 * // Appends index creation code to vars.up
 * ```
 */
export const generateCreateIndexes = (tableIndexes: TableIndex[], vars: { up: string; down: string }): void => {
  if (!tableIndexes.length) {
    return;
  }

  vars.up += `\n`;
  vars.up += sp(2, `// create table indexes\n`);

  for (const tableIndex of tableIndexes) {
    let indexDefinition = '';

    if (tableIndex.comment) {
      indexDefinition += sp(2, `// ${tableIndex.comment}\n`);
    }

    indexDefinition += sp(
      2,
      `await queryInterface.addIndex({ schema: '%s', tableName: '%s' }, [%s], {\n`,
      tableIndex.schema,
      tableIndex.table,
      tableIndex.columns.map((x) => `'${x}'`).join(', '),
    );

    indexDefinition += sp(4, `name: '%s',\n`, escape(tableIndex.name));

    if (tableIndex.constraint === 'UNIQUE') {
      indexDefinition += sp(4, `unique: true,\n`);
    }

    if (tableIndex.type) {
      indexDefinition += sp(4, `using: '%s',\n`, tableIndex.type);
    }

    indexDefinition += sp(2, `});\n`);

    vars.up += indexDefinition;
  }
};

/**
 * Generates migration code for removing database table indexes.
 * Creates the drop index statements for the down migration.
 * @param tableIndexes - Array of table index definitions to generate remove statements for
 * @param vars - Migration variables object to append the generated code to
 * @example
 * ```typescript
 * generateRemoveIndexes(indexDefinitions, migrationVars);
 * // Prepends index removal code to vars.down
 * ```
 */
export const generateRemoveIndexes = (tableIndexes: TableIndex[], vars: { up: string; down: string }): void => {
  if (!tableIndexes.length) {
    return;
  }

  let indexedTextBytes = sp(2, `//  drop %s table indexes\n`, tableIndexes.length);
  for (const tableIndex of tableIndexes) {
    indexedTextBytes += sp(2, `await queryInterface.removeIndex({ schema: '%s', tableName: '%s' }, '%s');\n`, tableIndex.schema, tableIndex.table, tableIndex.name);
  }
  vars.down = indexedTextBytes + `\n` + vars.down;
};

/**
 * Generates migration code for a single foreign key constraint.
 * Includes add constraint in up migration and remove constraint in down migration.
 * @param foreignKey - Foreign key definition with reference and rule information
 * @returns Object containing the up and down migration strings for the constraint
 * @example
 * ```typescript
 * generateForeignKeyMigration(fkDefinition)
 * // Returns { up: "await queryInterface.addConstraint...", down: "await queryInterface.removeConstraint..." }
 * ```
 */
const generateForeignKeyMigration = (foreignKey: ForeignKey): { up: string; down: string } => {
  const vars = { up: '', down: '' };

  if (foreignKey.comment) {
    vars.up += sp(2, `// %s\n`, foreignKey.comment);
  }

  vars.up += sp(2, `await queryInterface.addConstraint({ schema: '%s', tableName: '%s' }, {\n`, foreignKey.schema, foreignKey.tableName);
  vars.up += sp(4, `fields: ['%s'],\n`, foreignKey.columnName);
  vars.up += sp(4, `type: 'foreign key',\n`);
  vars.up += sp(4, `name: '%s',\n`, foreignKey.constraintName);

  if (foreignKey.defaultValue) {
    vars.up += sp(4, `defaultValue: '%s',\n`, foreignKey.defaultValue);
  }

  vars.up += sp(4, `references: {\n`);
  vars.up += sp(6, `table: '%s',\n`, foreignKey.referenced.table);
  vars.up += sp(6, `field: '%s',\n`, foreignKey.referenced.column);
  vars.up += sp(4, `},\n`);

  if (foreignKey.rule.update) {
    vars.up += sp(4, `onUpdate: '%s',\n`, foreignKey.rule.update);
  }

  if (foreignKey.rule.delete) {
    vars.up += sp(4, `onDelete: '%s',\n`, foreignKey.rule.delete);
  }

  if (foreignKey.isDeferrable) {
    vars.up += sp(4, `deferrable: true,\n`);
  }

  vars.up += sp(2, `});\n`);

  vars.down += sp(
    2,
    `await queryInterface.removeConstraint({ schema: '%s', tableName: '%s' }, '%s');\n`,
    foreignKey.schema,
    foreignKey.tableName,
    foreignKey.constraintName,
  );

  return vars;
};

/**
 * Generates migration code for adding foreign key constraints to tables.
 * Processes an array of foreign keys and adds their creation/removal code to the migration.
 * @param foreignKeys - Array of foreign key definitions to generate migration code for
 * @param vars - Migration variables object to append the generated code to
 * @example
 * ```typescript
 * generateForeignKeys(foreignKeyDefinitions, migrationVars);
 * // Appends all foreign key creation code to vars.up and removal code to vars.down
 * ```
 */
export const generateForeignKeys = (foreignKeys: ForeignKey[], vars: { up: string; down: string }): void => {
  console.log('Generating foreign keys...');
  if (!foreignKeys.length) return;

  for (const foreignKey of foreignKeys) {
    const fkVars = generateForeignKeyMigration(foreignKey);
    vars.up += fkVars.up;
    vars.down += fkVars.down;
  }
};
