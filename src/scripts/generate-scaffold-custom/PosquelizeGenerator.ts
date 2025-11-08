/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import fs from 'node:fs';
import path from 'node:path';

import merge from 'deepmerge';
import { rimraf } from 'rimraf';
import { pascalCase } from 'change-case';

// helpers
import FileHelper from '~/helpers/FileHelper';
import StringHelper from '~/helpers/StringHelper';

// classes
import DbUtils from '~/classes/DbUtils';
import MigrationGenerator from './MigrationGenerator';
import TableColumns, { type ColumnInfo } from '~/classes/TableColumns';

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
  InitTemplateVars,
  ModelTemplateVars,
  sp,
} from './utils';
import { generateAssociations, generateInitializer } from './associations';
import { renderOut, writeBaseFiles, writeDiagrams, writeRepoFile, writeServerFile } from './writer';

// types
import type { Knex } from 'knex';
import type { ForeignKey, Relationship, TableIndex } from '~/typings/utils';

/**
 * Configuration options for the generator
 */
export interface GeneratorOptions {
  /*generate?: {
    /!**
     * @default true
     *!/
    ddmlDiagram?: boolean;
    repositories?: boolean;
    migrations?: boolean;
    seeders?: boolean;
    relationships?: boolean;
    jsonTypes?: boolean;
  };*/
  /**
   * The directory name where generated files will be placed
   * @default 'database'
   */
  dirname?: string;
  /**
   * List of schemas to generate models for
   */
  schemas?: string[];
  /**
   * List of tables to generate models for
   */
  tables?: string[];
  /**
   * Whether to clean the root directory before generation
   * @default false
   */
  cleanRootDir?: boolean;
}

/**
 * Generates Sequelize models, migrations, and related files from a database schema
 */
export default class PosquelizeGenerator {
  /**
   * Database metadata including schemas, indexes, relationships, and foreign keys
   */
  private dbData: {
    schemas: Readonly<string[]>;
    indexes: TableIndex[];
    relationships: Relationship[];
    foreignKeys: ForeignKey[];
  } = {
    schemas: [],
    indexes: [],
    relationships: [],
    foreignKeys: [],
  };

  /**
   * Creates a new instance of PosquelizeGenerator
   * @param knex The Knex instance for database operations
   * @param rootDir The root directory where files will be generated
   * @param options Optional configuration for the generator
   */
  constructor(
    public readonly knex: Knex,
    public readonly rootDir: string,
    public readonly options: GeneratorOptions = {},
  ) {}

  /**
   * Gets the merged generator options with defaults
   * @returns The merged configuration options
   */
  public getOptions(): GeneratorOptions {
    return merge(
      {
        schemas: [],
        tables: [],
        dirname: 'database',
        cleanRootDir: false,
      },
      this.options,
    );
  }

  /**
   * Gets the base directory path, creating it if it doesn't exist
   * @param joins Additional path segments to join
   * @returns The full path to the directory
   */
  private getBaseDir(...joins: string[]): string {
    const dirPath = FileHelper.join(this.rootDir, `src/${this.getOptions().dirname}`, ...joins);

    try {
      fs.mkdirSync(dirPath, { recursive: true });
    } catch {
      // do nothing
    }

    return dirPath;
  }

  /**
   * Initializes the required directory structure
   */
  private initDirs(): void {
    this.getBaseDir('base');
    this.getBaseDir('config');
    this.getBaseDir('typings');
    this.getBaseDir('diagrams');
    this.getBaseDir('repositories');
    this.getBaseDir('seeders');
  }

  /**
   * Fetches database schema information including schemas, indexes, relationships, and foreign keys
   */
  private async fetchData(): Promise<void> {
    console.log('Fetching database information...');
    const [schemas, indexes, relationships, foreignKeys] = await Promise.all([
      DbUtils.getSchemas(this.knex),
      DbUtils.getIndexes(this.knex),
      DbUtils.getRelationships(this.knex),
      DbUtils.getForeignKeys(this.knex),
    ]);

    this.dbData.schemas = schemas;
    this.dbData.indexes = indexes;
    this.dbData.relationships = relationships;
    this.dbData.foreignKeys = foreignKeys;
  }

  /**
   * Converts a table name to a model name in PascalCase
   * @param tableName The database table name
   * @returns The model name in PascalCase
   */
  private getModelName(tableName: string): string {
    return pascalCase(StringHelper.normalizeSingular(tableName));
  }

  /**
   * Gets all tables for a given schema, filtered by the tables option if specified
   * @param schemaName The schema name to get tables for
   * @returns A readonly array of table names
   */
  private async getSchemaTables(schemaName: string): Promise<Readonly<string[]>> {
    const schemaTables = await DbUtils.getTables(this.knex, schemaName);
    return schemaTables.filter((x) => {
      return !this.getOptions().tables.length ? true : this.getOptions().schemas.includes(x);
    });
  }

