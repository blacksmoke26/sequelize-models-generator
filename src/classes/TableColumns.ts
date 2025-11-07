/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import Case from 'case';
import { Knex } from 'knex';

// utils
import DbUtils from '~/classes/DbUtils';
import ColumnInfoUtils from '~/classes/ColumnInfoUtils';
import ExclusiveTableInfoUtils from '~/classes/ExclusiveTableInfoUtils';

// parsers
import SequelizeParser from '~/parsers/SequelizeParser';
import DefaultValueParser from '~/parsers/DefaultValueParser';
import TypeScriptTypeParser from '~/parsers/TypeScriptTypeParser';
import DataUtils from '~/classes/DataUtils';

/**
 * Interface representing detailed column information for database tables
 * Contains metadata about column types, constraints, defaults, and type mappings
 */
export interface ColumnInfo {
  /** The name of the table */
  table: string;

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
  defaultValueRaw: string | null;

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
   * @param [schemaName] - The name of the schema
   * @returns Promise resolving to an array of ColumnInfo objects
   */
  public static async list(knex: Knex, tableName: string, schemaName: string = 'public'): Promise<ColumnInfo[]> {
    const columnInfos: ColumnInfo[] = [];
    const tableColumns = await DbUtils.getExclusiveTableInfo(knex, tableName, schemaName);

    for (const columnInfo of tableColumns) {
      const { name, column, element, info } = columnInfo;

      const columnType = element.dataType.toLowerCase();

      const [sequelizeType = null, sequelizeTypeParams = null] = SequelizeParser.parse(columnInfo) || [];

      const defaultValue = DefaultValueParser.parse(sequelizeType, columnInfo) as string;

      let jsonbDataType = defaultValue;
      if (sequelizeType === 'JSONB' && jsonbDataType === '{}') {
        jsonbDataType = await DataUtils.getLongestJson(knex, { schemaName, tableName, columnName: column.name });
      }

      columnInfos.push({
        table: info.table_name,
        name,
        propertyName: Case.camel(name),
        type: columnType,
        udtName: ColumnInfoUtils.toUdtType(info),
        comment: column.comment,
        sequelizeType,
        sequelizeTypeParams,
        defaultValueRaw: info.column_default,
        defaultValue,
        tsType: TypeScriptTypeParser.parse({
          columnType,
          columnInfo: info,
          sequelizeType,
          sequelizeTypeParams,
        }),
        tsInterface: jsonbDataType?.trim?.()
          ? TypeScriptTypeParser.jsonToInterface({
              columnType: columnType,
              columnName: name,
              tableName,
              defaultValue: jsonbDataType,
            })
          : null,
        flags: {
          nullable: column.nullable,
          primary: ExclusiveTableInfoUtils.isPrimaryKey(columnInfo),
          autoIncrement: ExclusiveTableInfoUtils.isSerialKey(columnInfo),
          defaultNow: ExclusiveTableInfoUtils.isDefaultNow(columnInfo),
        },
      });
    }

    return columnInfos;
  }
}
