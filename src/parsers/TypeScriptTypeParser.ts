/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

// classes
import ColumnInfoUtils from '~/classes/ColumnInfoUtils';

// utils
import { getJsType } from '~/constants/pg';

// types
import type { TableColumnInfo } from '~/typings/knex';
import type { SequelizeType } from '~/constants/sequelize';

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
}
