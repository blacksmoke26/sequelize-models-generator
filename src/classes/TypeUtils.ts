import {convertJsonToTs} from '~/libs/convertJsonToTs';
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
   * Converts a JSON column to TypeScript types
   * @param params - The detailed params
   * @returns TypeScript type definition if column is JSON/JSONB, otherwise null
   */
  public static jsonToTypescript(params: JsonToTypescriptParams): string | null {
    const {columnType, tableName, columnName, defaultValue} = params;

    return !this.isJsonize(columnType) ? defaultValue : (
      'export ' +
      convertJsonToTs(
        JSON.parse(defaultValue === 'null' ? '{}' : defaultValue),
        TableUtils.toJsonColumnTypeName(tableName, columnName),
      )
    );
  }
}
