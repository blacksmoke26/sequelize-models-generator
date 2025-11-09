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

// helpers
import StringHelper from '~/helpers/StringHelper';

// utils
import TypeUtils from '~/classes/TypeUtils';
import TableUtils from '~/classes/TableUtils';

// types
import { ForeignKey, Relationship, TableIndex } from '~/typings/utils';

/**
 * Template variables for generating a Sequelize model
 * Contains all necessary components for building a complete model file including
 * imports, definitions, attributes, and configurations.
 */
export interface ModelTemplateVars {
  /** Database schema name where the table resides */
  schemaName: string;
  /** Import statements for required external modules and dependencies */
  imports: string;
  /** Import statements for related models used in associations */
  modelsImport: string;
  /** Name of the database table being modeled */
  tableName: string;
  /** Generated name of the TypeScript model class (PascalCase) */
  modelName: string;
  /** Generated TypeScript enum definitions for enum-type columns */
  enums: string;
  /** Generated TypeScript interface definitions for complex types */
  interfaces: string;
  /** Generated TypeScript field declarations with proper typing */
  fields: string;
  /** Generated Sequelize association declarations (belongsTo, hasMany, etc.) */
  associations: string;
  /** Generated Sequelize attribute configurations for the model */
  attributes: string;
  /** Generated model options configuration (tableName, schema, timestamps, etc.) */
  options: string;
  /** Import statements for custom type definitions */
  typesImport: string;
}

/**
 * Template variables for generating model initializer files
 * Contains components needed for the main index/init file that sets up all models
 */
export interface InitTemplateVars {
  /** Import statements for all generated model classes */
  importClasses: string;
  /** Import statements for type definitions used across models */
  importTypes: string;
  /** Generated model association setup code */
  associations: string;
  /** Export statements for all generated model classes */
  exportClasses: string;
}

/**
 * Utility function that adds leading spaces and formats a string using sprintf
 * @param count - Number of spaces to prepend to the formatted string
 * @param str - Format string template (optional, defaults to empty string)
 * @param args - Arguments to be passed to sprintf for string formatting (optional)
 * @returns Formatted string with the specified number of leading spaces
 */
export const sp = (count: number, str: string = '', ...args: any[]) => ' '.repeat(count) + sprintf(str, ...args);

/**
 * Abstract class for generating Sequelize model templates
 * Contains public static methods for creating template variables and generating various model components
 */
