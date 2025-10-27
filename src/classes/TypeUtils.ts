/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import { convertJsonToTs } from '~/libs/convertJsonToTs';
import TableUtils from './TableUtils';

interface JsonToTypescriptParams {
  /** The SQL column type */
  columnType: string;
  /** The name of the table */
  defaultValue: string;
  /** The name of the column */
  tableName: string;
  /** The default value of the column */
  columnName: string;
}

export default abstract class TypeUtils {
  /**
   * Checks if a data type is a JSON type
   * @param dataType - The data type to check
   * @returns True if the type is JSON or JSONB
   */
  public static isJsonize(dataType: string): boolean {
    return ['json', 'jsonb'].includes(dataType.toLowerCase());
  }

  /**
   * Checks if a data type is a JSON type
   * @param dataType - The data type to check
   * @returns True if the type is JSON or JSONB
   */
  public static isDateTime(dataType: string): boolean {
    return ['json', 'jsonb'].includes(dataType.toLowerCase());
  }

  /**
   * Converts a JSON column to TypeScript types
   * @param params - The detailed params
   * @returns TypeScript type definition if column is JSON/JSONB, otherwise null
   */
  public static jsonToTypescript(params: JsonToTypescriptParams): string | null {
    const { columnType, tableName, columnName, defaultValue } = params;

    return !this.isJsonize(columnType)
      ? defaultValue
      : 'export ' + convertJsonToTs(JSON.parse(defaultValue === 'null' ? '{}' : defaultValue), TableUtils.toJsonColumnTypeName(tableName, columnName));
  }

  /**
   * Retrieves the precision and scale range for PostgreSQL decimal/numeric types
   * @param typeDefinition - The PostgreSQL type definition string
   * @returns Object containing precision and scale, or null if not applicable
   */
  public static getDecimalRange(typeDefinition: string): { precision: number; scale: number } | null {
    const match = typeDefinition.match(/^numeric\((\d+),(\d+)\)$/i) || typeDefinition.match(/^decimal\((\d+),(\d+)\)$/i);

    if (!match) {
      return null;
    }

    return {
      precision: parseInt(match[1], 10),
      scale: parseInt(match[2], 10),
    };
  }
}