  /**
   * Generates Sequelize model files for all tables in the specified schemas
   * @param initTplVars Template variables for the initializer file
   * @param interfacesVar Object to accumulate interface definitions
   * @param config Configuration object to track the first generated model name
   */
  private async generateModels(initTplVars: InitTemplateVars, interfacesVar: { text: string }, config: { anyModelName: string }): Promise<void> {
    const schemas = this.getFilteredSchemas();

    for await (const schemaName of schemas) {
      const schemaTables = await this.getSchemaTables(schemaName);

      for await (const tableName of schemaTables) {
        await this.processTable(tableName, schemaName, initTplVars, interfacesVar, config);
      }
    }
  }

  /**
   * Filters schemas based on the generator options
   * @returns Array of filtered schema names
   */
  private getFilteredSchemas(): string[] {
    return this.dbData.schemas.filter((x) => {
      return !this.getOptions().schemas.length ? true : this.getOptions().schemas.includes(x);
    });
  }

  /**
   * Processes a single table to generate its model and related files
   * @param tableName The name of the table to process
   * @param schemaName The schema name containing the table
   * @param initTplVars Template variables for the initializer file
   * @param interfacesVar Object to accumulate interface definitions
   * @param config Configuration object to track the first generated model name
   */
  private async processTable(
    tableName: string,
    schemaName: string,
    initTplVars: InitTemplateVars,
    interfacesVar: { text: string },
    config: { anyModelName: string },
  ): Promise<void> {
    const tableData = this.getTableData(tableName, schemaName);
    const modelName = this.getModelName(tableName);

    this.updateInitializerVars(modelName, initTplVars);
    const modTplVars = getModelTemplateVars({ schemaName, modelName, tableName });

    const columnsInfo = await TableColumns.list(this.knex, tableName, schemaName);
    const timestampInfo = this.getTimestampInfo(columnsInfo);

    this.processColumns(columnsInfo, tableData, modTplVars, modelName, interfacesVar);
    this.generateModelComponents(tableData, modTplVars, schemaName, tableName, timestampInfo);

    this.finalizeTemplateVars(modTplVars);
    this.writeModelFile(modelName, modTplVars);
    this.updateConfig(config, modelName);

    writeRepoFile(this.getBaseDir(), StringHelper.tableToModel(tableName), this.getOptions().dirname);
  }

  /**
   * Retrieves table-specific data including relations, indexes, and foreign keys
   * @param tableName The name of the table
   * @param schemaName The schema name containing the table
   * @returns Object containing table data
   */
  private getTableData(tableName: string, schemaName: string) {
    return {
      relations: this.dbData.relationships.filter((x) => x.source.table === tableName) ?? [],
      indexes: this.dbData.indexes.filter((x) => x.table === tableName && x.schema === schemaName),
      foreignKeys: this.dbData.foreignKeys.filter((x) => x.tableName === tableName && x.schema === schemaName),
    };
  }

  /**
   * Updates the initializer template variables with model information
   * @param modelName The name of the model
   * @param initTplVars The initializer template variables to update
   */
  private updateInitializerVars(modelName: string, initTplVars: InitTemplateVars): void {
    initTplVars.importClasses += sp(0, `import %s from './%s';\n`, modelName, modelName);
    initTplVars.importTypes += sp(0, `export * from './%s';\n`, modelName);
    initTplVars.exportClasses += sp(2, `%s,\n`, modelName);
  }

  /**
   * Determines if the table has timestamp columns
   * @param columnsInfo Array of column information
   * @returns Object indicating presence of created_at and updated_at columns
   */
  private getTimestampInfo(columnsInfo: ColumnInfo[]) {
    return {
      hasCreatedAt: columnsInfo.findIndex((x) => /^created(_a|A)t$/.test(x.name)) !== -1,
      hasUpdatedAt: columnsInfo.findIndex((x) => /^updated(_a|A)t$/.test(x.name)) !== -1,
    };
  }

  /**
   * Processes all columns in a table to generate fields, interfaces, and attributes
   * @param columnsInfo Array of column information
   * @param tableData Table-specific data including relations and foreign keys
   * @param modTplVars Model template variables
   * @param modelName The name of the model
   * @param interfacesVar Object to accumulate interface definitions
   */
  private processColumns(
    columnsInfo: ColumnInfo[],
    tableData: { relations: Relationship[]; foreignKeys: ForeignKey[] },
    modTplVars: ModelTemplateVars,
    modelName: string,
    interfacesVar: { text: string },
  ): void {
    for (const columnInfo of columnsInfo) {
      const relation = tableData.relations.find((x) => x.source.column === columnInfo.name) ?? null;

      generateEnums(columnInfo, modTplVars, modelName);
      generateInterfaces(columnInfo, modTplVars, interfacesVar, this.getOptions().dirname);
      generateFields(columnInfo, modTplVars, modelName, {
        targetTable: relation?.target?.table ?? null,
        targetColumn: relation?.target?.column ?? null,
        isFK: relation !== null,
      });

      generateAttributes({ columnInfo, modTplVars, tableForeignKeys: tableData.foreignKeys });
    }
  }

