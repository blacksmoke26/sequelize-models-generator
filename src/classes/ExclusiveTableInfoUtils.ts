/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

// utils
import TypeUtils from '~/classes/TypeUtils';
import { ConstraintType } from '~/classes/DbUtils';

// types
import type { ExclusiveColumnInfo } from '~/typings/utils';

/**
 * Utility class for handling exclusive table info.
 */
export default abstract class ExclusiveTableInfoUtils {
  /**
   * Checks if the datetime column's default value is set to CURRENT_TIMESTAMP.
   * @param columnInfo - The column info object containing table information.
   * @returns A boolean indicating whether the default value is CURRENT_TIMESTAMP.
   */
  public static isDefaultNow(columnInfo: ExclusiveColumnInfo): boolean {
    return (
      TypeUtils.isDate(columnInfo.element.udtName) &&
      columnInfo?.info?.column_default?.startsWith?.('CURRENT_')
    );
  }

  /**
   * Determines if the specified column is a primary key.
   * @param columnInfo - The column info object containing table information.
   * @returns A boolean indicating whether the column is a primary key.
   */
  public static isPrimaryKey(columnInfo: ExclusiveColumnInfo): boolean {
    return columnInfo.column.constraint === ConstraintType.PrimaryKey;
  }

  /**
   * Checks if the specified column is a serial key (e.g., using PostgreSQL's nextval and regclass functions).
   * @param columnInfo - The column info object containing table information.
   * @returns A boolean indicating whether the column is a serial key.
   */
  public static isSerialKey({ column }: ExclusiveColumnInfo): boolean {
    return /^nextval\('.+_seq'::regclass\)/.test(column?.defaultValue);
  }
}
