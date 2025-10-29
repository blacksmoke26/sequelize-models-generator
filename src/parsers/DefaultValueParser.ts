/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import { SequelizeType } from '~/constants/sequelize';
import { TableColumnInfo } from '~/typings/knex';

/**
 * Utility class for parsing and handling default values from database columns.
 * Provides methods to determine if a default value is a current timestamp/date/time
 * and to parse default values into JavaScript-compatible representations.
 */
export default abstract class DefaultValueParser {
  /**
   * Parses the default value of a database column and converts it to a JavaScript-compatible string representation.
   *
   * @param sequelizeType - The Sequelize type of the column.
   * @param pgType - The PostgreSQL type of the column (currently unused but kept for compatibility).
   * @param columnInfo - Information about the database column, including its default value.
   * @returns A string representation of the default value suitable for use in JavaScript/TypeScript code.
   *
   * @example
   * // For a column with default value 'CURRENT_TIMESTAMP'
   * const result = DefaultValueParser.parse('DATE', 'timestamp', { column_default: 'CURRENT_TIMESTAMP' });
   * // Returns 'null'
   *
   * @example
   * // For a JSON column with default value '{}'
   * const result = DefaultValueParser.parse('JSON', 'json', { column_default: '{}' });
   * // Returns '{}'
   *
   * @example
   * // For a string column with default value 'hello'
   * const result = DefaultValueParser.parse('STRING', 'varchar', { column_default: '\'hello\'' });
   * // Returns '\'hello\''
   */
  public static parse(
    sequelizeType: SequelizeType,
    pgType: string,
    columnInfo: TableColumnInfo,
  ): unknown {
    const value = String(columnInfo?.column_default || '').trim();

    let newValue = value;

    // Remove PostgreSQL type casting and default value suffixes
    if (newValue.includes('::')) {
      newValue = newValue.replace(/::.+$/i, '');
    }

    // Remove quotes from string values
    newValue = newValue.replace(/^'/, '').replace(/'$/, '');

    if (['JSON', 'JSONB'].includes(sequelizeType)) {
      return !newValue?.trim?.() || value === 'null' ? '{}' : newValue;
    }

    // Remove PostgreSQL sequence function calls
    if (newValue.includes('nextval')) {
      return '';
    }

    // Handle CURRENT_TIMESTAMP
    if (newValue === 'CURRENT_TIMESTAMP') {
      return 'null';
    }

    // Handle array types
    if (newValue.toUpperCase().includes('ARRAY')) {
      return '[]';
    }

    // Handle NULL values
    if (newValue.toUpperCase().includes('NULL')) {
      return 'null';
    }

    // Handle boolean values
    if (sequelizeType === 'BOOLEAN') {
      return newValue === 'true';
    }

    // Handle numeric values
    if (/^-?\d+(\.\d+)?$/.test(newValue)) {
      return newValue;
    }

    // Handle string values (keep quotes for non-empty strings)
    if (newValue.length > 0) {
      return `'${newValue}'`;
    }

    return newValue;
  }

  /**
   * Processes and escapes default values from the database
   * @param value - The raw default value from the database
   * @returns The processed default value
   */
  public static parseString(value: string): string {
    let defaultValueString = String(value);
    if (defaultValueString.includes('::')) {
      defaultValueString = defaultValueString.replace(/::.+$/i, '');
    }

    if (defaultValueString === 'CURRENT_TIMESTAMP') {
      defaultValueString = 'null';
    } else if (defaultValueString.toUpperCase().includes('ARRAY')) {
      defaultValueString = '[]';
    } else if (defaultValueString.toUpperCase().includes('NULL')) {
      defaultValueString = 'null';
    } else if (defaultValueString.startsWith('nextval')) {
      defaultValueString = '';
    }

    return defaultValueString.replace(/^'/, '').replace(/'$/, '');
  }
}
