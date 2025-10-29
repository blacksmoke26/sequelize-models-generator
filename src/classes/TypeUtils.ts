/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

/**
 * Utility class for type checking and conversion operations
 */
export default abstract class TypeUtils {
  /**
   * Checks if a field type is a numeric type
   * @param fieldType - The field type to check
   * @returns True if the type is a numeric type
   */
  public static isNumber(fieldType: string): boolean {
    return /^(smallint|mediumint|tinyint|int|bigint|float|money|smallmoney|double|decimal|numeric|real|oid)/i.test(
      fieldType,
    );
  }

  /**
   * Checks if a field type is a boolean type
   * @param fieldType - The field type to check
   * @returns True if the type is a boolean type
   */
  public static isBoolean(fieldType: string): boolean {
    return /^(boolean|bit)/i.test(fieldType);
  }

  /**
   * Checks if a field type is a date/time type
   * @param fieldType - The field type to check
   * @returns True if the type is a date/time type
   */
  public static isDate(fieldType: string): boolean {
    return /^(datetime|timestamp)/i.test(fieldType);
  }

  /**
   * Checks if a field type is a string type
   * @param fieldType - The field type to check
   * @returns True if the type is a string type
   */
  public static isString(fieldType: string): boolean {
    return /^(char|nchar|string|varying|varchar|nvarchar|text|longtext|mediumtext|tinytext|ntext|uuid|uniqueidentifier|date|time|inet|cidr|macaddr)/i.test(
      fieldType,
    );
  }

  /**
   * Checks if a field type is an array or range type
   * @param fieldType - The field type to check
   * @returns True if the type is an array or range type
   */
  public static isArray(fieldType: string): boolean {
    return /(^array)|(range$)/i.test(fieldType);
  }

  /**
   * Checks if a field type is an enum type
   * @param fieldType - The field type to check
   * @returns True if the type is an enum type
   */
  public static isEnum(fieldType: string): boolean {
    return /^(enum)/i.test(fieldType);
  }

  /**
   * Checks if a field type is a JSON type
   * @param fieldType - The field type to check
   * @returns True if the type is JSON or JSONB
   */
  public static isJSON(fieldType: string): boolean {
    return /^(json|jsonb)/i.test(fieldType);
  }

  /**
   * Retrieves the precision and scale range for PostgreSQL decimal/numeric types
   * @param typeDefinition - The PostgreSQL type definition string
   * @returns Object containing precision and scale, or null if not applicable
   */
  public static parseDecimalRange(
    typeDefinition: string,
  ): [number, number] | null {
    const match =
      typeDefinition.match(/^numeric\((\d+),\s*(\d+)\)$/i) ||
      typeDefinition.match(/^decimal\((\d+),\s*(\d+)\)$/i);

    return !match ? null : [parseInt(match[1], 10), parseInt(match[2], 10)];
  }
}
