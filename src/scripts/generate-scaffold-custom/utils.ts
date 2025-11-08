/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import { sprintf } from 'sprintf-js';
import { pascal } from 'case';
import { singular } from 'pluralize';

// classes
import { ColumnInfo } from '~/classes/TableColumns';

// parsers
import SequelizeParser from '~/parsers/SequelizeParser';
import TypeScriptTypeParser from '~/parsers/TypeScriptTypeParser';

// helpers
import StringHelper from '~/helpers/StringHelper';

// utils
import TypeUtils from '~/classes/TypeUtils';
import TableUtils from '~/classes/TableUtils';

// types
import { ForeignKey, Relationship, TableIndex } from '~/typings/utils';

/**
 * Template variables for generating a Sequelize model
 */
export interface ModelTemplateVars {
  /** Database schema name */
  schemaName: string;
  /** Import statements for required modules */
  imports: string;
  /** Import statements for required models */
  modelsImport: string;
  /** Database table name */
  tableName: string;
  /** Generated model class name */
  modelName: string;
  /** Generated enum definitions */
  enums: string;
  /** Generated interface definitions */
  interfaces: string;
  /** Generated model field declarations */
  fields: string;
  /** Generated model association declarations */
  associations: string;
  /** Generated model attribute configurations */
  attributes: string;
  /** Generated model options configuration */
  options: string;
  /** Import statements for typings */
  typesImport: string;
}

/**
 * Template variables for generating model initializers
 */
export interface InitTemplateVars {
  /** Import statements for model classes */
  importClasses: string;
  /** Import statements for type definitions */
  importTypes: string;
  /** Generated model association declarations */
  associations: string;
  /** Export statements for model classes */
  exportClasses: string;
}

/**
 * Adds spacing and formats a string using sprintf
 * @param count - Number of spaces to prepend
 * @param str - String to format (optional)
 * @param args - Arguments for sprintf (optional)
 * @returns Formatted string with leading spaces
 */
export const sp = (count: number, str: string = '', ...args: any[]) => ' '.repeat(count) + sprintf(str, ...args);

/**
 * Creates a new ModelTemplateVars object with default values
 * @param vars - Partial template variables to merge with defaults
 * @returns Complete ModelTemplateVars object
 */
export const getModelTemplateVars = (vars: Partial<ModelTemplateVars> = {}): ModelTemplateVars => {
  return {
    schemaName: '',
    imports: '',
    modelsImport: '',
    modelName: '',
    enums: '',
    interfaces: '',
    tableName: '',
    fields: '',
    associations: '',
    attributes: '',
    options: '',
    typesImport: '',
    ...vars,
  };
};

/**
 * Creates a new InitTemplateVars object with default values
 * @param vars - Partial template variables to merge with defaults
 * @returns Complete InitTemplateVars object
 */
export const getInitializerTemplateVars = (vars: Partial<InitTemplateVars> = {}): InitTemplateVars => {
  return {
    importClasses: '',
    importTypes: '',
    associations: '',
    exportClasses: '',
    ...vars,
  };
};

/**
 * Generates TypeScript field declarations for a model column
 * @param columnInfo - Column information including type and flags
 * @param vars - Template variables object to modify
 * @param modelName - Name of the model being generated
 * @param options - Object containing foreign key information
 * @param options.isFK - Whether the column is a foreign key
 * @param options.targetTable - Target table name if it's a foreign key
 * @param options.targetColumn - Target column name if it's a foreign key
 */
export const generateFields = (
  columnInfo: ColumnInfo,
  vars: ModelTemplateVars,
  modelName: string,
  { isFK, targetTable, targetColumn }: { targetTable: string | null; targetColumn: string | null; isFK: boolean },
) => {
  const readOnly = columnInfo.flags.primary ? 'readonly ' : '';

  let tsType = columnInfo.tsType;

  if (SequelizeParser.isEnum(columnInfo.sequelizeTypeParams)) {
    tsType = modelName + pascal(columnInfo.name);
  } else if (SequelizeParser.isJSON(columnInfo.sequelizeTypeParams)) {
    tsType = TableUtils.toJsonColumnTypeName(columnInfo.table, columnInfo.name);
  }

  if (columnInfo.flags.primary && !columnInfo.comment) {
    vars.fields += sp(2, '/** The unique identifier for the %s */\n', singular(columnInfo.table));
  }

  if (columnInfo.comment) {
    vars.fields += sp(2, '/** %s */\n', columnInfo.comment);
  }

  let typeText: string = '';

  if (isFK && !columnInfo.flags.primary) {
    typeText = sp(0, `Sequelize.ForeignKey<%s['%s']>`, StringHelper.tableToModel(targetTable), StringHelper.toPropertyName(targetColumn));
  } else {
    typeText = sp(0, columnInfo.flags.nullable || columnInfo.flags.primary ? `Sequelize.CreationOptional<%s>` : `%s`, tsType);
  }
  const nullable = columnInfo.flags.nullable ? '?' : '';

  vars.fields += sp(2, `%sdeclare %s%s: %s;\n`, readOnly, columnInfo.propertyName, nullable, typeText);
};

