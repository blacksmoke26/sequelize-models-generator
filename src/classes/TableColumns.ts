import Case from 'case';
import knex from 'knex';

// utils
import DatabaseUtils from './DatabaseUtils';
import TypeUtils from './TypeUtils';

import {getJsType, pgToSequelize} from '~/constants/pg';

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
  maxLength: number | null;

  /** Whether the column allows NULL values */
  isNullable: boolean;

  /** Whether the column is primary or not */
  isPrimary: boolean;

  /** Whether the column is autoincrement or not */
  isAutoIncrement: boolean;

  /** The raw default value of the column */
  defaultValueRaw: string | null;

  /** The escaped default value of the column */
  defaultValue: string;

  /** The comment associated with the column */
  comment: string | null;

  /** Type equivalent of the column */
  jsType: string;

  /** Type equivalent of the column */
  sequelizeType: string;

  /** Type with length specification */
  sequelizeTypeLength: string;

  /** The TypeScript interface for the column type */
  typeInterface: string | null;
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
      const udtName = await DatabaseUtils.getColumnUdtType(
        knex,
        tableName,
        name,
      );
      const colType = info.type.toLowerCase();
      const sequelizeType = pgToSequelize[colType];
      const sequelizeTypeLength =
        sequelizeType + (info.maxLength ? `(${info.maxLength})` : '');

      const defaultValue = DatabaseUtils.escapeDefaultValue(
        info.defaultValue ?? (TypeUtils.isJsonize(info.type) ? '{}' : ''),
      );

      let jsType = getJsType(colType);

      if (jsType.startsWith('Array<') && udtName) {
        jsType = `Array<${getJsType(udtName)}>`;
      }

      list.push({
        name,
        propertyName: Case.camel(name),
        type: info.type,
        udtName,
        comment: await DatabaseUtils.getColumnComment(knex, tableName, name),
        maxLength: info.maxLength,
        isNullable: info.nullable,
        isPrimary: await DatabaseUtils.isPrimaryKeyColumn(knex, tableName, name),
        isAutoIncrement: await DatabaseUtils.isAutoIncrementColumn(knex, tableName, name),
        defaultValueRaw: info.defaultValue,
        defaultValue,
        jsType,
        sequelizeType,
        sequelizeTypeLength,
        typeInterface: TypeUtils.jsonToTypescript({
          columnType: info.type,
          columnName: name,
          tableName,
          defaultValue: (defaultValue ?? '{}'),
        }),
      });
    }

    return list;
  }
}
