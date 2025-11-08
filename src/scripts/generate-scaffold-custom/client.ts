/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import fs from 'node:fs';
import path from 'node:path';

import moment from 'moment';
import merge from 'deepmerge';
import { rimraf } from 'rimraf';
import { pascalCase } from 'change-case';

// helpers
import FileHelper from '~/helpers/FileHelper';
import StringHelper from '~/helpers/StringHelper';

// classes
import DbUtils from '~/classes/DbUtils';
import TableColumns from '~/classes/TableColumns';

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
  sp,
} from './utils';
import generateMigrations, { MigrationConfig } from './migration';
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
    this.getBaseDir('migrations');
    this.getBaseDir('seeders');
  }

  /**
   * Gets the migration configuration object
   * @returns The migration configuration
   */
  private getMigrationConfig(): MigrationConfig {
    return {
      timestamp: moment().toDate(),
      getTime(): number {
        this.timestamp = moment(this.timestamp).add(30, 'seconds').toDate();
        return +moment(this.timestamp).format('YYYYMMDDHHmmss');
      },
      dirname: this.getOptions().dirname,
      outDir: this.getBaseDir('migrations'),
      rootDir: this.rootDir,
    };
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
    const schemas = this.dbData.schemas.filter((x) => {
      return !this.getOptions().schemas.length ? true : this.getOptions().schemas.includes(x);
    });

    // Iterate through all database schemas
    for (const schemaName of schemas) {
      // Get all tables for the current schema
      const schemaTables = await this.getSchemaTables(schemaName);

      // Process each table asynchronously
      for await (const tableName of schemaTables) {
        // Filter relationships for the current table
        const tableRelations = this.dbData.relationships.filter((x) => x.source.table === tableName) ?? [];

        // Convert table name to PascalCase model name
        const modelName = this.getModelName(tableName);
        // Filter indexes for the current table
        const tableIndexes = this.dbData.indexes.filter((x) => x.table === tableName && x.schema === schemaName);
        // Filter foreign keys for the current table
        const tableForeignKeys = this.dbData.foreignKeys.filter((x) => x.tableName === tableName && x.schema === schemaName);

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
        const columnsInfo = await TableColumns.list(this.knex, tableName, schemaName);

        // Check if table has timestamp columns
        const hasCreatedAt: boolean = columnsInfo.findIndex((x) => /^created(_a|A)t$/.test(x.name)) !== -1;
        const hasUpdatedAt: boolean = columnsInfo.findIndex((x) => /^updated(_a|A)t$/.test(x.name)) !== -1;

        // Process each column
        for (const columnInfo of columnsInfo) {
          // Find relation for the current column
          const relation = tableRelations.find((x) => x.source.column === columnInfo.name) ?? null;

          // Generate various model components
          generateEnums(columnInfo, modTplVars, modelName);
          generateInterfaces(columnInfo, modTplVars, interfacesVar, this.getOptions().dirname);
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
          modTplVars.typesImport = sp(0, `import type { %s } from '~/%s/typings/models';\n`, modTplVars.typesImport.replace(/^, /, ''), this.getOptions().dirname);
          modTplVars.typesImport = `\n// types\n` + modTplVars.typesImport;
        }

        // Render and save the model file
        const fileName = FileHelper.join(this.getBaseDir('models'), `${modelName}.ts`);
        renderOut('model-template', fileName, { ...modTplVars, dirname: this.getOptions().dirname });
        console.log('Model generated:', fileName);

        if (!config.anyModelName) {
          config.anyModelName = modelName;
        }

        // Generate repository file for the model
        writeRepoFile(this.getBaseDir(), StringHelper.tableToModel(tableName), this.getOptions().dirname);
      }
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

    this.generateModels(initTplVars, interfacesVar, config);

    renderOut('types/models.d', FileHelper.join(this.getBaseDir(), 'typings/models.d.ts'), {
      text: interfacesVar.text.replaceAll(`\n\n\n`, `\n\n`),
    });

    writeServerFile(FileHelper.dirname(this.getBaseDir()), config.anyModelName, this.getOptions().dirname);
    generateInitializer(this.dbData.relationships, initTplVars);

    const fileName = FileHelper.join(this.getBaseDir('models'), 'index.ts');
    renderOut('models-initializer', fileName, initTplVars);
    console.log('Models Initializer generated:', fileName);

    // generate migration files
    await generateMigrations({
      knex: this.knex,
      schemas: this.dbData.schemas,
      indexes: this.dbData.indexes,
      foreignKeys: this.dbData.foreignKeys,
      config: this.getMigrationConfig(),
    });

    // generate ERD diagrams
    await writeDiagrams(path.normalize(`${this.getBaseDir()}/diagrams`));
  }
}
