/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import { TableColumnInfo } from '~/typings/knex';

/**
 * Utility class for processing column information from database metadata.
 * Provides methods to extract and transform column properties like numeric precision/scale and UDT types.
 */
export default abstract class ColumnInfoUtils {
  /**
   * Converts column information to numeric precision and scale values.
   * @param columnInfo - The column information object or null
   * @returns An array containing numeric precision and scale, or [null, null] if columnInfo is null
   */
  public static toNumericPrecision(columnInfo: TableColumnInfo | null) {
    return !columnInfo
      ? [null, null]
      : [+columnInfo.numeric_precision, +columnInfo.numeric_scale];
  }

  /**
   * Extracts and normalizes the UDT (User-Defined Type) name from column information.
   * @param columnInfo - The column information object or null
   * @returns The normalized UDT name in lowercase without underscores, or null if not available
   */
  public static toUdtType(columnInfo: TableColumnInfo | null): string | null {
    return (
      columnInfo?.udt_name
        ?.toString?.()
        ?.trim?.()
        ?.toLowerCase?.()
        ?.replace('_', '') ?? null
    );
  }
}
