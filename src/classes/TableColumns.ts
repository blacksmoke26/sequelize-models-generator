/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import Case from 'case';
import knex from 'knex';

// utils
import DatabaseUtils from './DatabaseUtils';
import TypeUtils from './TypeUtils';

import ColumnInfoUtils from '~/classes/ColumnInfoUtils';

// parsers
import SequelizeParser from '~/parsers/SequelizeParser';
import DefaultValueParser from '~/parsers/DefaultValueParser';
import TypeScriptTypeParser from '~/parsers/TypeScriptTypeParser';

/**
 * Interface representing detailed column information for database tables
 * Contains metadata about column types, constraints, defaults, and type mappings
 */
export interface ColumnInfo {
  /** The name of the column */
  name: string;

  /** The camelCase property name for the column */
  propertyName: string;

  /** The PostgreSQL type of the column */
  type: string;

  /** The UDT (User Defined Type) name of the column, if applicable */
  udtName: string | null;

  /** The maximum length of the column, if applicable */
  //maxLength: number | null;

  flags: {
    /** Whether the column allows NULL values */
    nullable: boolean;

    /** Whether the column is primary or not */
    primary: boolean;

    /** Whether the column is autoincrement or not */
    autoIncrement: boolean;

    /** Whether the date/time column is CURRENT_TIMESTAMP or not */
    defaultNow: boolean;
  };

  /** The raw default value of the column */
  defaultValueRaw: unknown | null;

  /** The escaped default value of the column */
  defaultValue: unknown;

  /** The comment associated with the column */
  comment: string | null;

  /** Type equivalent of the column */
  tsType: string;

  /** Type equivalent of the column */
  sequelizeType: string;

  /** Type with params specification */
  sequelizeTypeParams: string;

  /** The TypeScript interface for the column type */
  tsInterface: string | null;
}

/**
 * Abstract class for handling table column information and type mappings
 * Provides utilities for retrieving and processing column metadata from database
 */
export default abstract class TableColumns {
  /**
   * Retrieves detailed column information including type mappings and comments
   * @param knex - The knex instance
   * @param tableName - The name of the table
   * @returns Promise resolving to an array of ColumnInfo objects
   */
  public static async list(
    knex: knex.Knex,
    tableName: string,
  ): Promise<ColumnInfo[]> {
    const columns = await DatabaseUtils.getKnexTableColumnsInfo(
      knex,
      tableName,
    );

    const list: ColumnInfo[] = [];

    for await (const [name, info] of Object.entries(columns)) {
      const columnType = info.type.toLowerCase();
      const columnInfo = await DatabaseUtils.getColumnInfo(
        knex,
        tableName,
        name,
      );

      const [sequelizeType, sequelizeTypeParams] = await SequelizeParser.parse(
        knex,
        columnType,
        columnInfo,
      );

      const defaultValue = DefaultValueParser.parse(
        sequelizeType,
        columnType,
        columnInfo,
      ) as string;

      list.push({
        name,
        propertyName: Case.camel(name),
        type: info.type,
        udtName: ColumnInfoUtils.toUdtType(columnInfo),
        comment: await DatabaseUtils.getColumnComment(knex, tableName, name),
        defaultValueRaw: info.defaultValue,
        defaultValue,
        sequelizeType,
        sequelizeTypeParams,
        tsType: TypeScriptTypeParser.parse({
          columnType,
          columnInfo,
          sequelizeType,
          sequelizeTypeParams,
        }),
        tsInterface: TypeUtils.jsonToTypescript({
          columnType: info.type,
          columnName: name,
          tableName,
          defaultValue,
        }),
        flags: {
          nullable: info.nullable,
          primary: await DatabaseUtils.isPrimaryKeyColumn(
            knex,
            tableName,
            name,
          ),
          autoIncrement: await DatabaseUtils.isAutoIncrementColumn(
            knex,
            tableName,
            name,
          ),
          defaultNow: DefaultValueParser.isDefaultNow(
            sequelizeType,
            columnInfo,
          ),
        },
      });
    }

    return list;
  }
}