export default abstract class ModelGenerator {
  /**
   * Creates a new ModelTemplateVars object with all properties initialized to empty strings
   * Merges any provided partial variables with the defaults
   * @param vars - Partial template variables to merge with default values
   * @returns Complete ModelTemplateVars object with all properties initialized
   */
  public static getModelTemplateVars = (vars: Partial<ModelTemplateVars> = {}): ModelTemplateVars => {
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
   * Creates a new InitTemplateVars object with all properties initialized to empty strings
   * Merges any provided partial variables with the defaults
   * @param vars - Partial template variables to merge with default values
   * @returns Complete InitTemplateVars object with all properties initialized
   */
  public static getInitializerTemplateVars = (vars: Partial<InitTemplateVars> = {}): InitTemplateVars => {
    return {
      importClasses: '',
      importTypes: '',
      associations: '',
      exportClasses: '',
      ...vars,
    };
  };

  /**
   * Determines the appropriate TypeScript type for a database column
   * Handles special cases for enum types (creates enum reference) and JSON types
   * @param columnInfo - Complete column information including type parameters
   * @param modelName - Name of the model being generated (used for enum naming)
   * @returns TypeScript type string for the column
   */
  private static determineTsType = (columnInfo: ColumnInfo, modelName: string): string => {
    if (SequelizeParser.isEnum(columnInfo.sequelizeTypeParams)) {
      return modelName + pascal(columnInfo.name);
    }
    if (SequelizeParser.isJSON(columnInfo.sequelizeTypeParams)) {
      return TableUtils.toJsonColumnTypeName(columnInfo.table, columnInfo.name);
    }
    return columnInfo.tsType;
  };

  /**
   * Determines the type annotation text for field declarations in the model
   * Handles foreign keys, primary keys, and nullable fields with appropriate Sequelize types
   * @param options - Configuration object containing column type information
   * @param options.isFK - Whether the column is a foreign key referencing another table
   * @param options.isPrimary - Whether the column is a primary key
   * @param options.isNullable - Whether the column allows null values
   * @param options.tsType - Base TypeScript type for the column
   * @param options.targetTable - Name of the referenced table (for foreign keys)
   * @param options.targetColumn - Name of the referenced column (for foreign keys)
   * @returns Formatted type annotation string for the field declaration
   */
  private static determineTypeText = ({
    isFK,
    isPrimary,
    isNullable,
    tsType,
    targetTable,
    targetColumn
  }: {
    isFK: boolean;
    isPrimary: boolean;
    isNullable: boolean;
    tsType: string;
    targetTable: string | null;
    targetColumn: string | null;
  }): string => {
    if (isFK && !isPrimary) {
      return sp(0, `Sequelize.ForeignKey<%s['%s']>`, StringHelper.tableToModel(targetTable), StringHelper.toPropertyName(targetColumn));
    }
    return sp(0, isNullable || isPrimary ? `Sequelize.CreationOptional<%s>` : `%s`, tsType);
  };

  /**
   * Adds appropriate JSDoc comments for field declarations
   * Generates default comment for primary keys if none exists, or uses column comment
   * @param vars - Template variables object where the field text will be appended
   * @param columnInfo - Column information containing comment and flag data
   */
  private static addFieldComment = (vars: ModelTemplateVars, columnInfo: ColumnInfo): void => {
    if (columnInfo.flags.primary && !columnInfo.comment) {
      vars.fields += sp(2, '/** The unique identifier for the %s */\n', singular(columnInfo.table));
    }
    if (columnInfo.comment) {
      vars.fields += sp(2, '/** %s */\n', columnInfo.comment);
    }
  };

  /**
   * Generates TypeScript field declarations for a model column with proper typing and modifiers
   * Handles readonly for primary keys, nullable markers, and foreign key references
   * @param columnInfo - Column information including type, flags, and naming
   * @param vars - Template variables object to modify with generated field declaration
   * @param modelName - Name of the model being generated (used for type resolution)
   * @param options - Configuration object containing foreign key relationship information
   * @param options.isFK - Whether the column is a foreign key
   * @param options.targetTable - Name of the referenced table (if foreign key)
   * @param options.targetColumn - Name of the referenced column (if foreign key)
   */
  public static generateFields = (
    columnInfo: ColumnInfo,
    vars: ModelTemplateVars,
    modelName: string,
    { isFK, targetTable, targetColumn }: { targetTable: string | null; targetColumn: string | null; isFK: boolean },
  ) => {
    const readOnly = columnInfo.flags.primary ? 'readonly ' : '';
    const tsType = this.determineTsType(columnInfo, modelName);

    this.addFieldComment(vars, columnInfo);

    const typeText = this.determineTypeText({
      isFK,
      isPrimary: columnInfo.flags.primary,
      isNullable: columnInfo.flags.nullable,
      tsType,
      targetTable,
      targetColumn
    });

    const nullable = columnInfo.flags.nullable ? '?' : '';
    vars.fields += sp(2, `%sdeclare %s%s: %s;\n`, readOnly, columnInfo.propertyName, nullable, typeText);
  };

  /**
   * Generates a TypeScript interface definition for a column
   * Creates an interface with generic string index signature for JSON columns
   * @param columnInfo - Column information containing table name and interface definition
   * @param interfacesVars - Object containing the accumulated interface text
   */
  private static generateInterfaceDefinition = (columnInfo: ColumnInfo, interfacesVars: { text: string }): void => {
    const typeName = TableUtils.toJsonColumnTypeName(columnInfo.table, columnInfo.name);

    if (!columnInfo?.tsInterface || !columnInfo?.tsInterface?.includes?.('interface')) {
      interfacesVars.text += sp(0, `\n/** Interface representing the structure of the '%s'.'%s' metadata field. */\n`, columnInfo.table, columnInfo.name);
      interfacesVars.text += sp(0, `\nexport interface %s {\n`, typeName);
      interfacesVars.text += sp(2, `[p: string]: unknown;\n`);
      interfacesVars.text += sp(0, `}\n`);
    } else {
      interfacesVars.text += sp(0, `\nexport %s\n`, columnInfo?.tsInterface.trim());
    }
  };

  /**
   * Generates TypeScript interfaces for complex column types (primarily JSON columns)
   * Creates the interface definition and adds the appropriate type import
   * @param columnInfo - Column information including type and interface definition
   * @param vars - Template variables object to modify with type imports
   * @param interfacesVars - Object containing the generated interface text
   */
  public static generateInterfaces = (columnInfo: ColumnInfo, vars: ModelTemplateVars, interfacesVars: { text: string }) => {
    if (!TypeUtils.isJSON(columnInfo.type)) {
      return;
    }

    this.generateInterfaceDefinition(columnInfo, interfacesVars);

    const typeName = TableUtils.toJsonColumnTypeName(columnInfo.table, columnInfo.name);
    vars.typesImport += sp(0, ', %s', typeName);
  };

  /**
   * Formats enum values for TypeScript enum generation
   * Converts values to PascalCase keys with string values
   * @param values - Array of enum string values
   * @returns Formatted string containing all enum member definitions
   */
  private static generateEnumValues = (values: string[]): string => {
    return values.map((x) => sp(2, `%s = '%s',\n`, pascal(x), x)).join('');
  };

  /**
   * Generates TypeScript enum definitions for database columns with enum types
   * Creates a named enum with PascalCase keys and documentation
   * @param columnInfo - Column information containing enum type parameters
   * @param vars - Template variables object to modify with generated enum
   * @param modelName - Name of the model (used to prefix the enum name)
   */
  public static generateEnums = (columnInfo: ColumnInfo, vars: ModelTemplateVars, modelName: string) => {
    const values = SequelizeParser.parseEnums(columnInfo.sequelizeTypeParams);
    if (!values.length) return;

    vars.enums += sp(0, `\n/** Enum representing possible %s values for a %s. */\n`, columnInfo.name, singular(columnInfo.table));
    vars.enums += sp(0, `export enum %s%s {\n`, modelName, pascal(columnInfo.name));
    vars.enums += this.generateEnumValues(values);
    vars.enums += sp(0, `}\n`);
  };

  /**
   * Generates basic model configuration options
   * Sets up sequelize instance, schema, and table name
   * @param modTplVars - Template variables object to modify with options
   * @param options - Configuration containing schema and table names
   */
  private static generateBasicOptions = (
    modTplVars: ModelTemplateVars,
    { schemaName, tableName }: { schemaName: string; tableName: string }
  ): void => {
    modTplVars.options += sp(4, `sequelize: getInstance(),\n`);
    modTplVars.options += sp(4, `schema: '%s',\n`, schemaName);
    modTplVars.options += sp(4, `tableName: '%s',\n`, tableName);
  };

  /**
   * Generates timestamp configuration options for the model
   * Handles createdAt and updatedAt timestamps with individual control
   * @param modTplVars - Template variables object to modify with timestamp options
   * @param hasCreatedAt - Whether the model should track creation timestamps
   * @param hasUpdatedAt - Whether the model should track update timestamps
   */
  private static generateTimestampOptions = (
    modTplVars: ModelTemplateVars,
    { hasCreatedAt, hasUpdatedAt }: { hasCreatedAt: boolean; hasUpdatedAt: boolean }
  ): void => {
    modTplVars.options += sp(4, `timestamps: %s,\n`, hasCreatedAt && hasUpdatedAt ? 'true' : 'false');

    if (!hasUpdatedAt && hasCreatedAt) {
      modTplVars.options += sp(4, `createdAt: true,\n`);
    }

    if (!hasCreatedAt && hasUpdatedAt) {
      modTplVars.options += sp(4, `updatedAt: true,\n`);
    }
  };

  /**
   * Generates complete model options configuration
   * Combines basic options (schema, table) with timestamp configurations
   * @param modTplVars - Template variables object to modify with all options
   * @param options - Complete configuration including schema, table, and timestamp settings
   */
  public static generateOptions = (
    modTplVars: ModelTemplateVars,
    options: { schemaName: string; tableName: string; hasCreatedAt: boolean; hasUpdatedAt: boolean }
  ) => {
    this.generateBasicOptions(modTplVars, options);
    this.generateTimestampOptions(modTplVars, options);
  };

  /**
   * Generates a single database index configuration for the model
   * Creates index definition with name, fields, type, and uniqueness properties
   * @param modTplVars - Template variables object to modify with index configuration
   * @param index - Complete index definition including columns and properties
   */
  private static generateSingleIndex = (modTplVars: ModelTemplateVars, index: TableIndex): void => {
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
  };

  /**
   * Generates index configurations for all table indexes
   * Wraps individual index definitions in the indexes array property
   * @param indexes - Array of all table indexes to generate configurations for
   * @param modTplVars - Template variables object to modify with index array
   */
  public static generateIndexes = (indexes: TableIndex[], modTplVars: ModelTemplateVars) => {
    if (!indexes.length) return;

    modTplVars.options += sp(4, `indexes: [\n`);
    for (const index of indexes) {
      this.generateSingleIndex(modTplVars, index);
    }
    modTplVars.options += sp(4, `]\n`);
  };

  /**
   * Generates the field name and field property for a column attribute
   * Creates the attribute object and adds field mapping if property name differs from column name
   * @param columnInfo - Column information containing name and property name
   * @param modTplVars - Template variables object to modify with attribute definition
   */
  private static generateAttributeField = (columnInfo: ColumnInfo, modTplVars: ModelTemplateVars): void => {
    modTplVars.attributes += sp(4, `%s: {\n`, columnInfo.propertyName);

    if (columnInfo.propertyName !== columnInfo.name) {
      modTplVars.attributes += sp(6, `field: '%s',\n`, columnInfo.name);
    }
  };

  /**
   * Generates the reference configuration for foreign key attributes
   * Creates the references object with model and key properties for foreign keys
   * @param foreignKey - Foreign key relationship information
   * @param modTplVars - Template variables object to modify with reference configuration
   */
  private static generateAttributeReference = (foreignKey: ForeignKey | null, modTplVars: ModelTemplateVars): void => {
    if (!foreignKey) return;

    modTplVars.attributes += sp(6, `references: {\n`);
    modTplVars.attributes += sp(8, `model: %s,\n`, StringHelper.tableToModel(foreignKey.referenced.table));
    modTplVars.attributes += sp(8, `key: '%s',\n`, StringHelper.toPropertyName(foreignKey.referenced.column));

    if (foreignKey.isDeferrable) {
      modTplVars.attributes += sp(8, `deferrable: true,\n`);
    }

    modTplVars.attributes += sp(6, `},\n`);
  };

  /**
   * Generates the type configuration for a column attribute
   * Handles various type formats including quoted types, commented types, raw types, and standard DataTypes
   * @param columnInfo - Column information containing sequelize type parameters
   * @param modTplVars - Template variables object to modify with type configuration
   */
  private static generateAttributeType = (columnInfo: ColumnInfo, modTplVars: ModelTemplateVars): void => {
    let sequelizeType = columnInfo.sequelizeTypeParams;

    if (!sequelizeType || sequelizeType === 'null') {
      modTplVars.attributes += sp(6, `type: DataTypes.%s, // TODO Set data type here. \n`, 'UNKNOWN');
      return;
    }

    if (sequelizeType.startsWith('$QUOTE')) {
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
  };

  /**
   * Generates flag configurations for a column attribute
   * Adds primaryKey and autoIncrement flags when applicable
   * @param columnInfo - Column information containing various boolean flags
   * @param modTplVars - Template variables object to modify with flag configurations
   */
  private static generateAttributeFlags = (columnInfo: ColumnInfo, modTplVars: ModelTemplateVars): void => {
    if (columnInfo.flags.primary) {
      modTplVars.attributes += sp(6, `primaryKey: true,\n`);
    }

    if (columnInfo.flags.autoIncrement) {
      modTplVars.attributes += sp(6, `autoIncrement: true,\n`);
    }
  };

  /**
   * Generates default value configuration for a column attribute
   * Handles JSON, date, and primitive value defaults with appropriate formatting
   * @param columnInfo - Column information containing default value and type
   * @param modTplVars - Template variables object to modify with default value configuration
   */
  private static generateAttributeDefault = (columnInfo: ColumnInfo, modTplVars: ModelTemplateVars): void => {
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
  };

  /**
   * Generates complete Sequelize model attribute configurations for a column
   * Combines field definition, references, type, flags, comments, defaults, and nullable settings
   * @param columnInfo - Complete column information including type, flags, and properties
   * @param modTplVars - Template variables object to modify with generated attribute configuration
   * @param tableForeignKeys - Array of all foreign key relationships for the table
   */
  public static generateAttributes = ({
    columnInfo,
    modTplVars,
    tableForeignKeys,
  }: {
    columnInfo: ColumnInfo;
    modTplVars: ModelTemplateVars;
    tableForeignKeys: ForeignKey[];
  }) => {
    const foreignKey = tableForeignKeys.find((x) => x.columnName === columnInfo.name) ?? null;

    this.generateAttributeField(columnInfo, modTplVars);
    this.generateAttributeReference(foreignKey, modTplVars);
    this.generateAttributeType(columnInfo, modTplVars);
    this.generateAttributeFlags(columnInfo, modTplVars);

    if (columnInfo.comment) {
      modTplVars.attributes += sp(6, `comment: '%s',\n`, columnInfo.comment);
    }

    this.generateAttributeDefault(columnInfo, modTplVars);

    modTplVars.attributes += sp(6, `allowNull: %s,\n`, String(columnInfo.flags.nullable));
    modTplVars.attributes += sp(4, `},\n`);
  };

  /**
   * Generates import statement for a single related model
   * Tracks imported models to avoid duplicates and adds import statement to modelsImport
   * @param modTplVars - Template variables object to modify with import statements
   * @param tableRelation - Relationship configuration containing target model information
   * @param imported - Array tracking already imported table names to prevent duplicates
   */
  private static generateSingleModelImport = (
    modTplVars: ModelTemplateVars,
    tableRelation: Relationship,
    imported: string[]
  ): void => {
    if (imported.includes(tableRelation.target.table)) return;

    imported.push(tableRelation.target.table);
    modTplVars.modelsImport += sp(
      0,
      "import %s from './%s';\n",
      StringHelper.tableToModel(tableRelation.target.table),
      StringHelper.tableToModel(tableRelation.target.table),
    );
  };

  /**
   * Generates import statements for all related models used in associations
   * Creates a section of imports for models referenced by foreign keys and relationships
   * @param tableRelations - Array of all relationship configurations for the table
   * @param modTplVars - Template variables object to modify with generated import statements
   */
  public static generateRelationsImports = (tableRelations: Relationship[], modTplVars: ModelTemplateVars) => {
    if (!tableRelations.length) return;

    const imported: string[] = [];
    modTplVars.modelsImport += `\n\n// models\n`;

    for (const tableRelation of tableRelations) {
      this.generateSingleModelImport(modTplVars, tableRelation, imported);
    }
  };
}