/**
 * Generates TypeScript interfaces for complex column types
 * @param columnInfo - Column information including interface definition
 * @param vars - Template variables object to modify
 * @param interfacesVars - Object containing generated interface text
 * @param dirname - Directory name for type imports
 */
export const generateInterfaces = (columnInfo: ColumnInfo, vars: ModelTemplateVars, interfacesVars: { text: string }, dirname: string) => {
  if (!TypeUtils.isJSON(columnInfo.type)) {
    return;
  }

  const typeName = TableUtils.toJsonColumnTypeName(columnInfo.table, columnInfo.name);

  if (!columnInfo?.tsInterface || !columnInfo?.tsInterface?.includes?.('interface')) {
    interfacesVars.text += sp(0, `\n/** Interface representing the structure of the '%s'.'%s' metadata field. */\n`, columnInfo.table, columnInfo.name);
    interfacesVars.text += sp(0, `\nexport interface %s {\n`, typeName);
    interfacesVars.text += sp(2, `[p: string]: unknown;\n`);
    interfacesVars.text += sp(0, `}\n`);
  } else {
    interfacesVars.text += sp(0, `\nexport %s\n`, columnInfo?.tsInterface.trim());
  }

  vars.typesImport += sp(0, ', %s', typeName);
};

/**
 * Generates TypeScript enums for column enum types
 * @param columnInfo - Column information including enum values
 * @param vars - Template variables object to modify
 * @param modelName - Name of the model being generated
 */
export const generateEnums = (columnInfo: ColumnInfo, vars: ModelTemplateVars, modelName: string) => {
  const values = SequelizeParser.parseEnums(columnInfo.sequelizeTypeParams);
  if (!values.length) return;
  vars.enums += sp(0, `\n/** Enum representing possible %s values for a %s. */\n`, columnInfo.name, singular(columnInfo.table));
  vars.enums += sp(0, `export enum %s%s {\n`, modelName, pascal(columnInfo.name));
  vars.enums += values.map((x) => sp(2, `%s = '%s',\n`, pascal(x), x)).join('');
  vars.enums += sp(0, `}\n`);
};

/**
 * Generates model options configuration
 * @param modTplVars - Template variables object to modify
 * @param options - Configuration options including schema and table names
 */
export const generateOptions = (
  modTplVars: ModelTemplateVars,
  { schemaName, tableName, hasCreatedAt, hasUpdatedAt }: { schemaName: string; tableName: string; hasCreatedAt: boolean; hasUpdatedAt: boolean },
) => {
  modTplVars.options += sp(4, `sequelize: getInstance(),\n`);
  modTplVars.options += sp(4, `schema: '%s',\n`, schemaName);
  modTplVars.options += sp(4, `tableName: '%s',\n`, tableName);

  if (hasCreatedAt && hasUpdatedAt) {
    modTplVars.options += sp(4, `timestamps: %s,\n`, 'true');
  }

  if (!hasCreatedAt || !hasUpdatedAt) {
    modTplVars.options += sp(4, `timestamps: %s,\n`, 'false');
  }

  if (!hasUpdatedAt && hasCreatedAt) {
    modTplVars.options += sp(4, `createdAt: true,\n`);
  }

  if (!hasCreatedAt && hasUpdatedAt) {
    modTplVars.options += sp(4, `updatedAt: true,\n`);
  }
};

/**
 * Generates index configurations for a model
 * @param indexes - Array of table indexes to generate
 * @param modTplVars - Template variables object to modify
 */
export const generateIndexes = (indexes: TableIndex[], modTplVars: ModelTemplateVars) => {
  if (!indexes.length) return;

  modTplVars.options += sp(4, `indexes: [\n`);
  for (const index of indexes) {
    if (index.comment) {
      modTplVars.options += sp(6, `/** %s */\n`, index.comment);
    }

    modTplVars.options += sp(6, `{\n`);
    modTplVars.options += sp(8, `name: '%s',\n`, index.name);
    modTplVars.options += sp(8, `fields: [%s],\n`, index.columns.map((x) => `'${x}'`).join(', '));

    if (index.type) {
      modTplVars.options += sp(8, `using: '%s',\n`, index.type.toUpperCase());
    }

    if (index.constraint === 'UNIQUE') {
      modTplVars.options += sp(8, `unique: true,\n`);
    }

    modTplVars.options += sp(6, `},\n`);
  }
  modTplVars.options += sp(4, `]\n`);
};

/**
 * Generates Sequelize model attribute configurations
 * @param columnInfo - Column information including type, flags, and properties
 * @param modTplVars - Template variables object to modify with generated attributes
 * @param tableForeignKeys - Array of foreign key relationships for the table
 */