  /**
   * Generates all model components including relations, options, indexes, and associations
   * @param tableData Table-specific data including relations and indexes
   * @param modTplVars Model template variables
   * @param schemaName The schema name
   * @param tableName The table name
   * @param timestampInfo Timestamp column information
   */
  private generateModelComponents(
    tableData: { relations: Relationship[]; indexes: TableIndex[] },
    modTplVars: ModelTemplateVars,
    schemaName: string,
    tableName: string,
    timestampInfo: { hasCreatedAt: boolean; hasUpdatedAt: boolean },
  ): void {
    generateRelationsImports(tableData.relations, modTplVars);
    generateOptions(modTplVars, { schemaName, tableName, ...timestampInfo });
    generateIndexes(tableData.indexes, modTplVars);
    generateAssociations(tableData.relations, modTplVars, tableName);
  }

  /**
   * Finalizes template variables by trimming whitespace and adding type imports if needed
   * @param modTplVars Model template variables to finalize
   */
  private finalizeTemplateVars(modTplVars: ModelTemplateVars): void {
    modTplVars.modelsImport = modTplVars.modelsImport.trimEnd();
    modTplVars.fields = modTplVars.fields.trimEnd();
    modTplVars.options = modTplVars.options.trimEnd();
    modTplVars.attributes = modTplVars.attributes.trimEnd();

    if (modTplVars.typesImport.trim()) {
      modTplVars.typesImport = sp(0, `import type { %s } from '~/%s/typings/models';\n`, modTplVars.typesImport.replace(/^, /, ''), this.getOptions().dirname);
      modTplVars.typesImport = `\n// types\n` + modTplVars.typesImport;
    }
  }

  /**
   * Writes the model file to disk
   * @param modelName The name of the model
   * @param modTplVars Model template variables
   */
  private writeModelFile(modelName: string, modTplVars: ModelTemplateVars): void {
    const fileName = FileHelper.join(this.getBaseDir('models'), `${modelName}.ts`);
    renderOut('model-template', fileName, { ...modTplVars, dirname: this.getOptions().dirname });
    console.log('Model generated:', fileName);
  }

  /**
   * Updates the configuration with the first model name if not already set
   * @param config Configuration object
   * @param modelName The name of the model
   */
  private updateConfig(config: { anyModelName: string }, modelName: string): void {
    if (!config.anyModelName) {
      config.anyModelName = modelName;
    }
  }

  /**
   * Main method to generate all Sequelize models, migrations, and related files
   */
  public async generate(): Promise<void> {
    if (this.getOptions().cleanRootDir) {
      console.log('Removing leftovers...');
      await rimraf(this.rootDir);
    }

    this.initDirs();

    await this.fetchData();

    const config: {
      anyModelName: string;
    } = { anyModelName: undefined };

    writeBaseFiles(this.getBaseDir(), this.getOptions().dirname);

    const initTplVars = getInitializerTemplateVars();
    const interfacesVar: { text: string } = {
      text: '',
    };

    await this.generateModels(initTplVars, interfacesVar, config);

    renderOut('types/models.d', FileHelper.join(this.getBaseDir(), 'typings/models.d.ts'), {
      text: interfacesVar.text.replaceAll(`\n\n\n`, `\n\n`),
    });

    writeServerFile(FileHelper.dirname(this.getBaseDir()), config.anyModelName, this.getOptions().dirname);
    generateInitializer(this.dbData.relationships, initTplVars);

    const fileName = FileHelper.join(this.getBaseDir('models'), 'index.ts');
    renderOut('models-initializer', fileName, initTplVars);
    console.log('Models Initializer generated:', fileName);

    const migGenerator = new MigrationGenerator(this.knex, {
      schemas: this.dbData.schemas,
      indexes: this.dbData.indexes,
      foreignKeys: this.dbData.foreignKeys,
    }, {
      dirname: this.getOptions().dirname,
      outDir: this.getBaseDir('migrations'),
      rootDir: this.rootDir
    });

    await migGenerator.generate();

    // generate ERD diagrams
    await writeDiagrams(path.normalize(`${this.getBaseDir()}/diagrams`));
  }
}
