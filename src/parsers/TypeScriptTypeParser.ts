/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import { convertJsonToTs } from '@typeweaver/json2ts';

// utils
import { getJsType } from '~/constants/pg';
import TableUtils from '~/classes/TableUtils';
import TypeUtils from '~/classes/TypeUtils';
import ColumnInfoUtils from '~/classes/ColumnInfoUtils';

// types
import type { TableColumnInfo } from '~/typings/knex';
import type { SequelizeType } from '~/constants/sequelize';

interface JsonToTypescriptParams {
  /** The SQL column type */
  columnType: string;
  /** The default value of the column */
  defaultValue: string;
  /** The name of the table */
  tableName: string;
  /** The name of the column */
  columnName: string;
}

/**
 * Interface for arguments passed to the TypeScript type parser.
 */
export interface ParseArgs {
  /** The type of the column (e.g., 'integer', 'varchar'). */
  columnType: string;
  /** Detailed information about the column. */
  columnInfo: TableColumnInfo;
  /** The Sequelize type associated with the column. */
  sequelizeType: SequelizeType;
  /** Parameters for the Sequelize type, if any. */
  sequelizeTypeParams: string;
}

/**
 * Abstract class for parsing TypeScript types from column information.
 */
export default abstract class TypeScriptTypeParser {
  /**
   * Parses the TypeScript type for a given column.
   * @param params - The parsing arguments containing column and type information.
   * @returns The parsed TypeScript type as a string.
   */
  public static parse(params: ParseArgs): string {
    const { columnType, columnInfo } = params;

    const jsType = getJsType(columnType);

    const udtType = ColumnInfoUtils.toUdtType(columnInfo);

    if (jsType.startsWith('Array<') && udtType) {
      return `Array<${getJsType(udtType)}>`;
    }

    return jsType;
  }

  /**
   * Converts a JSON column to TypeScript interfaces
   * @param params - The detailed params containing column information
   * @returns TypeScript type definition if column is JSON/JSONB, otherwise the default value
   */
  public static jsonToInterface(
    params: JsonToTypescriptParams,
  ): string | null {
    const { columnType, tableName, columnName, defaultValue } = params;

    return !TypeUtils.isJSON(columnType)
      ? defaultValue
      : convertJsonToTs(
        JSON.parse(defaultValue === 'null' ? '{}' : defaultValue),
        TableUtils.toJsonColumnTypeName(tableName, columnName),
      );
  }

  /**
   * Combines multiple TypeScript interfaces into a single interface.
   * @param tsInterface - Interfaces to combine.
   * @returns The combined TypeScript interface as a string.
   */
  public static combineInterfaces(
    tsInterface: string
  ): string {
    const [first, ...rest] = tsInterface.split('interface ').filter(x => x?.trim?.());
    let str = first;

    for (const text of rest) {
      const [, name = '', props = ''] = text.match?.(/([A-Z][^ ]+) \{([^}]+)}/) ?? [];
      const fields = props?.replace?.(/\n+|\s+/g, ' ')?.replace?.(/\s+/g, ' ')?.trim?.() ?? '';
      str = str.replaceAll(`${name};`, `{ ${fields} };`)
    }
    return `interface ${str}`;
  }
}
