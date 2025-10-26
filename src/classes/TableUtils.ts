import Case from 'case';
import pluralize from 'pluralize';

/**
 * Utility class for table-related operations
 * Provides methods for naming conventions, type checking, and string transformations
 */
export default abstract class TableUtils {
  /**
   * Converts a table name to a model name in PascalCase
   * @param tableName - The table name to convert
   * @returns The model name in PascalCase (singular form)
   */
  public static table2ModelName(tableName: string): string {
    return Case.pascal(pluralize.singular(tableName));
  }

  /**
   * Converts a column name to camelCase
   * @param name - The column name to convert
   * @returns The column name in camelCase
   */
  public static toColumnName(name: string): string {
    return Case.camel(name);
  }

  /**
   * Generates a TypeScript type name for JSON column data
   * @param tableName - The name of the table
   * @param columnName - The name of the column
   * @param postfix - Optional postfix to append to the type name (defaults to 'data')
   * @returns The generated TypeScript type name in PascalCase
   */
  public static toJsonColumnTypeName(
    tableName: string,
    columnName: string,
    postfix: string = 'data',
  ): string {
    return Case.pascal(
      `${this.table2ModelName(tableName)}_${columnName}${
        postfix.length ? '_' + postfix : ''
      }`,
    );
  }
}