export const generateAttributes = ({
  columnInfo,
  modTplVars,
  tableForeignKeys,
}: {
  columnInfo: ColumnInfo;
  modTplVars: ModelTemplateVars;
  tableForeignKeys: ForeignKey[];
}) => {
  const foreignKey = tableForeignKeys.find((x) => x.columnName === columnInfo.name) ?? null;

  modTplVars.attributes += sp(4, `%s: {\n`, columnInfo.propertyName);

  if (columnInfo.propertyName !== columnInfo.name) {
    modTplVars.attributes += sp(6, `field: '%s',\n`, columnInfo.name);
  }

  if (foreignKey) {
    modTplVars.attributes += sp(6, `references: {\n`);
    modTplVars.attributes += sp(8, `model: %s,\n`, StringHelper.tableToModel(foreignKey.referenced.table));
    modTplVars.attributes += sp(8, `key: '%s',\n`, StringHelper.toPropertyName(foreignKey.referenced.column));
    if (foreignKey.isDeferrable) {
      modTplVars.attributes += sp(8, `deferrable: true,\n`);
    }
    modTplVars.attributes += sp(6, `},\n`);
  }

  let sequelizeType = columnInfo.sequelizeTypeParams;

  if (!sequelizeType || sequelizeType === 'null') {
    modTplVars.attributes += sp(6, `type: DataTypes.%s, // TODO Set data type here. \n`, 'UNKNOWN');
  } else if (sequelizeType.startsWith('$QUOTE')) {
    sequelizeType = sequelizeType.replace('$QUOTE.', '');
    modTplVars.attributes += sp(6, `type: '%s',\n`, sequelizeType);
  } else if (sequelizeType.startsWith('$COMMENT')) {
    const [ty, cm] = sequelizeType.replace('$COMMENT.', '').split('|');
    modTplVars.attributes += sp(6, `type: DataTypes.%s, // %s\n`, ty, cm);
  } else if (sequelizeType.startsWith('$RAW')) {
    const [x, y] = sequelizeType.replace('$RAW.', '').split('|');
    sequelizeType = x;
    modTplVars.attributes += sp(6, `type: '%s', // %s\n`, sequelizeType, y || "PostgreSQL's Native Custom (Composite) Type.");
    modTplVars.attributes += sp(6, `get() {\n`);
    modTplVars.attributes += sp(8, `const rawValue = this.getDataValue('%s');\n`, columnInfo.propertyName);
    modTplVars.attributes += sp(8, `// TODO: Implement getter logic here!\n`);
    modTplVars.attributes += sp(8, `return rawValue;\n`);
    modTplVars.attributes += sp(6, `},\n`);

    modTplVars.attributes += sp(6, `set(value: string) {\n`);
    modTplVars.attributes += sp(8, `// TODO: Implement setter logic here!\n`);
    modTplVars.attributes += sp(8, `this.setDataValue('%s', value);\n`, columnInfo.propertyName);
    modTplVars.attributes += sp(6, `},\n`);
  } else {
    if (TypeUtils.isArray(columnInfo.type) || TypeUtils.isRange(columnInfo.type)) {
      sequelizeType = sequelizeType.replace('(', '(DataTypes.');
    }
    modTplVars.attributes += sp(6, `type: DataTypes.%s,\n`, sequelizeType);
  }

  if (columnInfo.flags.primary) {
    modTplVars.attributes += sp(6, `primaryKey: true,\n`);
  }

  if (columnInfo.flags.autoIncrement) {
    modTplVars.attributes += sp(6, `autoIncrement: true,\n`);
  }

  if (columnInfo.comment) {
    modTplVars.attributes += sp(6, `comment: '%s',\n`, columnInfo.comment);
  }

  if (columnInfo.defaultValue) {
    if (TypeUtils.isJSON(columnInfo.type)) {
      const formatted = String(columnInfo.defaultValue ?? '')
        .replaceAll('"', "'")
        .replaceAll('{', '{ ')
        .replaceAll('}', ' }');
      modTplVars.attributes += sp(6, `defaultValue: %s,\n`, formatted);
    } else if (!TypeUtils.isDate(columnInfo.type)) {
      modTplVars.attributes += sp(6, `defaultValue: %s,\n`, columnInfo.defaultValue);
    } else {
      if (columnInfo.defaultValueRaw?.startsWith?.('CURRENT_')) modTplVars.attributes += sp(6, `defaultValue: Sequelize.literal('%s'),\n`, columnInfo.defaultValueRaw);
    }
  }

  modTplVars.attributes += sp(6, `allowNull: %s,\n`, String(columnInfo.flags.nullable));
  modTplVars.attributes += sp(4, `},\n`);
};

/**
 * Generates import statements for related models and ForeignKeys
 * @param tableRelations - Array of relationship configurations
 * @param modTplVars - Template variables object to modify
 */
export const generateRelationsImports = (tableRelations: Relationship[], modTplVars: ModelTemplateVars) => {
  if (!tableRelations.length) return;

  const imported: string[] = [];

  modTplVars.modelsImport += `\n\n// models\n`;
  for (const tableRelation of tableRelations) {
    if (imported.includes(tableRelation.target.table)) continue;

    imported.push(tableRelation.target.table);
    modTplVars.modelsImport += sp(
      0,
      "import %s from './%s';\n",
      StringHelper.tableToModel(tableRelation.target.table),
      StringHelper.tableToModel(tableRelation.target.table),
    );
  }
};
