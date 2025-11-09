/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import moment from 'moment';
import merge from 'deepmerge';

// classes
import DbUtils from '~/classes/DbUtils';
import MigrationUtils from './MigrationUtils';
import TemplateWriter from './TemplateWriter';
import TableColumns from '~/classes/TableColumns';

// helpers
import FileHelper from '~/helpers/FileHelper';

// types
import type { Knex } from 'knex';
import type { ForeignKey, TableIndex } from '~/typings/utils';

/**
 * Configuration interface for migration generation.
 */
export interface MigrationConfig {
  /** The directory name where the migration is being processed */
  dirname: string;
  /** The output directory where migration files will be generated */
  outDir: string;
  /** The root directory of the project */
  rootDir: string;
  /** The timestamp for the migration generation */
  timestamp: Date;
  /** Function to get the timestamp as a number */
  getTime(): number;
}

/** Interface for migration generation options */
interface MigrationOptions {
  /** The directory name where the migration is being processed */
  dirname: string;
  /** The output directory where migration files will be generated */
  outDir: string;
  /** The root directory of the project */
  rootDir: string;
}

/**
 * Class responsible for generating database migration files
 */
export default class MigrationGenerator {
  /**
   * Creates an instance of MigrationGenerator
   * @param knex - Knex instance for database operations
   * @param data - Migration data containing schemas, indexes and foreign keys
   * @param options - Migration options including directory paths
   */
  constructor(
    public readonly knex: Knex,
    public readonly data: {
      schemas: Readonly<string[]>;
      indexes: TableIndex[];
      foreignKeys: ForeignKey[];
    },
    public readonly options: MigrationOptions,
  ) {}

  /**
   * Gets a copy of the migration options
   * @returns A deep copy of the migration options
   */
  public getOptions(): MigrationOptions {
    return merge({}, this.options);
  }

  /**
   * Gets the migration configuration object
   * @returns The migration configuration with timestamp and directory settings
   */
  private getMigrationConfig(): MigrationConfig {
    return {
      timestamp: moment().toDate(),
      getTime(): number {
        this.timestamp = moment(this.timestamp).add(30, 'seconds').toDate();
        return +moment(this.timestamp).format('YYYYMMDDHHmmss');
      },
      dirname: this.getOptions().dirname,
      outDir: this.getOptions().outDir,
      rootDir: this.getOptions().rootDir,
    };
  }

  /**
   * Generates all migration files including tables, indexes, and seeders
   */
  public async generate(): Promise<void> {
    const config = this.getMigrationConfig();

    console.log('Cleaning up migrations directory...');
    await this.generateDatabaseObjects(config);
    await this.generateTableMigrations(config);
    await this.generateRemainingMigrations(config);
    await this.generateInitialSeeders(config);
  }

  /**
   * Generates migration files for database objects (functions, composites, domains)
   * @param config - Migration configuration
   */
  private async generateDatabaseObjects(config: MigrationConfig): Promise<void> {
    await MigrationUtils.generateFunctions(this.knex, this.data.schemas, config);
    await MigrationUtils.generateComposites(this.knex, this.data.schemas, config);
    await MigrationUtils.generateDomains(this.knex, this.data.schemas, config);
  }

  /**
   * Generates migration files for all tables in all schemas
   * @param config - Migration configuration
   */
  private async generateTableMigrations(config: MigrationConfig): Promise<void> {
    for await (const schemaName of this.data.schemas) {
      await this.processSchema(schemaName, config);
    }
  }

  /**
   * Processes all tables within a schema
   * @param schemaName - Name of the schema to process
   * @param config - Migration configuration
   */
  private async processSchema(schemaName: string, config: MigrationConfig): Promise<void> {
    const schemaTables = await DbUtils.getTables(this.knex, schemaName);

    for await (const tableName of schemaTables) {
      await this.processTable(schemaName, tableName, config);
    }
  }

  /**
   * Generates migration file for a specific table
   * @param schemaName - Name of the schema containing the table
   * @param tableName - Name of the table to process
   * @param config - Migration configuration
   */
  private async processTable(schemaName: string, tableName: string, config: MigrationConfig): Promise<void> {
    const tableForeignKeys = this.data.foreignKeys.filter(
      (x) => x.tableName === tableName && x.schema === schemaName
    );
    const columnsInfo = await TableColumns.list(this.knex, tableName, schemaName);
    const variables = MigrationUtils.initVariables();

    await MigrationUtils.generateTableInfo({ tableName, columnsInfo, schemaName, tableForeignKeys }, variables);

    const fileName = MigrationUtils.createFilename(config.outDir, `create_${schemaName}_${tableName}_table`, config.getTime());
    console.log('Generated table migration:', fileName);
    MigrationUtils.createFile(fileName, variables);
  }

  /**
   * Generates migration files for remaining database objects (indexes, foreign keys, views, triggers)
   * @param config - Migration configuration
   */
  private async generateRemainingMigrations(config: MigrationConfig): Promise<void> {
    await MigrationUtils.generateIndexes(this.data.indexes, config);
    await this.generateForeignKeysMigration(config);
    await MigrationUtils.generateViews(this.knex, this.data.schemas, config);
    await MigrationUtils.generateTriggers(this.knex, this.data.schemas, config);
  }

  /**
   * Generates migration file for all foreign keys
   * @param config - Migration configuration
   */
  private async generateForeignKeysMigration(config: MigrationConfig): Promise<void> {
    const fkVars = MigrationUtils.initVariables();
    MigrationUtils.generateForeignKeys(this.data.foreignKeys, fkVars);
    const fileName = MigrationUtils.createFilename(config.outDir, `create_create-foreign-keys`, config.getTime());
    console.log('Generated FK migration:', fileName);
    MigrationUtils.createFile(fileName, fkVars);
  }

  /**
   * Generates initial seeder file for database records
   * @param config - Migration configuration
   */
  private async generateInitialSeeders(config: MigrationConfig): Promise<void> {
    const seedFile = MigrationUtils.createFilename(
      FileHelper.join(config.outDir, '../seeders'),
      'add_init_records',
      config.getTime()
    );
    TemplateWriter.renderOut('seeder-init', seedFile);
  }
}
